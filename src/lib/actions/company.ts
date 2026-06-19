"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";

async function assertSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("users").select("role, full_name, email, company_id").eq("id", user.id).single();
  if (!profile || profile.role !== "super_admin") return null;
  return { id: user.id, ...profile };
}

export async function updateCompanyAction(formData: FormData) {
  const actor = await assertSuperAdmin();
  if (!actor) return { error: "Unauthorized." };

  const id   = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  if (!id || !name) return { error: "Company name is required." };

  const admin = createAdminClient();
  const updateData: Record<string, unknown> = { name };

  const logoFile = formData.get("logo") as File | null;
  if (logoFile && logoFile.size > 0) {
    const path = `${id}/logo.webp`;
    const { error: uploadError } = await admin.storage
      .from("company-logos")
      .upload(path, logoFile, { upsert: true, contentType: "image/webp" });
    if (uploadError) {
      // Return early so we never save a logo_url that points at a missing file
      return { error: `Logo upload failed: ${uploadError.message}` };
    }
    const { data: { publicUrl } } = admin.storage.from("company-logos").getPublicUrl(path);
    updateData.logo_url = `${publicUrl}?t=${Date.now()}`;
  }

  const { error } = await admin.from("companies").update(updateData).eq("id", id);
  if (error) return { error: error.message };

  await logAudit({
    actor_id: actor.id, actor_email: actor.email, actor_name: actor.full_name,
    action: "company_updated", target_type: "company", target_id: id, target_label: name,
    details: { fields: Object.keys(updateData) },
  });

  revalidatePath("/super-admin/companies");
  revalidatePath("/super-admin");
  return { success: true };
}

export async function archiveCompanyAction(companyId: string) {
  const actor = await assertSuperAdmin();
  if (!actor) return { error: "Unauthorized." };

  const admin = createAdminClient();
  const { data: company } = await admin.from("companies").select("name, is_archived").eq("id", companyId).single();
  if (!company) return { error: "Company not found." };

  const newArchived = !company.is_archived;
  const { error } = await admin.from("companies").update({ is_archived: newArchived }).eq("id", companyId);
  if (error) return { error: error.message };

  await logAudit({
    actor_id: actor.id, actor_email: actor.email, actor_name: actor.full_name,
    action: newArchived ? "company_archived" : "company_unarchived",
    target_type: "company", target_id: companyId, target_label: company.name,
  });

  revalidatePath("/super-admin/companies");
  return { success: true, archived: newArchived };
}

export async function deleteCompanyAction(companyId: string) {
  const actor = await assertSuperAdmin();
  if (!actor) return { error: "Unauthorized." };

  const admin = createAdminClient();
  const { data: company } = await admin.from("companies").select("name").eq("id", companyId).single();
  if (!company) return { error: "Company not found." };

  // Cascade delete: users, courses, etc. must be deleted first
  // (Assumes FK constraints with ON DELETE CASCADE or SET NULL)
  const { error } = await admin.from("companies").delete().eq("id", companyId);
  if (error) return { error: error.message };

  await logAudit({
    actor_id: actor.id, actor_email: actor.email, actor_name: actor.full_name,
    action: "company_deleted", target_type: "company", target_id: companyId, target_label: company.name,
  });

  revalidatePath("/super-admin/companies");
  revalidatePath("/super-admin");
  return { success: true };
}

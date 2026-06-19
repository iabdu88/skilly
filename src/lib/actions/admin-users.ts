"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import type { UserRole } from "@/types/database";

async function assertSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("users").select("role, full_name, email, company_id").eq("id", user.id).single();
  if (!profile || profile.role !== "super_admin") return null;
  return { id: user.id, ...profile };
}

export async function changeUserRoleAction(userId: string, newRole: UserRole) {
  const actor = await assertSuperAdmin();
  if (!actor) return { error: "Unauthorized." };

  const admin = createAdminClient();
  const { data: target } = await admin.from("users").select("full_name, email, role").eq("id", userId).single();
  if (!target) return { error: "User not found." };

  if (target.role === newRole) return { success: true };

  const { error } = await admin.from("users").update({ role: newRole }).eq("id", userId);
  if (error) return { error: error.message };

  await logAudit({
    actor_id: actor.id, actor_email: actor.email, actor_name: actor.full_name,
    action: "user_role_changed", target_type: "user", target_id: userId, target_label: target.full_name,
    details: { from: target.role, to: newRole },
  });

  revalidatePath("/super-admin/users");
  return { success: true };
}

export async function toggleUserActiveAction(userId: string, makeActive: boolean) {
  const actor = await assertSuperAdmin();
  if (!actor) return { error: "Unauthorized." };

  const admin = createAdminClient();
  const { data: target } = await admin.from("users").select("full_name, email").eq("id", userId).single();
  if (!target) return { error: "User not found." };

  const { error } = await admin.from("users").update({
    is_active: makeActive,
    deactivated_at: makeActive ? null : new Date().toISOString(),
  }).eq("id", userId);
  if (error) return { error: error.message };

  // Also disable auth account
  if (!makeActive) {
    await admin.auth.admin.updateUserById(userId, { ban_duration: "876600h" }); // ~100 years
  } else {
    await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
  }

  await logAudit({
    actor_id: actor.id, actor_email: actor.email, actor_name: actor.full_name,
    action: makeActive ? "user_reactivated" : "user_deactivated",
    target_type: "user", target_id: userId, target_label: target.full_name,
  });

  revalidatePath("/super-admin/users");
  return { success: true };
}

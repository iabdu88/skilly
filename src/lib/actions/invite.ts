"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dashboardPath } from "@/lib/auth";
import type { UserRole } from "@/types/database";

function generateCode(): string {
  // Unambiguous chars — no O/0, I/1, S/5
  const chars = "ABCDEFGHJKLMNPQRTUVWXYZ2346789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function generateInviteCode(formData: FormData) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("users")
    .select("role, company_id")
    .eq("id", authUser.id)
    .single();
  if (!profile) return { error: "User profile not found." };

  const admin = createAdminClient();
  const code  = generateCode();

  if (profile.role === "super_admin") {
    const company_name = (formData.get("company_name") as string)?.trim();
    if (!company_name) return { error: "Company name is required." };
    const company_name_ar = (formData.get("company_name_ar") as string)?.trim() || null;

    // Create company immediately — trainer is linked when they sign up
    const { data: company, error: companyError } = await admin
      .from("companies")
      .insert({ name: company_name, name_ar: company_name_ar })
      .select("id")
      .single();
    if (companyError || !company) return { error: companyError?.message ?? "Failed to create company." };

    const { error: insertError } = await admin.from("invite_codes").insert({
      code,
      role: "trainer",
      company_id: company.id,
      company_name,
      created_by: authUser.id,
    });

    if (insertError) {
      await admin.from("companies").delete().eq("id", company.id);
      return { error: insertError.message };
    }

    // Upload logo after the invite insert succeeds, not before — if the insert
    // fails we roll back the company row, and an orphaned logo in Storage would
    // have no company record pointing at it (no cascade delete on Storage).
    const logoFile = formData.get("logo") as File | null;
    if (logoFile && logoFile.size > 0) {
      const path = `${company.id}/logo.webp`;
      const { error: uploadError } = await admin.storage
        .from("company-logos")
        .upload(path, logoFile, { upsert: true, contentType: "image/webp" });
      if (uploadError) {
        // Non-fatal: company + invite code are already created. Skip the logo
        // rather than saving a logo_url that points at a missing file.
        console.error("[invite] logo upload failed:", uploadError.message);
      } else {
        const { data: { publicUrl } } = admin.storage.from("company-logos").getPublicUrl(path);
        // ?t= cache-busts the CDN URL so re-uploads show immediately instead
        // of serving the previous image from edge caches for up to 24 hours.
        await admin.from("companies").update({ logo_url: `${publicUrl}?t=${Date.now()}` }).eq("id", company.id);
      }
    }

    return { code, company_name };

  } else if (profile.role === "trainer") {
    const role = formData.get("role") as string;
    if (!["manager", "employee"].includes(role)) return { error: "Invalid role." };
    if (!profile.company_id) return { error: "You are not assigned to a company." };

    const { error: insertError } = await admin.from("invite_codes").insert({
      code,
      role,
      company_id: profile.company_id,
      created_by: authUser.id,
    });

    if (insertError) return { error: insertError.message };
    return { code };

  } else {
    return { error: "Unauthorized." };
  }
}

export async function redeemInviteCode(formData: FormData) {
  const email     = (formData.get("email") as string)?.trim().toLowerCase();
  const password  = formData.get("password") as string;
  const full_name = (formData.get("full_name") as string)?.trim();
  const code      = (formData.get("code") as string)?.trim().toUpperCase();

  if (!email || !password || !full_name || !code) return { error: "All fields are required." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const admin = createAdminClient();

  // 1. Validate invite code — company already exists
  const { data: invite, error: lookupError } = await admin
    .from("invite_codes")
    .select("*")
    .eq("code", code)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (lookupError || !invite) return { error: "Invalid or expired invite code." };
  if (!invite.company_id)    return { error: "This invite code is not linked to a company. Please contact your administrator." };

  // 2. Create auth user — email_confirm: false so Supabase sends a confirmation email
  const { data: authData, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
  });

  if (createError || !authData.user) {
    if (createError?.message.toLowerCase().includes("already")) {
      return { error: "An account with this email already exists." };
    }
    return { error: createError?.message ?? "Failed to create account." };
  }

  const userId = authData.user.id;

  // 3. Create user profile
  const { error: profileError } = await admin.from("users").insert({
    id: userId,
    email,
    full_name,
    role: invite.role as UserRole,
    company_id: invite.company_id,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return { error: "Failed to create user profile. Please try again." };
  }

  // 4. Mark invite as used
  await admin.from("invite_codes")
    .update({ used_at: new Date().toISOString(), used_by: userId })
    .eq("id", invite.id);

  // 5. Signal success — user must confirm email before signing in
  return { success: true, email };
}

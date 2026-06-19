"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { dashboardPath } from "@/lib/auth";
import type { UserRole } from "@/types/database";

export async function loginAction(formData: FormData) {
  const email    = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication failed." };

  const { data: profile } = await supabase
    .from("users")
    .select("role, current_streak, longest_streak, last_active_date")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "User profile not found." };

  // Update daily login streak
  const today = new Date().toISOString().split("T")[0];
  if (profile.last_active_date !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const newStreak = profile.last_active_date === yesterday ? (profile.current_streak ?? 0) + 1 : 1;
    const longest   = Math.max(newStreak, profile.longest_streak ?? 0);

    await supabase.from("users").update({
      current_streak:   newStreak,
      longest_streak:   longest,
      last_active_date: today,
    }).eq("id", user.id);

    // Award "On Fire" badge at 7-day streak
    if (newStreak >= 7) {
      try {
        const admin = createAdminClient();
        const { data: badge } = await admin.from("badges").select("id").eq("slug", "on_fire").single();
        if (badge) {
          await admin.from("user_badges").insert({ user_id: user.id, badge_id: badge.id });
        }
      } catch { /* badge already awarded — ignore unique constraint */ }
    }
  }

  return { redirectTo: dashboardPath(profile.role as UserRole) };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  const supabase = await createClient();
  const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function resetPasswordAction(formData: FormData) {
  const password = formData.get("password") as string;
  if (!password || password.length < 6) return { error: "Password must be at least 6 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { redirectTo: "/login" };

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  return { redirectTo: profile ? dashboardPath(profile.role as UserRole) : "/login" };
}

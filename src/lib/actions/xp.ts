"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { XP_REWARDS } from "@/lib/gamification";

const BADGE_TRIGGERS: Record<string, string> = {
  lesson_complete: "first_step",
  quiz_perfect:    "quiz_ace",
  course_complete: "course_graduate",
  outfit_submit:   "style_icon",
};

// admin = for privileged inserts into user_badges; supabase = SSR client with user session for RPC calls
async function tryAwardBadge(
  admin: ReturnType<typeof createAdminClient>,
  supabase: SupabaseClient,
  userId: string,
  slug: string
): Promise<{ name: string; icon: string } | null> {
  const { data: badge } = await admin.from("badges").select("id, name, icon, xp_reward").eq("slug", slug).single();
  if (!badge) return null;

  const { error } = await admin.from("user_badges").insert({ user_id: userId, badge_id: badge.id });
  if (error) return null; // unique constraint → already awarded

  if (badge.xp_reward > 0) {
    // Use SSR client so auth.uid() matches inside the SECURITY DEFINER function
    await supabase.rpc("increment_points", { uid: userId, amt: badge.xp_reward });
    await supabase.from("xp_events").insert({
      user_id: userId,
      type: "badge_earned",
      xp: badge.xp_reward,
      metadata: { slug },
    });
  }

  return { name: badge.name, icon: badge.icon };
}

export interface AwardXPResult {
  xp: number;
  totalPoints: number;
  newBadges: { name: string; icon: string }[];
}

export async function awardXP(
  type: string,
  metadata?: Record<string, unknown>
): Promise<AwardXPResult> {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { xp: 0, totalPoints: 0, newBadges: [] };

  const xp = XP_REWARDS[type] ?? 0;
  if (xp === 0) return { xp: 0, totalPoints: 0, newBadges: [] };

  const { data: profile } = await supabase
    .from("users")
    .select("company_id, points")
    .eq("id", authUser.id)
    .single();

  // Insert XP event
  await supabase.from("xp_events").insert({
    user_id:    authUser.id,
    company_id: profile?.company_id ?? null,
    type,
    xp,
    metadata:   metadata ?? null,
  });

  // Increment points via SECURITY DEFINER RPC (requires user session — SSR client provides it)
  await supabase.rpc("increment_points", { uid: authUser.id, amt: xp });

  const newTotalPoints = (profile?.points ?? 0) + xp;
  const admin = createAdminClient();
  const newBadges: { name: string; icon: string }[] = [];

  const badgeSlug = BADGE_TRIGGERS[type];
  if (badgeSlug) {
    if (type === "lesson_complete") {
      // Only award first_step on the very first lesson completion
      const { count } = await supabase
        .from("xp_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", authUser.id)
        .eq("type", "lesson_complete");
      if ((count ?? 0) <= 1) {
        const badge = await tryAwardBadge(admin, supabase, authUser.id, "first_step");
        if (badge) newBadges.push(badge);
      }
    } else {
      const badge = await tryAwardBadge(admin, supabase, authUser.id, badgeSlug);
      if (badge) newBadges.push(badge);
    }
  }

  return { xp, totalPoints: newTotalPoints, newBadges };
}

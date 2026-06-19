import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { BadgeGrid } from "@/components/gamification/BadgeGrid";
import { Flame } from "lucide-react";

export default async function ProfilePageContent() {
  const user     = await requireAuth();
  const supabase = await createClient();

  const { data: badges } = await supabase
    .from("user_badges")
    .select("awarded_at, badge:badges(slug, name, description, icon)")
    .eq("user_id", user.id)
    .order("awarded_at", { ascending: false });

  type EarnedBadge = {
    awarded_at: string;
    badge: { slug: string; name: string; description: string; icon: string } | null;
  };
  const earnedBadges = (badges ?? []) as unknown as EarnedBadge[];
  const validBadges = earnedBadges.filter((b) => b.badge !== null) as Array<{
    awarded_at: string;
    badge: { slug: string; name: string; description: string; icon: string };
  }>;

  return (
    <>
      <Header title="My Profile" userId={user.id} />
      <main className="p-4 lg:p-6 max-w-xl space-y-5">
        {/* Profile edit form */}
        <div className="bg-card rounded-2xl p-5 border border-border">
          <h3 className="font-semibold text-foreground mb-4">Profile</h3>
          <ProfileEditForm
            user={{
              id:         user.id,
              full_name:  user.full_name,
              bio:        user.bio,
              email:      user.email,
              avatar_url: user.avatar_url,
            }}
          />
        </div>

        {/* Stats: Level + Streak */}
        <div className="bg-card rounded-2xl p-5 border border-border space-y-4">
          <h3 className="font-semibold text-foreground">Stats</h3>

          <LevelBadge xp={user.points} showBar size="md" />

          <div className="flex items-center gap-6 pt-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{user.current_streak ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Day streak</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-muted/20 flex items-center justify-center">
                <Flame className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{user.longest_streak ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Best streak</p>
              </div>
            </div>

            <div className="ml-auto text-right">
              <p className="text-sm font-bold text-foreground">{user.points.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Total XP</p>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="bg-card rounded-2xl p-5 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Badges</h3>
            <span className="text-xs text-muted-foreground">{validBadges.length} earned</span>
          </div>
          <BadgeGrid badges={validBadges} />
        </div>
      </main>
    </>
  );
}

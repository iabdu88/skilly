import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { BookOpen, Award, Trophy, Flame } from "lucide-react";

export default async function EmployeeDashboard() {
  const [user, t] = await Promise.all([getUser(), getTranslations("dashboard")]);
  const supabase = await createClient();

  const [
    { count: completedLessons },
    { count: certificates },
    { data: fullUser },
    { data: recentBadges },
  ] = await Promise.all([
    supabase.from("lesson_progress").select("*", { count: "exact", head: true })
      .eq("user_id", user!.id).eq("status", "completed"),
    supabase.from("certificates").select("*", { count: "exact", head: true })
      .eq("user_id", user!.id),
    supabase.from("users").select("current_streak, longest_streak, last_active_date")
      .eq("id", user!.id).single(),
    supabase.from("user_badges")
      .select("awarded_at, badge:badges(slug, name, icon)")
      .eq("user_id", user!.id)
      .order("awarded_at", { ascending: false })
      .limit(4),
  ]);

  const streak = fullUser?.current_streak ?? 0;

  const stats = [
    { labelKey: "lessonsDone", value: completedLessons ?? 0, icon: BookOpen, color: "text-primary" },
    { labelKey: "certificates", value: certificates ?? 0,    icon: Award,    color: "text-accent" },
    { labelKey: "totalXP",      value: user!.points,          icon: Trophy,   color: "text-yellow-400" },
    { labelKey: "dayStreak",    value: streak,                icon: Flame,    color: "text-orange-400" },
  ];

  return (
    <>
      <Header title={t("welcome")} userId={user!.id} />
      <main className="p-4 lg:p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {t("welcome")}, {user!.full_name.split(" ")[0]} 👋
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">{t("keepUpGreatWork")}</p>
          </div>
          <div className="shrink-0 bg-card border border-border rounded-xl px-3 py-2">
            <LevelBadge xp={user!.points} showBar size="sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.labelKey} className="bg-card rounded-2xl p-4 border border-border">
              <s.icon className={`w-6 h-6 ${s.color} mb-3`} />
              <p className="text-2xl font-bold text-foreground">{s.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t(s.labelKey as Parameters<typeof t>[0])}</p>
            </div>
          ))}
        </div>

        {recentBadges && recentBadges.length > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-sm font-semibold text-foreground mb-3">{t("recentBadges")}</p>
            <div className="flex gap-3">
              {(recentBadges as unknown as Array<{ awarded_at: string; badge: { slug: string; name: string; icon: string } | null }>).map((ub) =>
                ub.badge && (
                  <div key={ub.badge.slug} className="flex flex-col items-center gap-1" title={ub.badge.name}>
                    <span className="text-2xl">{ub.badge.icon}</span>
                    <p className="text-[10px] text-muted-foreground text-center leading-tight w-14 truncate">{ub.badge.name}</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

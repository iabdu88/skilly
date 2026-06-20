import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { StarCard } from "@/components/stars/StarCard";
import type { Star, User } from "@/types/database";

function getWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default async function EmployeeStarsPage() {
  const [user, t] = await Promise.all([getUser(), getTranslations("stars")]);
  const supabase = await createClient();

  const now = new Date();
  const weekPeriod = `Week ${getWeek(now)} ${now.getFullYear()}`;
  const monthPeriod = now.toLocaleString("en", { month: "long", year: "numeric" });

  const { data: stars } = await supabase
    .from("stars")
    .select("*, user:users(id, full_name, avatar_url)")
    .eq("company_id", user!.company_id!)
    .order("created_at", { ascending: false })
    .limit(20);

  const weekStar = (stars as (Star & { user: User })[])?.find(
    (s) => s.type === "week" && s.period === weekPeriod
  );
  const monthStar = (stars as (Star & { user: User })[])?.find(
    (s) => s.type === "month" && s.period === monthPeriod
  );

  return (
    <>
      <Header title={t("title")} userId={user!.id} />
      <main className="p-4 lg:p-6 space-y-6 max-w-3xl">
        <h2 className="text-xl font-bold text-foreground">{t("title")}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <StarCard type="week" user={weekStar?.user ?? null} period={weekPeriod} />
          <StarCard type="month" user={monthStar?.user ?? null} period={monthPeriod} />
        </div>
      </main>
    </>
  );
}

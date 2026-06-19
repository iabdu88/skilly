import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { StarCard } from "@/components/stars/StarCard";
import { StarPickerForm } from "@/components/stars/StarPickerForm";
import type { Star, User } from "@/types/database";

export default async function TrainerStarsPage() {
  const user = await getUser();
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

  const { data: employees } = await supabase
    .from("users")
    .select("id, full_name, avatar_url")
    .eq("company_id", user!.company_id!)
    .eq("role", "employee");

  return (
    <>
      <Header title="Stars Board" userId={user!.id} />
      <main className="p-4 lg:p-6 space-y-6 max-w-3xl">
        <h2 className="text-xl font-bold text-foreground">Stars Board</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <StarCard type="week" user={weekStar?.user ?? null} period={weekPeriod} />
          <StarCard type="month" user={monthStar?.user ?? null} period={monthPeriod} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {!weekStar && (
            <StarPickerForm
              type="week"
              period={weekPeriod}
              companyId={user!.company_id!}
              chosenBy={user!.id}
              employees={employees as User[]}
            />
          )}
          {!monthStar && (
            <StarPickerForm
              type="month"
              period={monthPeriod}
              companyId={user!.company_id!}
              chosenBy={user!.id}
              employees={employees as User[]}
            />
          )}
        </div>

        {/* History */}
        {stars && stars.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-3">History</h3>
            <div className="space-y-2">
              {(stars as (Star & { user: User })[]).map((s) => (
                <div key={s.id} className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.type === "week" ? "bg-yellow-400/10 text-yellow-400" : "bg-accent/10 text-accent"}`}>
                    {s.type === "week" ? "Week" : "Month"}
                  </span>
                  <span className="flex-1 text-sm font-medium text-foreground">{s.user?.full_name}</span>
                  <span className="text-xs text-muted-foreground">{s.period}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function getWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

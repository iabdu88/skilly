import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { LeaderboardRealtime } from "@/components/leaderboard/LeaderboardRealtime";

export default async function EmployeeLeaderboardPage() {
  const [user, t] = await Promise.all([getUser(), getTranslations("leaderboard")]);
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, points")
    .eq("company_id", user!.company_id!)
    .eq("role", "employee")
    .order("points", { ascending: false })
    .limit(50);

  return (
    <>
      <Header title={t("title")} userId={user!.id} />
      <main className="p-4 lg:p-6 max-w-2xl space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("title")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
        <LeaderboardRealtime
          initialUsers={users ?? []}
          currentUserId={user!.id}
          companyId={user!.company_id!}
        />
      </main>
    </>
  );
}

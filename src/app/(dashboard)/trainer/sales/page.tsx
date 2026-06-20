import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import type { SalesEntry, User } from "@/types/database";

export default async function TrainerSalesPage() {
  const [user, t] = await Promise.all([getUser(), getTranslations("sales")]);
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  const { data: todayEntries } = await supabase
    .from("sales_entries")
    .select("*, user:users(full_name, avatar_url)")
    .eq("company_id", user!.company_id!)
    .eq("date", today)
    .order("amount", { ascending: false });

  const total = (todayEntries as (SalesEntry & { user: User })[])?.reduce((s, e) => s + e.amount, 0) ?? 0;

  return (
    <>
      <Header title={t("dailySales")} userId={user!.id} />
      <main className="p-4 lg:p-6 space-y-6 max-w-3xl">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("dailySales")} — {today}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("teamTotal")} <span className="text-accent font-semibold">${total.toLocaleString()}</span>
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-start px-4 py-3 text-muted-foreground font-medium">{t("tableEmployee")}</th>
                <th className="text-end px-4 py-3 text-muted-foreground font-medium">{t("tableSales")}</th>
                <th className="hidden sm:table-cell text-start px-4 py-3 text-muted-foreground font-medium">{t("tableNotes")}</th>
              </tr>
            </thead>
            <tbody>
              {(todayEntries as (SalesEntry & { user: User })[])?.map((e) => (
                <tr key={e.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{e.user?.full_name}</td>
                  <td className="px-4 py-3 text-end font-semibold text-accent">${e.amount.toLocaleString()}</td>
                  <td className="hidden sm:table-cell px-4 py-3 text-muted-foreground">{e.notes ?? "—"}</td>
                </tr>
              ))}
              {!todayEntries?.length && (
                <tr>
                  <td colSpan={3} className="text-center py-10 text-muted-foreground text-sm">{t("noEntriesToday")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

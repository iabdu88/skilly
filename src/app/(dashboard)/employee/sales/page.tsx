import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { SalesEntryForm } from "@/components/sales/SalesEntryForm";
import type { SalesEntry } from "@/types/database";

export default async function EmployeeSalesPage() {
  const [user, t] = await Promise.all([getUser(), getTranslations("sales")]);
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  const { data: todayEntry } = await supabase
    .from("sales_entries")
    .select("*")
    .eq("user_id", user!.id)
    .eq("date", today)
    .maybeSingle();

  const { data: history } = await supabase
    .from("sales_entries")
    .select("*")
    .eq("user_id", user!.id)
    .order("date", { ascending: false })
    .limit(30);

  const total = (history as SalesEntry[])?.reduce((s, e) => s + e.amount, 0) ?? 0;

  return (
    <>
      <Header title={t("dailySales")} userId={user!.id} />
      <main className="p-4 lg:p-6 space-y-6 max-w-2xl">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("dailySales")}</h2>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">{t("thirtyDayTotal")}</p>
          <p className="text-3xl font-bold text-foreground mt-1">${total.toLocaleString()}</p>
        </div>

        <SalesEntryForm
          companyId={user!.company_id!}
          date={today}
          existingEntry={todayEntry as SalesEntry | null}
        />

        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">{t("history")}</h3>
          {(history as SalesEntry[])?.map((e) => (
            <div key={e.id} className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
              <span className="text-sm text-muted-foreground">{e.date}</span>
              <span className="text-sm font-semibold text-foreground">${e.amount.toLocaleString()}</span>
            </div>
          ))}
          {!history?.length && <p className="text-sm text-muted-foreground text-center py-8">{t("noEntries")}</p>}
        </div>
      </main>
    </>
  );
}

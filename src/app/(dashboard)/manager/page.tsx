import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { BarChart2, Users, ShoppingBag } from "lucide-react";

export default async function ManagerDashboard() {
  const [user, t] = await Promise.all([getUser(), getTranslations("dashboard")]);
  const supabase = await createClient();

  const { count: employees } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("company_id", user!.company_id!)
    .eq("role", "employee");

  const { data: todaySales } = await supabase
    .from("sales_entries")
    .select("amount")
    .eq("company_id", user!.company_id!)
    .eq("date", new Date().toISOString().split("T")[0]);

  const totalSales = todaySales?.reduce((s, e) => s + e.amount, 0) ?? 0;

  const stats = [
    { labelKey: "employees",    value: employees ?? 0,                        icon: Users,     color: "text-primary" },
    { labelKey: "todaySales",   value: `$${totalSales.toLocaleString()}`,      icon: BarChart2, color: "text-accent" },
    { labelKey: "outfitEntries", value: 0,                                    icon: ShoppingBag, color: "text-pink-400" },
  ];

  return (
    <>
      <Header title={t("welcome")} userId={user!.id} />
      <main className="p-4 lg:p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t("welcome")}, {user!.full_name.split(" ")[0]} 👋
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">{t("managerOverview")}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.labelKey} className="bg-surface rounded-2xl p-4 border border-border">
              <s.icon className={`w-6 h-6 ${s.color} mb-3`} />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t(s.labelKey as Parameters<typeof t>[0])}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

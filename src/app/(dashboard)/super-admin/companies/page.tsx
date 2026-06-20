import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { CompanyManagement } from "@/components/admin/CompanyManagement";
import { ExportJsonButton } from "@/components/admin/ExportJsonButton";

export default async function CompaniesPage() {
  const [user, t] = await Promise.all([requireRole(["super_admin"]), getTranslations("admin")]);
  const admin = createAdminClient();

  const { data: companies } = await admin
    .from("companies")
    .select("id, name, name_ar, logo_url, is_archived, created_at")
    .order("created_at", { ascending: false });

  const augmented = await Promise.all((companies ?? []).map(async (c) => {
    const [
      { count: employee_count },
      { data: trainerRow },
    ] = await Promise.all([
      admin.from("users").select("*", { count: "exact", head: true }).eq("company_id", c.id).eq("role", "employee"),
      admin.from("users").select("full_name").eq("company_id", c.id).eq("role", "trainer").limit(1).single(),
    ]);
    return {
      ...c,
      employee_count: employee_count ?? 0,
      trainer_name: trainerRow?.full_name ?? null,
    };
  }));

  const activeCount = (companies ?? []).filter((c: { is_archived?: boolean }) => !c.is_archived).length;

  return (
    <>
      <Header title={t("companiesTitle", { n: activeCount })} userId={user.id} />
      <main className="p-4 lg:p-6 max-w-3xl space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("companiesTitle", { n: activeCount })}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("companiesDesc")}</p>
        </div>
        <CompanyManagement companies={augmented} />

        {augmented.filter((c) => !c.is_archived).length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">{t("exportTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("exportDesc")}</p>
            <div className="flex flex-wrap gap-2">
              {augmented.filter((c) => !c.is_archived).map((c) => (
                <ExportJsonButton key={c.id} companyId={c.id} companyName={c.name} />
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

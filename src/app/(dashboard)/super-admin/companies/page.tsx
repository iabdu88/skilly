import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { CompanyManagement } from "@/components/admin/CompanyManagement";
import { ExportJsonButton } from "@/components/admin/ExportJsonButton";

export default async function CompaniesPage() {
  const user  = await requireRole(["super_admin"]);
  const admin = createAdminClient();

  // Fetch companies with employee count and trainer name
  const { data: companies } = await admin
    .from("companies")
    .select("id, name, logo_url, is_archived, created_at")
    .order("created_at", { ascending: false });

  // Augment with stats
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

  return (
    <>
      <Header title="Companies" userId={user.id} />
      <main className="p-4 lg:p-6 max-w-3xl space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Companies ({(companies ?? []).filter((c: { is_archived?: boolean }) => !c.is_archived).length} active)
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage company details, logos, and access. New companies are created via Trainer invite codes.
          </p>
        </div>
        <CompanyManagement companies={augmented} />

        {/* JSON export per company */}
        {augmented.filter((c) => !c.is_archived).length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Export Company Data</p>
            <p className="text-xs text-muted-foreground">Download all data for a company as a JSON file.</p>
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

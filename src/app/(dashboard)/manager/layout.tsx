import { requireRole } from "@/lib/auth";
import { getCachedCompany } from "@/lib/queries";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const user    = await requireRole(["manager"]);
  const company = user.company_id ? await getCachedCompany(user.company_id) : null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        role={user.role}
        userName={user.full_name}
        avatarUrl={user.avatar_url}
        companyLogo={company?.logo_url ?? null}
        companyName={company?.name ?? null}
        companyNameAr={company?.name_ar ?? null}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}

import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["super_admin"]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={user.role} userName={user.full_name} avatarUrl={user.avatar_url} />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}

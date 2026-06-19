import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { UserManagement } from "@/components/admin/UserManagement";

export default async function UsersPage() {
  const user  = await requireRole(["super_admin"]);
  const admin = createAdminClient();

  const { data: users } = await admin
    .from("users")
    .select("id, full_name, email, role, is_active, created_at, company:companies(name)")
    .order("created_at", { ascending: false });

  return (
    <>
      <Header title="Manage Users" userId={user.id} />
      <main className="p-4 lg:p-6 max-w-5xl space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Users ({users?.length ?? 0})
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Change roles, deactivate/reactivate accounts, and monitor all users across companies.
          </p>
        </div>
        <UserManagement users={(users ?? []) as unknown as Parameters<typeof UserManagement>[0]["users"]} />
      </main>
    </>
  );
}

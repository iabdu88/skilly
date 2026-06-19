import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { Header } from "@/components/layout/Header";

const ACTION_LABELS: Record<string, string> = {
  invite_generated:   "Generated invite",
  company_updated:    "Updated company",
  company_archived:   "Archived company",
  company_unarchived: "Restored company",
  company_deleted:    "Deleted company",
  user_role_changed:  "Changed user role",
  user_deactivated:   "Deactivated user",
  user_reactivated:   "Reactivated user",
  course_created:     "Created course",
  course_deleted:     "Deleted course",
  certificate_issued: "Issued certificate",
};

export default async function ActivityPage() {
  const user  = await requireRole(["super_admin"]);
  const admin = createAdminClient();

  const { data: logs } = await admin
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <>
      <Header title="Activity Log" userId={user.id} />
      <main className="p-4 lg:p-6 max-w-4xl space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Activity Log</h2>
          <p className="text-sm text-muted-foreground mt-0.5">All admin and trainer actions across the platform.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Action</th>
                <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-medium text-muted-foreground">Actor</th>
                <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-medium text-muted-foreground">Target</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">When</th>
              </tr>
            </thead>
            <tbody>
              {(!logs || logs.length === 0) && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-sm text-muted-foreground">No activity yet.</td>
                </tr>
              )}
              {(logs ?? []).map((log) => (
                <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground text-xs">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </p>
                    {log.details && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                        {JSON.stringify(log.details).slice(0, 80)}
                      </p>
                    )}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3">
                    <p className="text-xs text-foreground">{log.actor_name}</p>
                    <p className="text-[10px] text-muted-foreground">{log.actor_email}</p>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-xs text-muted-foreground">
                    {log.target_label ?? log.target_type ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

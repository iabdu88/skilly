import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";

export default async function ActivityPage() {
  const [user, t, ta] = await Promise.all([
    requireRole(["super_admin"]),
    getTranslations("activity"),
    getTranslations("activity.actions"),
  ]);
  const admin = createAdminClient();

  const actionsMap: Record<string, string> = {
    invite_generated:   ta("invite_generated"),
    company_updated:    ta("company_updated"),
    company_archived:   ta("company_archived"),
    company_unarchived: ta("company_unarchived"),
    company_deleted:    ta("company_deleted"),
    user_role_changed:  ta("user_role_changed"),
    user_deactivated:   ta("user_deactivated"),
    user_reactivated:   ta("user_reactivated"),
    course_created:     ta("course_created"),
    course_deleted:     ta("course_deleted"),
    certificate_issued: ta("certificate_issued"),
  };

  const { data: logs } = await admin
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <>
      <Header title={t("title")} userId={user.id} />
      <main className="p-4 lg:p-6 max-w-4xl space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("title")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("subtitleAdmin")}</p>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground">{t("colAction")}</th>
                <th className="hidden sm:table-cell text-start px-4 py-3 text-xs font-medium text-muted-foreground">{t("colActor")}</th>
                <th className="hidden md:table-cell text-start px-4 py-3 text-xs font-medium text-muted-foreground">{t("colTarget")}</th>
                <th className="text-end px-4 py-3 text-xs font-medium text-muted-foreground">{t("colWhen")}</th>
              </tr>
            </thead>
            <tbody>
              {(!logs || logs.length === 0) && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-sm text-muted-foreground">{t("noActivity")}</td>
                </tr>
              )}
              {(logs ?? []).map((log) => (
                <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground text-xs">
                      {actionsMap[log.action] ?? log.action}
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
                  <td className="px-4 py-3 text-end text-[10px] text-muted-foreground whitespace-nowrap">
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

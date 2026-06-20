import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";

export default async function TrainerActivityPage() {
  const [user, t, ta] = await Promise.all([
    requireRole(["trainer"]),
    getTranslations("activity"),
    getTranslations("activity.actions"),
  ]);
  const supabase = await createClient();

  const actionsMap: Record<string, string> = {
    invite_generated:   ta("invite_generated"),
    course_created:     ta("course_created"),
    course_deleted:     ta("course_deleted"),
    certificate_issued: ta("certificate_issued"),
    user_role_changed:  ta("user_role_changed"),
  };

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("company_id", user.company_id!)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <Header title={t("title")} userId={user.id} />
      <main className="p-4 lg:p-6 max-w-3xl space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("title")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("subtitleTrainer")}</p>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground">{t("colAction")}</th>
                <th className="hidden sm:table-cell text-start px-4 py-3 text-xs font-medium text-muted-foreground">{t("colBy")}</th>
                <th className="text-end px-4 py-3 text-xs font-medium text-muted-foreground">{t("colWhen")}</th>
              </tr>
            </thead>
            <tbody>
              {(!logs || logs.length === 0) && (
                <tr>
                  <td colSpan={3} className="text-center py-10 text-sm text-muted-foreground">{t("noActivity")}</td>
                </tr>
              )}
              {(logs ?? []).map((log) => (
                <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground text-xs">
                      {actionsMap[log.action] ?? log.action}
                    </p>
                    {log.target_label && <p className="text-[10px] text-muted-foreground mt-0.5">{log.target_label}</p>}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-xs text-muted-foreground">{log.actor_name}</td>
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

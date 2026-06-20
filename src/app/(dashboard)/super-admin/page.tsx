import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { GenerateInviteForm } from "@/components/invite/GenerateInviteForm";
import { DownloadReportButton } from "@/components/admin/DownloadReportButton";
import { Building2, Users, Clock, CheckCircle2, XCircle, Shield } from "lucide-react";
import type { InviteCode } from "@/types/database";

export default async function SuperAdminDashboard() {
  const [user, t] = await Promise.all([getUser(), getTranslations("dashboard")]);
  const supabase = await createClient();
  const admin    = createAdminClient();

  const [
    { count: companies },
    { count: allUsers },
    { data: recentCodes },
    { data: allCompanies },
  ] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("invite_codes").select("*").eq("created_by", user!.id).order("created_at", { ascending: false }).limit(10),
    admin.from("companies").select("id, name").eq("is_archived", false).order("name"),
  ]);

  const stats = [
    { labelKey: "companies",  value: companies ?? 0, icon: Building2, color: "text-primary" },
    { labelKey: "totalUsers", value: allUsers ?? 0,  icon: Users,     color: "text-accent" },
  ];

  const codes = (recentCodes ?? []) as InviteCode[];

  function codeStatus(invite: InviteCode) {
    if (invite.used_at) return { label: t("inviteUsed"), color: "text-green-400" };
    if (new Date(invite.expires_at) < new Date()) return { label: t("inviteExpired"), color: "text-red-400" };
    return { label: t("invitePending"), color: "text-accent" };
  }

  return (
    <>
      <Header title="Super Admin" userId={user!.id} />
      <main className="p-4 lg:p-6 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("platformOverview")}</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{t("globalStats")}</p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {stats.map((s) => (
              <div key={s.labelKey} className="bg-card rounded-2xl p-4 border border-border">
                <s.icon className={`w-6 h-6 ${s.color} mb-3`} />
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t(s.labelKey as Parameters<typeof t>[0])}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">{t("reports")}</h2>
          <p className="text-muted-foreground text-sm">{t("reportsDesc")}</p>
          <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
            <label className="text-sm font-medium text-foreground">{t("selectCompany")}</label>
            <div className="flex flex-wrap gap-3">
              {(allCompanies ?? []).map((c) => (
                <DownloadReportButton key={c.id} companyId={c.id} label={`${c.name} — Report`} />
              ))}
              {(!allCompanies || allCompanies.length === 0) && (
                <p className="text-sm text-muted-foreground">{t("noCompanies")}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">{t("pitrTitle")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("pitrDesc")}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t("onboardCompany")}</h2>
            <p className="text-muted-foreground text-sm mt-0.5">{t("onboardCompanyDesc")}</p>
          </div>
          <GenerateInviteForm userRole="super_admin" />

          {codes.length > 0 && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">{t("recentInviteCodes")}</p>
              </div>
              <ul className="divide-y divide-border">
                {codes.map((invite) => {
                  const status = codeStatus(invite);
                  const daysLeft = Math.max(0, Math.ceil((new Date(invite.expires_at).getTime() - Date.now()) / 86400000));
                  return (
                    <li key={invite.id} className="px-5 py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono font-bold text-sm text-foreground tracking-widest">{invite.code}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{invite.company_name ?? "—"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-semibold ${status.color}`}>{status.label}</p>
                        {!invite.used_at && new Date(invite.expires_at) > new Date() && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />{t("daysLeft", { n: daysLeft })}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0">
                        {invite.used_at
                          ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                          : new Date(invite.expires_at) < new Date()
                          ? <XCircle className="w-4 h-4 text-red-400" />
                          : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { GenerateInviteForm } from "@/components/invite/GenerateInviteForm";
import { DownloadReportButton } from "@/components/admin/DownloadReportButton";
import { BookOpen, Users, Star, ShoppingBag, Clock, CheckCircle2, XCircle } from "lucide-react";
import type { InviteCode } from "@/types/database";

export default async function TrainerDashboard() {
  const [user, t] = await Promise.all([getUser(), getTranslations("dashboard")]);
  const supabase = await createClient();

  const [
    { count: courses },
    { count: employees },
    { count: stars },
    { data: recentCodes },
  ] = await Promise.all([
    supabase.from("courses").select("*", { count: "exact", head: true }).eq("company_id", user!.company_id!),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("company_id", user!.company_id!).eq("role", "employee"),
    supabase.from("stars").select("*", { count: "exact", head: true }).eq("company_id", user!.company_id!),
    supabase.from("invite_codes").select("id, code, role, company_name, expires_at, used_at").eq("created_by", user!.id).order("created_at", { ascending: false }).limit(10),
  ]);

  const stats = [
    { labelKey: "totalCourses",  value: courses ?? 0,    icon: BookOpen,    color: "text-primary" },
    { labelKey: "employees",     value: employees ?? 0,  icon: Users,       color: "text-accent" },
    { labelKey: "starsAwarded",  value: stars ?? 0,      icon: Star,        color: "text-yellow-400" },
    { labelKey: "outfitEntries", value: 0,               icon: ShoppingBag, color: "text-pink-400" },
  ];

  const codes = (recentCodes ?? []) as InviteCode[];

  function codeStatus(invite: InviteCode) {
    if (invite.used_at) return { label: t("inviteUsed"), color: "text-green-400" };
    if (new Date(invite.expires_at) < new Date()) return { label: t("inviteExpired"), color: "text-red-400" };
    return { label: t("invitePending"), color: "text-accent" };
  }

  return (
    <>
      <Header title={t("welcome")} userId={user!.id} />
      <main className="p-4 lg:p-6 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t("welcome")}, {user!.full_name.split(" ")[0]} 👋
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">{t("whatsHappeningToday")}</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {stats.map((s) => (
              <div key={s.labelKey} className="bg-card rounded-2xl p-4 border border-border">
                <s.icon className={`w-6 h-6 ${s.color} mb-3`} />
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t(s.labelKey as Parameters<typeof t>[0])}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between bg-card rounded-2xl p-4 border border-border">
          <div>
            <p className="text-sm font-semibold text-foreground">{t("monthlyReport")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("monthlyReportDesc")}</p>
          </div>
          <DownloadReportButton />
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t("inviteTeam")}</h2>
            <p className="text-muted-foreground text-sm mt-0.5">{t("inviteTeamDesc")}</p>
          </div>
          <GenerateInviteForm userRole="trainer" />

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
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">{invite.role}</p>
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
                        {invite.used_at ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : new Date(invite.expires_at) < new Date() ? <XCircle className="w-4 h-4 text-red-400" /> : null}
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

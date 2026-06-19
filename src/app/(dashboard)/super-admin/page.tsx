import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { GenerateInviteForm } from "@/components/invite/GenerateInviteForm";
import { DownloadReportButton } from "@/components/admin/DownloadReportButton";
import { Building2, Users, Clock, CheckCircle2, XCircle, Shield } from "lucide-react";
import type { InviteCode } from "@/types/database";

function codeStatus(invite: InviteCode): { label: string; color: string } {
  if (invite.used_at) return { label: "Used", color: "text-green-400" };
  if (new Date(invite.expires_at) < new Date()) return { label: "Expired", color: "text-red-400" };
  return { label: "Pending", color: "text-accent" };
}

export default async function SuperAdminDashboard() {
  const user     = await getUser();
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
    supabase
      .from("invite_codes")
      .select("*")
      .eq("created_by", user!.id)
      .order("created_at", { ascending: false })
      .limit(10),
    admin.from("companies").select("id, name").eq("is_archived", false).order("name"),
  ]);

  const stats = [
    { label: "Companies", value: companies ?? 0, icon: Building2, color: "text-primary" },
    { label: "Total Users", value: allUsers ?? 0, icon: Users, color: "text-accent" },
  ];

  const codes = (recentCodes ?? []) as InviteCode[];

  return (
    <>
      <Header title="Super Admin" userId={user!.id} />
      <main className="p-4 lg:p-6 space-y-8">
        {/* Platform stats */}
        <div>
          <h2 className="text-xl font-bold text-foreground">Platform Overview</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Global stats across all companies.</p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-card rounded-2xl p-4 border border-border">
                <s.icon className={`w-6 h-6 ${s.color} mb-3`} />
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reports section */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">Reports</h2>
          <p className="text-muted-foreground text-sm">Download a monthly PDF performance report per company.</p>
          <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
            <label className="text-sm font-medium text-foreground">Select Company</label>
            <div className="flex flex-wrap gap-3">
              {(allCompanies ?? []).map((c) => (
                <DownloadReportButton
                  key={c.id}
                  companyId={c.id}
                  label={`${c.name} — Report`}
                />
              ))}
              {(!allCompanies || allCompanies.length === 0) && (
                <p className="text-sm text-muted-foreground">No companies yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* PiTR & Platform Safety */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Point-in-Time Recovery</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              PiTR is a Supabase project setting. Verify it is enabled in your{" "}
              <span className="text-amber-400 font-medium">Supabase Dashboard → Settings → Database → Point in Time Recovery</span>.
              Your Supabase plan must support PiTR (Pro or above).
            </p>
          </div>
        </div>

        {/* Invite section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Onboard a Company</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Enter the company name and optional logo. The company is created immediately and you get a Trainer invite code.
            </p>
          </div>
          <GenerateInviteForm userRole="super_admin" />

          {codes.length > 0 && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">Recent Invite Codes</p>
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
                            <Clock className="w-3 h-3" />{daysLeft}d left
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

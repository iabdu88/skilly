import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { GenerateInviteForm } from "@/components/invite/GenerateInviteForm";
import { DownloadReportButton } from "@/components/admin/DownloadReportButton";
import { BookOpen, Users, Star, ShoppingBag, Clock, CheckCircle2, XCircle } from "lucide-react";
import type { InviteCode } from "@/types/database";

function codeStatus(invite: InviteCode): { label: string; color: string } {
  if (invite.used_at) return { label: "Used", color: "text-green-400" };
  if (new Date(invite.expires_at) < new Date()) return { label: "Expired", color: "text-red-400" };
  return { label: "Pending", color: "text-accent" };
}

export default async function TrainerDashboard() {
  const user     = await getUser();
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
    supabase.from("invite_codes").select("*").eq("created_by", user!.id).order("created_at", { ascending: false }).limit(10),
  ]);

  const stats = [
    { label: "Total Courses", value: courses ?? 0, icon: BookOpen, color: "text-primary" },
    { label: "Employees",     value: employees ?? 0, icon: Users, color: "text-accent" },
    { label: "Stars Awarded", value: stars ?? 0,     icon: Star,  color: "text-yellow-400" },
    { label: "Outfit Entries", value: 0,             icon: ShoppingBag, color: "text-pink-400" },
  ];

  const codes = (recentCodes ?? []) as InviteCode[];

  return (
    <>
      <Header title="Dashboard" userId={user!.id} />
      <main className="p-4 lg:p-6 space-y-8">
        {/* Stats */}
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Welcome back, {user!.full_name.split(" ")[0]} 👋
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">Here&apos;s what&apos;s happening today.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-card rounded-2xl p-4 border border-border">
                <s.icon className={`w-6 h-6 ${s.color} mb-3`} />
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Report download */}
        <div className="flex items-center justify-between bg-card rounded-2xl p-4 border border-border">
          <div>
            <p className="text-sm font-semibold text-foreground">Monthly Report</p>
            <p className="text-xs text-muted-foreground mt-0.5">Employee performance, sales, course completions, stars.</p>
          </div>
          <DownloadReportButton />
        </div>

        {/* Invite section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Invite Team Members</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Generate a single-use code for a Manager or Employee.</p>
          </div>
          <GenerateInviteForm userRole="trainer" />

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
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">{invite.role}</p>
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

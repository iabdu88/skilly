import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { OutfitUploadForm } from "@/components/outfit/OutfitUploadForm";
import { Crown, ShoppingBag } from "lucide-react";
import type { OutfitSubmission, User } from "@/types/database";

function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default async function EmployeeOutfitPage() {
  const user = await getUser();
  const supabase = await createClient();

  const now = new Date();
  const week = getWeekNumber(now);
  const year = now.getFullYear();

  const { data: submissions } = await supabase
    .from("outfit_submissions")
    .select("*, user:users(full_name, avatar_url)")
    .eq("company_id", user!.company_id!)
    .eq("week_number", week)
    .eq("year", year)
    .order("created_at", { ascending: false });

  const mySubmission = (submissions as (OutfitSubmission & { user: User })[])?.find(
    (s) => s.user_id === user!.id
  );

  return (
    <>
      <Header title="Best Outfit" userId={user!.id} />
      <main className="p-4 lg:p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Best Outfit of the Week</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Week {week} · {year}</p>
        </div>

        {!mySubmission && <OutfitUploadForm companyId={user!.company_id!} weekNumber={week} year={year} />}

        {mySubmission && (
          <div className="bg-surface border border-border rounded-2xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">Your submission this week</p>
            <img src={mySubmission.image_url} alt="My outfit" className="w-40 h-48 object-cover rounded-xl mx-auto" />
            {mySubmission.is_winner && (
              <p className="flex items-center justify-center gap-1.5 text-accent font-semibold mt-3">
                <Crown className="w-4 h-4" /> Winner!
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">This Week&apos;s Submissions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(submissions as (OutfitSubmission & { user: User })[])?.map((sub) => (
              <div key={sub.id} className="relative rounded-xl overflow-hidden">
                <img src={sub.image_url} alt={sub.user?.full_name} className="w-full h-48 object-cover" />
                {sub.is_winner && (
                  <div className="absolute top-2 right-2 bg-accent rounded-full p-1">
                    <Crown className="w-3 h-3 text-black" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-xs text-white font-medium truncate">{sub.user?.full_name}</p>
                </div>
              </div>
            ))}
            {!submissions?.length && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No submissions yet this week.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

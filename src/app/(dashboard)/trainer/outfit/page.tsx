import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { OutfitWinnerPicker } from "@/components/outfit/OutfitWinnerPicker";
import { Crown, ShoppingBag } from "lucide-react";
import type { OutfitSubmission, User } from "@/types/database";

function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default async function TrainerOutfitPage() {
  const [user, t] = await Promise.all([getUser(), getTranslations("outfit")]);
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

  const winner = (submissions as (OutfitSubmission & { user: User })[])?.find((s) => s.is_winner);

  return (
    <>
      <Header title={t("outfitOfWeek")} userId={user!.id} />
      <main className="p-4 lg:p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("trainerTitle", { n: week })}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("submissionsCount", { n: submissions?.length ?? 0 })}</p>
        </div>

        {winner && (
          <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 flex items-center gap-4">
            <Crown className="w-6 h-6 text-accent shrink-0" />
            <div>
              <p className="text-sm font-semibold text-accent">{t("thisWeeksWinner")}</p>
              <p className="text-foreground font-bold">{winner.user?.full_name}</p>
            </div>
            <img src={winner.image_url} alt="Winner" className="w-16 h-20 object-cover rounded-xl ms-auto" />
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {(submissions as (OutfitSubmission & { user: User })[])?.map((sub) => (
            <div key={sub.id} className="relative rounded-xl overflow-hidden group">
              <img src={sub.image_url} alt={sub.user?.full_name} className="w-full h-56 object-cover" />
              {sub.is_winner && (
                <div className="absolute top-2 end-2 bg-accent rounded-full p-1.5">
                  <Crown className="w-3 h-3 text-black" />
                </div>
              )}
              <div className="absolute bottom-0 start-0 end-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <p className="text-sm text-white font-semibold truncate">{sub.user?.full_name}</p>
                {!winner && (
                  <OutfitWinnerPicker
                    submissionId={sub.id}
                    companyId={user!.company_id!}
                    week={week}
                    year={year}
                    userId={sub.user_id}
                    userName={sub.user?.full_name}
                  />
                )}
              </div>
            </div>
          ))}
          {!submissions?.length && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{t("noSubmissionsYet")}</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

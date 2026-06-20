"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { Crown } from "lucide-react";

interface Props {
  submissionId: string;
  companyId: string;
  week: number;
  year: number;
  userId: string;
  userName: string;
}

export function OutfitWinnerPicker({ submissionId, companyId, week, year, userId, userName }: Props) {
  const t = useTranslations("outfit");
  const router = useRouter();
  const [isPending, start] = useTransition();

  function pick() {
    start(async () => {
      const supabase = createClient();
      await supabase.from("outfit_submissions").update({ is_winner: false })
        .eq("company_id", companyId).eq("week_number", week).eq("year", year);
      await supabase.from("outfit_submissions").update({ is_winner: true }).eq("id", submissionId);
      await supabase.from("notifications").insert({
        user_id: userId, type: "outfit_winner",
        title: "🏆 You won Best Outfit!",
        body: `Congratulations ${userName}! You are the Best Outfit winner for week ${week}.`,
        is_read: false, metadata: { week: String(week), year: String(year) },
      });
      router.refresh();
    });
  }

  return (
    <button onClick={pick} disabled={isPending}
      className="mt-1.5 flex items-center gap-1 text-xs text-accent font-semibold hover:text-accent/80 transition-colors disabled:opacity-50"
    >
      <Crown className="w-3 h-3" />
      {isPending ? t("saving") : t("pickAsWinner")}
    </button>
  );
}

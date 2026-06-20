import { Star, Trophy } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { User } from "@/types/database";

interface Props {
  type: "week" | "month";
  user: User | null;
  period: string;
}

export async function StarCard({ type, user, period }: Props) {
  const t = await getTranslations("stars");
  const Icon = type === "week" ? Star : Trophy;
  const label = type === "week" ? t("starOfWeek") : t("starOfMonth");
  const color = type === "week" ? "text-yellow-400" : "text-accent";
  const bg = type === "week" ? "bg-yellow-400/10 border-yellow-400/30" : "bg-accent/10 border-accent/30";

  return (
    <div className={`rounded-2xl border p-5 ${bg} text-center`}>
      <Icon className={`w-8 h-8 mx-auto mb-3 ${color}`} />
      <p className={`text-xs font-semibold uppercase tracking-wider ${color} mb-3`}>{label}</p>
      {user ? (
        <>
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name} className="w-16 h-16 rounded-full object-cover mx-auto mb-2" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold text-primary">{user.full_name.charAt(0)}</span>
            </div>
          )}
          <p className="font-bold text-foreground">{user.full_name}</p>
          <p className="text-xs text-muted-foreground mt-1">{period}</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t("notChosenYet")}</p>
      )}
    </div>
  );
}

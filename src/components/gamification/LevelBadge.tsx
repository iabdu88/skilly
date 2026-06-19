import { getLevelInfo } from "@/lib/gamification";

interface Props {
  xp: number;
  showBar?: boolean;
  size?: "sm" | "md";
}

export function LevelBadge({ xp, showBar = false, size = "md" }: Props) {
  const info = getLevelInfo(xp);
  const isSmall = size === "sm";

  return (
    <div className={`flex items-center gap-${isSmall ? "1.5" : "2"}`}>
      <span className={isSmall ? "text-base" : "text-xl"}>{info.emoji}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-bold ${isSmall ? "text-xs" : "text-sm"}`}
            style={{ color: info.color }}
          >
            Lv.{info.level}
          </span>
          <span className={`font-medium text-foreground ${isSmall ? "text-xs" : "text-sm"}`}>
            {info.name}
          </span>
        </div>

        {showBar && (
          <div className="mt-1">
            <div className="h-1.5 rounded-full bg-border overflow-hidden" style={{ width: isSmall ? "80px" : "120px" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${info.progress}%`, backgroundColor: info.color }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {xp.toLocaleString()} XP
              {info.xpToNext > 0 ? ` · ${info.xpToNext} to next` : " · Max level"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

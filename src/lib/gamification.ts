export const XP_REWARDS: Record<string, number> = {
  lesson_complete:  50,
  quiz_perfect:    100,
  quiz_pass:        30,
  daily_login:      10,
  outfit_submit:    25,
  course_complete: 150,
  star_week:       150,
  star_month:      300,
  sales_submit:     15,
};

interface LevelDef {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  color: string;
  emoji: string;
}

const LEVELS: LevelDef[] = [
  { level: 1, name: "Rookie",   minXP: 0,    maxXP: 499,      color: "#9CA3AF", emoji: "🌱" },
  { level: 2, name: "Learner",  minXP: 500,  maxXP: 1499,     color: "#60A5FA", emoji: "📚" },
  { level: 3, name: "Achiever", minXP: 1500, maxXP: 3499,     color: "#34D399", emoji: "🚀" },
  { level: 4, name: "Expert",   minXP: 3500, maxXP: 6999,     color: "#F59E0B", emoji: "⚡" },
  { level: 5, name: "Master",   minXP: 7000, maxXP: Infinity, color: "#A78BFA", emoji: "👑" },
];

export interface LevelInfo extends LevelDef {
  progress: number;   // 0–100 percent through this level
  xpInLevel: number;  // XP above this level's floor
  xpToNext: number;   // XP needed for next level (0 if max)
}

export function getLevelInfo(xp: number): LevelInfo {
  const lvl = [...LEVELS].reverse().find((l) => xp >= l.minXP) ?? LEVELS[0];
  const isMax = lvl.level === LEVELS.at(-1)!.level;
  const range = isMax ? 1000 : lvl.maxXP - lvl.minXP + 1;
  const xpInLevel = xp - lvl.minXP;
  const progress = isMax ? 100 : Math.min(100, Math.floor((xpInLevel / range) * 100));
  const xpToNext = isMax ? 0 : lvl.maxXP + 1 - xp;
  return { ...lvl, progress, xpInLevel, xpToNext };
}

interface BadgeItem {
  badge: {
    slug: string;
    name: string;
    description: string;
    icon: string;
  };
  awarded_at: string;
}

interface Props {
  badges: BadgeItem[];
  emptyLabel?: string;
}

export function BadgeGrid({ badges, emptyLabel = "No badges yet — keep going!" }: Props) {
  if (badges.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">{emptyLabel}</p>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {badges.map(({ badge, awarded_at }) => (
        <div
          key={badge.slug}
          title={`${badge.name}: ${badge.description}\nEarned ${new Date(awarded_at).toLocaleDateString()}`}
          className="flex flex-col items-center gap-1.5 bg-primary/5 border border-primary/20 rounded-xl p-3 text-center cursor-default hover:bg-primary/10 transition-colors"
        >
          <span className="text-2xl">{badge.icon}</span>
          <p className="text-[10px] font-semibold text-foreground leading-tight">{badge.name}</p>
        </div>
      ))}
    </div>
  );
}

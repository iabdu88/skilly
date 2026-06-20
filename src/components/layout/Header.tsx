import { createClient } from "@/lib/supabase/server";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

interface HeaderProps {
  title: string;
  userId: string;
}

export async function Header({ title, userId }: HeaderProps) {
  const supabase = await createClient();

  const [{ count }, { data: recentNotifs }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false),
    supabase
      .from("notifications")
      .select("id, title, body, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* ms-10 uses inline-start margin so it clears the hamburger in both LTR and RTL */}
      <h1 className="text-base font-semibold text-foreground lg:text-lg ms-10 lg:ms-0">{title}</h1>
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
        <NotificationBell
          userId={userId}
          initialUnread={count ?? 0}
          initialNotifications={recentNotifs ?? []}
        />
      </div>
    </header>
  );
}

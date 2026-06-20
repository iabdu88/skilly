import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getCachedCompany } from "@/lib/queries";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import Image from "next/image";

interface HeaderProps {
  title: string;
  userId: string;
}

export async function Header({ title, userId }: HeaderProps) {
  const supabase = await createClient();

  const [{ count }, { data: recentNotifs }, user] = await Promise.all([
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
    getUser(),
  ]);

  const company = user?.company_id ? await getCachedCompany(user.company_id) : null;

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Mobile: company logo icon + page title (logo only shown if company has one) */}
      <div className="flex items-center gap-2 ms-10 lg:hidden min-w-0">
        {company?.logo_url && (
          <Image
            src={company.logo_url}
            alt={company.name ?? ""}
            width={32}
            height={32}
            className="w-8 h-8 rounded-lg object-contain shrink-0 border border-border bg-white/5"
          />
        )}
        <span className="text-sm font-semibold text-foreground truncate">{title}</span>
      </div>
      {/* Desktop: page title only — sidebar handles company branding */}
      <h1 className="hidden lg:block text-base lg:text-lg font-semibold text-foreground">{title}</h1>
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

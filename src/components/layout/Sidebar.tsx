"use client";

import Image from "next/image";
import Link from "next/link";
import { SkillySvgLogo } from "@/components/brand/SkillySvgLogo";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  BookOpen, ShoppingBag, BarChart2, Star, MessageCircle,
  Award, Trophy, Users, Building2, LogOut, Menu, X, UserCircle,
  Activity,
} from "lucide-react";
import { useState } from "react";
import { logoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const NAV: NavItem[] = [
  { href: "/trainer",     labelKey: "dashboard",    icon: BarChart2,  roles: ["trainer"] },
  { href: "/manager",     labelKey: "dashboard",    icon: BarChart2,  roles: ["manager"] },
  { href: "/employee",    labelKey: "dashboard",    icon: BarChart2,  roles: ["employee"] },
  { href: "/super-admin", labelKey: "dashboard",    icon: Building2,  roles: ["super_admin"] },

  { href: "/trainer/courses",   labelKey: "training", icon: BookOpen, roles: ["trainer"] },
  { href: "/employee/training", labelKey: "training", icon: BookOpen, roles: ["employee"] },

  { href: "/trainer/outfit",  labelKey: "outfit", icon: ShoppingBag, roles: ["trainer"] },
  { href: "/manager/outfit",  labelKey: "outfit", icon: ShoppingBag, roles: ["manager"] },
  { href: "/employee/outfit", labelKey: "outfit", icon: ShoppingBag, roles: ["employee"] },

  { href: "/trainer/sales",  labelKey: "sales", icon: BarChart2, roles: ["trainer"] },
  { href: "/manager/sales",  labelKey: "sales", icon: BarChart2, roles: ["manager"] },
  { href: "/employee/sales", labelKey: "sales", icon: BarChart2, roles: ["employee"] },

  { href: "/trainer/stars",  labelKey: "stars", icon: Star, roles: ["trainer"] },
  { href: "/manager/stars",  labelKey: "stars", icon: Star, roles: ["manager"] },
  { href: "/employee/stars", labelKey: "stars", icon: Star, roles: ["employee"] },

  { href: "/trainer/chat",  labelKey: "chat", icon: MessageCircle, roles: ["trainer"] },
  { href: "/manager/chat",  labelKey: "chat", icon: MessageCircle, roles: ["manager"] },
  { href: "/employee/chat", labelKey: "chat", icon: MessageCircle, roles: ["employee"] },

  { href: "/employee/certificates", labelKey: "certificates", icon: Award,  roles: ["employee"] },
  { href: "/employee/leaderboard",  labelKey: "leaderboard",  icon: Trophy, roles: ["employee"] },
  { href: "/trainer/leaderboard",   labelKey: "leaderboard",  icon: Trophy, roles: ["trainer"] },

  { href: "/super-admin/companies", labelKey: "companies",  icon: Building2, roles: ["super_admin"] },
  { href: "/super-admin/users",     labelKey: "users",      icon: Users,     roles: ["super_admin"] },
  { href: "/super-admin/activity",  labelKey: "activity",   icon: Activity,  roles: ["super_admin"] },
  { href: "/trainer/activity",      labelKey: "activity",   icon: Activity,  roles: ["trainer"] },

  { href: "/employee/profile",    labelKey: "profile", icon: UserCircle, roles: ["employee"] },
  { href: "/trainer/profile",     labelKey: "profile", icon: UserCircle, roles: ["trainer"] },
  { href: "/manager/profile",     labelKey: "profile", icon: UserCircle, roles: ["manager"] },
  { href: "/super-admin/profile", labelKey: "profile", icon: UserCircle, roles: ["super_admin"] },
];

interface SidebarProps {
  role: UserRole;
  userName: string;
  avatarUrl?: string | null;
  companyLogo?: string | null;
  companyName?: string | null;
  companyNameAr?: string | null;
}

export function Sidebar({ role, userName, avatarUrl, companyLogo, companyName, companyNameAr }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");
  const locale = useLocale();
  const displayName = locale === "ar" && companyNameAr ? companyNameAr : companyName;
  const items = NAV.filter((n) => n.roles.includes(role));

  const nav = (
    <nav className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border min-w-0">
        {companyName ? (
          <>
            {companyLogo && (
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 overflow-hidden border border-border">
                <Image src={companyLogo} alt={companyName} width={32} height={32} className="w-full h-full object-contain p-0.5" />
              </div>
            )}
            <span className="font-bold text-foreground text-lg truncate">{displayName}</span>
          </>
        ) : (
          <SkillySvgLogo width={48} />
        )}
      </div>

      <ul className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {t(item.labelKey as Parameters<typeof t>[0])}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={userName} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{userName.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground capitalize">{role.replace("_", " ")}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            {t("signOut")}
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <>
      {/* Hamburger — uses logical `start-4` so it flips to the correct side in RTL */}
      <button
        className="fixed top-4 start-4 z-50 lg:hidden bg-card border border-border rounded-xl p-2"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Mobile drawer — slides from the inline-start edge (left in LTR, right in RTL) */}
      <aside className={cn(
        "fixed inset-y-0 start-0 z-40 w-64 bg-card border-e border-border transition-transform duration-200 lg:hidden",
        open ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full"
      )}>
        {nav}
      </aside>

      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-card border-e border-border min-h-screen">
        {nav}
      </aside>
    </>
  );
}

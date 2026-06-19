"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const NAV: NavItem[] = [
  { href: "/trainer",     label: "Dashboard",    icon: BarChart2,  roles: ["trainer"] },
  { href: "/manager",     label: "Dashboard",    icon: BarChart2,  roles: ["manager"] },
  { href: "/employee",    label: "Dashboard",    icon: BarChart2,  roles: ["employee"] },
  { href: "/super-admin", label: "Dashboard",    icon: Building2,  roles: ["super_admin"] },

  { href: "/trainer/courses",   label: "Training Hub", icon: BookOpen, roles: ["trainer"] },
  { href: "/employee/training", label: "Training Hub", icon: BookOpen, roles: ["employee"] },

  { href: "/trainer/outfit",  label: "Best Outfit", icon: ShoppingBag, roles: ["trainer"] },
  { href: "/manager/outfit",  label: "Best Outfit", icon: ShoppingBag, roles: ["manager"] },
  { href: "/employee/outfit", label: "Best Outfit", icon: ShoppingBag, roles: ["employee"] },

  { href: "/trainer/sales",  label: "Daily Sales", icon: BarChart2, roles: ["trainer"] },
  { href: "/manager/sales",  label: "Daily Sales", icon: BarChart2, roles: ["manager"] },
  { href: "/employee/sales", label: "Daily Sales", icon: BarChart2, roles: ["employee"] },

  { href: "/trainer/stars",  label: "Stars Board", icon: Star, roles: ["trainer"] },
  { href: "/manager/stars",  label: "Stars Board", icon: Star, roles: ["manager"] },
  { href: "/employee/stars", label: "Stars Board", icon: Star, roles: ["employee"] },

  { href: "/trainer/chat",  label: "Chat", icon: MessageCircle, roles: ["trainer"] },
  { href: "/manager/chat",  label: "Chat", icon: MessageCircle, roles: ["manager"] },
  { href: "/employee/chat", label: "Chat", icon: MessageCircle, roles: ["employee"] },

  { href: "/employee/certificates", label: "Certificates", icon: Award,  roles: ["employee"] },
  { href: "/employee/leaderboard",  label: "Leaderboard",  icon: Trophy, roles: ["employee"] },
  { href: "/trainer/leaderboard",   label: "Leaderboard",  icon: Trophy, roles: ["trainer"] },

  { href: "/super-admin/companies", label: "Companies",    icon: Building2, roles: ["super_admin"] },
  { href: "/super-admin/users",     label: "Users",        icon: Users,     roles: ["super_admin"] },
  { href: "/super-admin/activity",  label: "Activity Log", icon: Activity,  roles: ["super_admin"] },
  { href: "/trainer/activity",      label: "Activity Log", icon: Activity,  roles: ["trainer"] },

  { href: "/employee/profile",    label: "My Profile", icon: UserCircle, roles: ["employee"] },
  { href: "/trainer/profile",     label: "My Profile", icon: UserCircle, roles: ["trainer"] },
  { href: "/manager/profile",     label: "My Profile", icon: UserCircle, roles: ["manager"] },
  { href: "/super-admin/profile", label: "My Profile", icon: UserCircle, roles: ["super_admin"] },
];

interface SidebarProps {
  role: UserRole;
  userName: string;
  avatarUrl?: string | null;
  companyLogo?: string | null;
  companyName?: string | null;
}

export function Sidebar({ role, userName, avatarUrl, companyLogo, companyName }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((n) => n.roles.includes(role));

  const nav = (
    <nav className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        {companyLogo ? (
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 overflow-hidden border border-border">
            <img src={companyLogo} alt={companyName ?? "Company"} className="w-full h-full object-contain p-0.5" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-white">S</span>
          </div>
        )}
        <span className="font-bold text-foreground text-lg truncate">{companyLogo && companyName ? companyName : "Skilly"}</span>
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
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt={userName} className="w-8 h-8 rounded-full object-cover" />
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
          <button type="submit" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors w-full">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-card border border-border rounded-xl p-2"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transition-transform duration-200 lg:hidden",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {nav}
      </aside>

      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-card border-r border-border min-h-screen">
        {nav}
      </aside>
    </>
  );
}

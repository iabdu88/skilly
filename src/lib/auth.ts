import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User, UserRole } from "@/types/database";

// React.cache() deduplicates this within a single render pass — layout,
// page, and Header all call getUser() but only the first actually hits the DB.
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();

  // getSession() reads the JWT from the cookie — no network round-trip (~5ms).
  // The proxy already rejects unauthenticated requests before they reach here,
  // so the session cookie is valid. We still query the DB for the full profile
  // so that role changes take effect immediately (role comes from DB, not JWT).
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single();

  return data as User | null;
});

export async function requireRole(allowed: UserRole[]) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!allowed.includes(user.role)) redirect("/unauthorized");
  return user;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export function dashboardPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    super_admin: "/super-admin",
    trainer: "/trainer",
    manager: "/manager",
    employee: "/employee",
  };
  return paths[role];
}

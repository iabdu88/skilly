import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User, UserRole } from "@/types/database";

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  // We fetch the full profile from the DB rather than reading role/company_id
  // from the JWT because JWTs are cached and won't reflect role changes made
  // after the token was issued (e.g. an admin demoting a user).
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  return data as User | null;
}

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

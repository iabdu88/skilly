"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLevelInfo } from "@/lib/gamification";

export interface ReportData {
  company: { name: string; id: string };
  generatedAt: string;
  employees: {
    name: string;
    email: string;
    points: number;
    level: string;
    currentStreak: number;
    lessonsCompleted: number;
    certificatesEarned: number;
  }[];
  courses: { title: string; completions: number; totalEnrolled: number }[];
  topSellers: { name: string; totalSales: number }[];
  stars: { name: string; type: string; period: string }[];
  summary: {
    totalEmployees: number;
    totalManagers: number;
    totalLessonsCompleted: number;
    totalSalesAmount: number;
    avgXP: number;
  };
}

export async function fetchReportData(companyId?: string): Promise<ReportData | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: actor } = await supabase.from("users").select("role, company_id").eq("id", user.id).single();
  if (!actor) return { error: "User not found." };

  // Determine which company to report on
  let targetCompanyId: string;
  if (actor.role === "super_admin" && companyId) {
    targetCompanyId = companyId;
  } else if (actor.role === "trainer" && actor.company_id) {
    targetCompanyId = actor.company_id;
  } else {
    return { error: "No company context." };
  }

  const admin = createAdminClient();

  const [
    { data: company },
    { data: employees },
    { data: managers },
    { data: courses },
    { data: salesEntries },
    { data: stars },
  ] = await Promise.all([
    admin.from("companies").select("id, name").eq("id", targetCompanyId).single(),
    admin.from("users").select("id, full_name, email, points, current_streak").eq("company_id", targetCompanyId).eq("role", "employee"),
    admin.from("users").select("id").eq("company_id", targetCompanyId).eq("role", "manager"),
    admin.from("courses").select("id, title").eq("company_id", targetCompanyId),
    admin.from("sales_entries").select("user_id, amount, users!inner(full_name)").eq("company_id", targetCompanyId),
    admin.from("stars").select("users!inner(full_name), type, period").eq("company_id", targetCompanyId).order("created_at", { ascending: false }).limit(10),
  ]);

  if (!company) return { error: "Company not found." };

  // Per-employee stats
  const employeeIds = (employees ?? []).map((e) => e.id);
  const [{ data: progressData }, { data: certData }] = await Promise.all([
    admin.from("lesson_progress").select("user_id").in("user_id", employeeIds).eq("status", "completed"),
    admin.from("certificates").select("user_id").in("user_id", employeeIds),
  ]);

  const lessonsByUser: Record<string, number> = {};
  const certsByUser: Record<string, number> = {};
  (progressData ?? []).forEach((p) => { lessonsByUser[p.user_id] = (lessonsByUser[p.user_id] ?? 0) + 1; });
  (certData ?? []).forEach((c) => { certsByUser[c.user_id] = (certsByUser[c.user_id] ?? 0) + 1; });

  const employeeRows = (employees ?? []).map((e) => ({
    name: e.full_name,
    email: e.email,
    points: e.points ?? 0,
    level: getLevelInfo(e.points ?? 0).name,
    currentStreak: e.current_streak ?? 0,
    lessonsCompleted: lessonsByUser[e.id] ?? 0,
    certificatesEarned: certsByUser[e.id] ?? 0,
  })).sort((a, b) => b.points - a.points);

  // Per-course completion
  const courseRows = await Promise.all((courses ?? []).map(async (c) => {
    const { data: lessons } = await admin.from("lessons").select("id").eq("course_id", c.id);
    const lessonIds = (lessons ?? []).map((l) => l.id);
    if (lessonIds.length === 0) return { title: c.title, completions: 0, totalEnrolled: employeeIds.length };

    const completionsByEmployee = await Promise.all(employeeIds.map(async (uid) => {
      const { data: prog } = await admin.from("lesson_progress").select("id").in("lesson_id", lessonIds).eq("user_id", uid).eq("status", "completed");
      return (prog?.length ?? 0) === lessonIds.length ? 1 : 0;
    }));
    return {
      title: c.title,
      completions: completionsByEmployee.reduce((a: number, b: number) => a + b, 0),
      totalEnrolled: employeeIds.length,
    };
  }));

  // Sales by employee
  const salesByEmployee: Record<string, { name: string; total: number }> = {};
  type SalesRow = { user_id: string; amount: number; users: { full_name: string } | { full_name: string }[] };
  (salesEntries as unknown as SalesRow[] ?? []).forEach((s) => {
    const usersVal = s.users;
    const name = Array.isArray(usersVal) ? (usersVal[0]?.full_name ?? "Unknown") : (usersVal?.full_name ?? "Unknown");
    if (!salesByEmployee[s.user_id]) salesByEmployee[s.user_id] = { name, total: 0 };
    salesByEmployee[s.user_id].total += s.amount;
  });
  const topSellers = Object.values(salesByEmployee).sort((a, b) => b.total - a.total).slice(0, 5).map((s) => ({
    name: s.name,
    totalSales: s.total,
  }));

  const totalSalesAmount = Object.values(salesByEmployee).reduce((sum, s) => sum + s.total, 0);
  const totalXP = employeeRows.reduce((sum, e) => sum + e.points, 0);
  const avgXP = employeeRows.length > 0 ? Math.round(totalXP / employeeRows.length) : 0;

  return {
    company: { name: company.name, id: company.id },
    generatedAt: new Date().toISOString(),
    employees: employeeRows,
    courses: courseRows,
    topSellers,
    stars: (stars as unknown as Array<{ users: { full_name: string } | { full_name: string }[]; type: string; period: string }> ?? []).map((s) => {
      const usersVal = s.users;
      const name = Array.isArray(usersVal) ? (usersVal[0]?.full_name ?? "Unknown") : (usersVal?.full_name ?? "Unknown");
      return { name, type: s.type, period: s.period };
    }),
    summary: {
      totalEmployees: employeeIds.length,
      totalManagers: managers?.length ?? 0,
      totalLessonsCompleted: (progressData ?? []).length,
      totalSalesAmount,
      avgXP,
    },
  };
}

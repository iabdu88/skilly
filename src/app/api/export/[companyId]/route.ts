import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const [
    { data: company },
    { data: users },
    { data: courses },
    { data: lessons },
    { data: salesEntries },
    { data: certificates },
    { data: stars },
    { data: suggestions },
  ] = await Promise.all([
    admin.from("companies").select("*").eq("id", companyId).single(),
    admin.from("users").select("id, full_name, email, role, points, current_streak, is_active, created_at").eq("company_id", companyId),
    admin.from("courses").select("id, title, description, is_published, created_at").eq("company_id", companyId),
    admin.from("lessons").select("id, course_id, title, order_index, created_at"),
    admin.from("sales_entries").select("*").eq("company_id", companyId),
    admin.from("certificates").select("*").eq("company_id", companyId),
    admin.from("stars").select("*").eq("company_id", companyId),
    admin.from("suggestions").select("*").eq("company_id", companyId),
  ]);

  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const exportData = {
    exportedAt: new Date().toISOString(),
    exportedBy: user.id,
    company,
    users: users ?? [],
    courses: courses ?? [],
    lessons: lessons ?? [],
    salesEntries: salesEntries ?? [],
    certificates: certificates ?? [],
    stars: stars ?? [],
    suggestions: suggestions ?? [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${company.name}-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

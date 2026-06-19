import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const user     = await requireRole(["trainer"]);
  const supabase = await createClient();

  const { data: company } = user.company_id
    ? await supabase.from("companies").select("name, logo_url").eq("id", user.company_id).single()
    : { data: null };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        role={user.role}
        userName={user.full_name}
        avatarUrl={user.avatar_url}
        companyLogo={company?.logo_url ?? null}
        companyName={company?.name ?? null}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}

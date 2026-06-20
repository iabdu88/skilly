import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// Company name + logo are the same for all users in a company and change very
// rarely. Cache for 5 minutes using the admin client (RLS not needed here).
export const getCachedCompany = unstable_cache(
  async (companyId: string) => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("companies")
      .select("name, logo_url")
      .eq("id", companyId)
      .single();
    return data as { name: string; logo_url: string | null } | null;
  },
  ["company"],
  { revalidate: 300 }
);

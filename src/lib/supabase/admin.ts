import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Server-only. Never import in client components.
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (Supabase dashboard → Settings → API).
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface AuditParams {
  actor_id: string;
  actor_email: string;
  actor_name: string;
  action: string;
  target_type?: string;
  target_id?: string;
  target_label?: string;
  details?: Record<string, unknown>;
  company_id?: string | null;
}

// Uses admin client so audit logs are never blocked by RLS
export async function logAudit(params: AuditParams): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert(params);
  } catch {
    // Audit logging must never break the main flow
  }
}

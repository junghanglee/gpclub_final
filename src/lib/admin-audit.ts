import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type AdminAuditInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Json;
};

export async function recordAdminAudit(input: AdminAuditInput): Promise<void> {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("admin_audit_logs").insert({
      actor_id: data.user.id,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Audit logging must never block a successful content save.
  }
}

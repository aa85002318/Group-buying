import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";

/** Strip sensitive fields before writing audit metadata */
export function sanitizeAuditPayload(data: unknown): unknown {
  if (data == null || typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map(sanitizeAuditPayload);

  const blocked = new Set([
    "password",
    "carrier_code",
    "carrier_number",
    "token",
    "access_token",
    "refresh_token",
    "pickup_token",
  ]);

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (blocked.has(key)) {
      out[key] = "[redacted]";
      continue;
    }
    out[key] = typeof value === "object" && value !== null ? sanitizeAuditPayload(value) : value;
  }
  return out;
}

export async function writeAdminAudit(params: {
  adminUserId: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata?: Record<string, unknown>;
  oldData?: unknown;
  newData?: unknown;
}) {
  if (!isSupabaseConfigured()) return;

  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      user_id: params.adminUserId,
      action: params.action,
      entity_type: params.resourceType,
      entity_id: params.resourceId,
      old_data: sanitizeAuditPayload(params.oldData ?? null),
      new_data: sanitizeAuditPayload(
        params.newData ?? params.metadata ?? null
      ),
    });
  } catch (e) {
    console.error("writeAdminAudit failed:", e);
  }
}

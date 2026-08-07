import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  entityTypesForModule,
  type AuditModuleId,
} from "@/lib/admin/audit-labels";
import { sanitizeAuditPayload } from "@/lib/services/auditService";

export const dynamic = "force-dynamic";

const SELECT_WITH_PROFILE =
  "id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent, created_at, profiles:profiles!audit_logs_user_id_fkey(full_name, email)";

const SELECT_PLAIN =
  "id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent, created_at";

function sanitizeLogRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    old_data: sanitizeAuditPayload(row.old_data ?? null),
    new_data: sanitizeAuditPayload(row.new_data ?? null),
  };
}

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0) || 0);
  const entityType = searchParams.get("entity_type")?.trim() || "";
  const action = searchParams.get("action")?.trim() || "";
  const moduleId = (searchParams.get("module")?.trim() || "") as AuditModuleId | "";
  const q = (searchParams.get("q") ?? "").trim();
  const from = searchParams.get("from")?.trim() || "";
  const to = searchParams.get("to")?.trim() || "";
  const format = searchParams.get("format")?.trim() || "json";

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ logs: [], total: 0 });
  }

  const admin = createAdminClient();

  type FilterableQuery = {
    eq: (column: string, value: unknown) => FilterableQuery;
    or: (filters: string) => FilterableQuery;
    gte: (column: string, value: string) => FilterableQuery;
    lte: (column: string, value: string) => FilterableQuery;
    in: (column: string, values: readonly string[]) => FilterableQuery;
  };

  const applyFilters = <T extends FilterableQuery>(query: T): T => {
    let qy: FilterableQuery = query;
    if (entityType) {
      qy = qy.eq("entity_type", entityType);
    } else if (moduleId && moduleId !== "other") {
      const types = entityTypesForModule(moduleId);
      if (types?.length) qy = qy.in("entity_type", types);
    }
    if (action) qy = qy.eq("action", action);
    if (from) qy = qy.gte("created_at", `${from}T00:00:00.000Z`);
    if (to) qy = qy.lte("created_at", `${to}T23:59:59.999Z`);
    if (q) {
      const safe = q.replace(/[%_,.()]/g, " ").trim();
      if (safe) {
        qy = qy.or(
          `entity_id.ilike.%${safe}%,action.ilike.%${safe}%,entity_type.ilike.%${safe}%`
        );
      }
    }
    return qy as T;
  };

  let data: Array<Record<string, unknown>> | null = null;
  let count: number | null = null;

  const query = applyFilters(
    admin
      .from("audit_logs")
      .select(SELECT_WITH_PROFILE, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)
  );

  const primary = await query;
  if (primary.error) {
    const fallback = await applyFilters(
      admin
        .from("audit_logs")
        .select(SELECT_PLAIN, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)
    );
    if (fallback.error) {
      return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    }
    data = (fallback.data as Array<Record<string, unknown>> | null) ?? [];
    count = fallback.count;
  } else {
    data = (primary.data as Array<Record<string, unknown>> | null) ?? [];
    count = primary.count;
  }

  const logs = (data ?? []).map((row) => sanitizeLogRow(row));

  if (format === "csv") {
    const header = [
      "時間",
      "操作者",
      "動作",
      "資源類型",
      "資源ID",
      "IP",
      "舊資料",
      "新資料",
    ];
    const lines = logs.map((log) => {
      const profile = log.profiles as { full_name?: string; email?: string } | null | undefined;
      const who = profile?.full_name || profile?.email || String(log.user_id ?? "");
      const cells = [
        String(log.created_at ?? ""),
        who,
        String(log.action ?? ""),
        String(log.entity_type ?? ""),
        String(log.entity_id ?? ""),
        String(log.ip_address ?? ""),
        JSON.stringify(log.old_data ?? null),
        JSON.stringify(log.new_data ?? null),
      ];
      return cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",");
    });
    const csv = "\uFEFF" + [header.join(","), ...lines].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-logs.csv"`,
      },
    });
  }

  // Distinct entity types for filter UI (best-effort, recent sample)
  const typesRes = await admin
    .from("audit_logs")
    .select("entity_type")
    .order("created_at", { ascending: false })
    .limit(300);
  const entityTypes = Array.from(
    new Set((typesRes.data ?? []).map((r) => String(r.entity_type)).filter(Boolean))
  ).sort();

  return NextResponse.json({
    logs,
    total: count ?? logs.length,
    entity_types: entityTypes,
    limit,
    offset,
  });
}

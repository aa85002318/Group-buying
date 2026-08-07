"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Download, RefreshCw } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AUDIT_MODULES,
  COMMON_AUDIT_ACTIONS,
  labelAuditAction,
  labelAuditEntity,
  type AuditModuleId,
} from "@/lib/admin/audit-labels";
import { cn, formatDate } from "@/lib/utils";

type AuditLog = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  user_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  old_data?: unknown;
  new_data?: unknown;
  profiles?: { full_name?: string; email?: string } | null;
};

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  if (value == null) {
    return (
      <div>
        <p className="text-[11px] font-semibold text-[#756B64]">{label}</p>
        <p className="text-xs text-[#9A928A]">—</p>
      </div>
    );
  }
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold text-[#756B64]">{label}</p>
      <pre className="max-h-48 overflow-auto rounded-lg bg-[#F7F8FA] p-2 text-[11px] leading-relaxed text-[#2F2925]">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [moduleId, setModuleId] = useState<AuditModuleId | "">("");
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const buildParams = useCallback(
    (extra?: Record<string, string>) => {
      const params = new URLSearchParams({ limit: "80" });
      if (moduleId) params.set("module", moduleId);
      if (entityType) params.set("entity_type", entityType);
      if (action) params.set("action", action);
      if (q.trim()) params.set("q", q.trim());
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (extra) {
        for (const [k, v] of Object.entries(extra)) params.set(k, v);
      }
      return params;
    },
    [moduleId, entityType, action, q, from, to]
  );

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/audit-logs?${buildParams()}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setLogs(d.logs ?? []);
        setTotal(d.total ?? 0);
        setEntityTypes(d.entity_types ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, [buildParams]);

  useEffect(() => {
    load();
  }, [load]);

  const exportCsv = () => {
    window.open(`/api/admin/audit-logs?${buildParams({ format: "csv", limit: "200" })}`, "_blank");
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="操作紀錄"
        description="完整後台稽核：CMS 發布／排程、門市協作、訂單會員、素材庫等。敏感欄位（密碼、載具、token）已脫敏。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={exportCsv}>
              <Download className="mr-1 h-3.5 w-3.5" />
              匯出 CSV
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={load}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" />
              重新整理
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 rounded-[16px] border border-[#E5E8EE] bg-white p-3">
        <select
          className="rounded-lg border border-[#E5E8EE] px-3 py-2 text-sm"
          value={moduleId}
          onChange={(e) => {
            setModuleId(e.target.value as AuditModuleId | "");
            setEntityType("");
          }}
        >
          <option value="">全部模組</option>
          {AUDIT_MODULES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>

        <select
          className="rounded-lg border border-[#E5E8EE] px-3 py-2 text-sm"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        >
          <option value="">全部資源</option>
          {entityTypes.map((t) => (
            <option key={t} value={t}>
              {labelAuditEntity(t)}
            </option>
          ))}
        </select>

        <select
          className="rounded-lg border border-[#E5E8EE] px-3 py-2 text-sm"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="">全部動作</option>
          {COMMON_AUDIT_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {labelAuditAction(a)}
            </option>
          ))}
          <option value="update_order_status">更新訂單狀態</option>
          <option value="broadcast_member_notification">廣播會員通知</option>
        </select>

        <Input
          type="date"
          className="w-auto"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="起日"
        />
        <Input
          type="date"
          className="w-auto"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label="迄日"
        />

        <Input
          className="min-w-[160px] flex-1"
          placeholder="搜尋動作／資源／ID"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") load();
          }}
        />

        <Button type="button" size="sm" onClick={load}>
          套用篩選
        </Button>
      </div>

      <p className="text-xs text-[#756B64]">
        共 {total} 筆（目前顯示 {logs.length} 筆）
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
          <button type="button" className="ml-2 underline" onClick={load}>
            重試
          </button>
        </div>
      ) : logs.length === 0 ? (
        <p className="rounded-xl border border-[#E5E8EE] bg-white p-8 text-center text-sm text-[#756B64]">
          尚無符合條件的操作紀錄
        </p>
      ) : (
        <div className="overflow-hidden rounded-[16px] border border-[#E5E8EE] bg-white">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-[#F7F8FA] text-left text-[#756B64]">
              <tr>
                <th className="w-8 px-2 py-2" />
                <th className="px-3 py-2">時間</th>
                <th className="px-3 py-2">操作者</th>
                <th className="px-3 py-2">動作</th>
                <th className="px-3 py-2">資源</th>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const open = expanded === log.id;
                return (
                  <Fragment key={log.id}>
                    <tr
                      className={cn(
                        "cursor-pointer border-t border-[#E5E8EE] hover:bg-[#FFFBEA]",
                        open && "bg-[#FFFBEA]"
                      )}
                      onClick={() => setExpanded(open ? null : log.id)}
                    >
                      <td className="px-2 py-2 text-[#153E73]">
                        {open ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-3 py-2">
                        {log.profiles?.full_name ??
                          log.profiles?.email ??
                          log.user_id?.slice(0, 8) ??
                          "—"}
                      </td>
                      <td className="px-3 py-2 font-medium text-[#153E73]">
                        {labelAuditAction(log.action)}
                        <span className="ml-1 font-mono text-[10px] text-[#9A928A]">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-3 py-2">{labelAuditEntity(log.entity_type)}</td>
                      <td className="px-3 py-2 font-mono text-xs">{log.entity_id ?? "—"}</td>
                      <td className="px-3 py-2 font-mono text-xs text-[#756B64]">
                        {log.ip_address ?? "—"}
                      </td>
                    </tr>
                    {open ? (
                      <tr className="border-t border-[#E5E8EE] bg-[#F7F8FA]">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <JsonBlock label="變更前" value={log.old_data} />
                            <JsonBlock label="變更後" value={log.new_data} />
                          </div>
                          {log.user_agent ? (
                            <p className="mt-2 truncate text-[11px] text-[#9A928A]">
                              UA：{log.user_agent}
                            </p>
                          ) : null}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

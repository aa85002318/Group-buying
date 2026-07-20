"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { formatDate } from "@/lib/utils";

type AuditLog = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  user_id?: string | null;
  profiles?: { full_name?: string; email?: string } | null;
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityType, setEntityType] = useState("");

  const load = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ limit: "100" });
    if (entityType) params.set("entity_type", entityType);
    fetch(`/api/admin/audit-logs?${params}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setLogs(d.logs ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when filter changes
  }, [entityType]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="操作紀錄"
        description="後台重要操作稽核（訂單狀態、會員停用、內容發布等）。不含完整載具號碼或密碼。"
      />

      <div className="flex flex-wrap gap-2">
        <select
          className="rounded-lg border border-border px-3 py-2 text-sm"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        >
          <option value="">全部資源</option>
          <option value="order">App 訂單</option>
          <option value="profile">App 會員</option>
          <option value="product">商品</option>
          <option value="article">文章</option>
          <option value="group_buy_event">團購</option>
        </select>
        <button
          type="button"
          className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          onClick={load}
        >
          重新整理
        </button>
      </div>

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
        <p className="rounded-xl border border-border bg-white p-8 text-center text-sm text-muted-foreground">
          尚無操作紀錄
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-3 py-2">時間</th>
                <th className="px-3 py-2">操作者</th>
                <th className="px-3 py-2">動作</th>
                <th className="px-3 py-2">資源</th>
                <th className="px-3 py-2">ID</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-border">
                  <td className="px-3 py-2 text-xs">{formatDate(log.created_at)}</td>
                  <td className="px-3 py-2">
                    {log.profiles?.full_name ?? log.profiles?.email ?? log.user_id?.slice(0, 8) ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-medium">{log.action}</td>
                  <td className="px-3 py-2">{log.entity_type}</td>
                  <td className="px-3 py-2 font-mono text-xs">{log.entity_id ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

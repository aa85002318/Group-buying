"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

type LogRow = {
  id: string;
  action: string;
  result: string;
  failure_reason?: string | null;
  created_at: string;
  claim_id?: string | null;
  campaign_id?: string | null;
};

export default function MemberGiftLogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const q = filter ? `?result=${encodeURIComponent(filter)}` : "";
    fetch(`/api/admin/member-gifts/logs${q}`)
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []));
  }, [filter]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="核銷紀錄"
        description="成功、失敗與異常操作稽核；不建議直接刪除紀錄，錯誤請使用沖銷流程"
        actions={
          <a
            href={`/api/admin/member-gifts/logs?format=csv${filter ? `&result=${encodeURIComponent(filter)}` : ""}`}
            className="rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm font-semibold text-[#153E73] hover:bg-[#FFFDF6]"
          >
            匯出 CSV
          </a>
        }
      />

      <div className="flex flex-wrap gap-2">
        {[
          { v: "", l: "全部" },
          { v: "success", l: "成功" },
          { v: "failure", l: "失敗" },
          { v: "anomaly", l: "異常" },
        ].map((opt) => (
          <button
            key={opt.v || "all"}
            type="button"
            onClick={() => setFilter(opt.v)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              filter === opt.v ? "bg-[#FEE169] text-[#153E73]" : "bg-[#F3F4F6] text-[#687386]"
            }`}
          >
            {opt.l}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {logs.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-[#E7EAF0] px-4 py-8 text-center text-sm text-[#8A94A6]">
            尚無紀錄
          </li>
        ) : (
          logs.map((log) => (
            <li key={log.id} className="rounded-2xl border border-[#E7EAF0] bg-white px-4 py-3 text-sm">
              <p className="font-semibold text-[#153E73]">
                {log.action} · {log.result}
              </p>
              <p className="text-xs text-[#687386]">
                {log.failure_reason || "—"} ·{" "}
                {new Date(log.created_at).toLocaleString("zh-TW")}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

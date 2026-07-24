"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";

type BackupLog = {
  id: string;
  status: string;
  backup_type: string;
  drive_account?: string | null;
  error_message?: string | null;
  created_at: string;
  finished_at?: string | null;
};

export default function StoreBackupsPage() {
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/store/backups")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .catch(() => setLogs([]));
  }, []);

  const placeholderBackup = async () => {
    setMsg(null);
    const res = await fetch("/api/admin/store/backups", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "備份尚未啟用");
      return;
    }
    setMsg(data.message ?? "已記錄備份請求");
    setLogs((prev) => [data.log, ...prev].filter(Boolean));
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="備份管理"
        description="Google Drive 備份將於第二階段完整串接。MVP 先保留介面與紀錄表 store_backup_logs。"
      />

      <div className="rounded-[16px] border border-[#E9DED4] bg-[#FFF8F5] p-5 space-y-3">
        <p className="text-sm text-[#2F2925]">
          <strong>連線狀態：</strong>尚未授權（請設定環境變數後於第二階段啟用）
        </p>
        <p className="text-sm text-[#756B64]">
          需要：`NEXT_PUBLIC_GOOGLE_CLIENT_ID`、`GOOGLE_DRIVE_FOLDER_ID`，並在 Google Cloud OAuth
          加入 `https://chimeidiygroupbuying.com`。
        </p>
        <p className="text-sm text-[#756B64]">
          每次備份四組資料：產品效期、產品報廢、產品列表、產品資料庫（Excel + JSON）。
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void placeholderBackup()}>
            立即備份（紀錄）
          </Button>
          <Button type="button" variant="outline" disabled>
            重新授權（第二階段）
          </Button>
        </div>
        {msg ? <p className="text-sm text-[#6F4E37]">{msg}</p> : null}
      </div>

      <div className="overflow-x-auto rounded-[16px] border border-[#E9DED4] bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[#FAF6F1] text-left text-[#756B64]">
            <tr>
              <th className="px-4 py-3">時間</th>
              <th className="px-4 py-3">類型</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3">說明</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-[#E9DED4]">
                <td className="px-4 py-3">
                  {new Date(log.finished_at ?? log.created_at).toLocaleString("zh-TW")}
                </td>
                <td className="px-4 py-3">{log.backup_type}</td>
                <td className="px-4 py-3">{log.status}</td>
                <td className="px-4 py-3">{log.error_message ?? "—"}</td>
              </tr>
            ))}
            {!logs.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[#756B64]">
                  尚無備份紀錄
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { formatDate } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/utils";

type PushNotification = {
  id: string;
  title: string;
  body: string;
  target_role: string | null;
  sent_at: string;
};

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetRole, setTargetRole] = useState("member");
  const [sent, setSent] = useState(false);
  const [history, setHistory] = useState<PushNotification[]>([]);

  const loadHistory = () => {
    fetch("/api/admin/push-notifications")
      .then((r) => r.json())
      .then((d) => setHistory(d.notifications ?? []))
      .catch(() => {});
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSend = async () => {
    await fetch("/api/push-notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, targetRole }),
    });
    setSent(true);
    setTitle("");
    setBody("");
    loadHistory();
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="推播通知" description="發送推播給指定角色或全體會員" />

      <div className="max-w-lg space-y-3 rounded-xl bg-white p-4 shadow-card">
        <Input placeholder="標題" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea
          className="input-field min-h-[100px]"
          placeholder="內容"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <select className="input-field" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Button onClick={handleSend} disabled={!title || !body}>
          發送推播
        </Button>
        {sent && <p className="text-sm text-green-700">已發送</p>}
      </div>

      <div>
        <h2 className="font-medium text-coffee mb-3">發送紀錄</h2>
        <AdminTable
          columns={[
            { key: "title", header: "標題", render: (n) => n.title },
            { key: "body", header: "內容", render: (n) => <span className="line-clamp-2">{n.body}</span> },
            {
              key: "target",
              header: "對象",
              render: (n) => (n.target_role ? ROLE_LABELS[n.target_role] ?? n.target_role : "全部"),
            },
            { key: "sent", header: "發送時間", render: (n) => <span className="text-xs">{formatDate(n.sent_at)}</span> },
          ]}
          rows={history}
          emptyText="尚無推播紀錄"
        />
      </div>
    </div>
  );
}

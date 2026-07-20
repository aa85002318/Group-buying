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

  const [inAppTitle, setInAppTitle] = useState("");
  const [inAppMessage, setInAppMessage] = useState("");
  const [inAppType, setInAppType] = useState("system");
  const [inAppUserId, setInAppUserId] = useState("");
  const [inAppSending, setInAppSending] = useState(false);
  const [inAppSent, setInAppSent] = useState<string | null>(null);

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

  const sendInApp = async () => {
    if (!inAppTitle.trim() || !inAppMessage.trim()) return;
    setInAppSending(true);
    try {
      const res = await fetch("/api/admin/member-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: inAppTitle.trim(),
          message: inAppMessage.trim(),
          notification_type: inAppType,
          user_id: inAppUserId.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "發送失敗");
      setInAppSent(`已建立 ${data.sent} 則 App 內通知（非手機推播）`);
      setInAppTitle("");
      setInAppMessage("");
      setInAppUserId("");
      setTimeout(() => setInAppSent(null), 4000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "發送失敗");
    } finally {
      setInAppSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader title="通知管理" description="App 內通知與推播（推播需裝置授權）" />

      <section className="max-w-lg space-y-3 rounded-xl bg-white p-4 shadow-card">
        <h2 className="font-medium text-coffee">App 內通知</h2>
        <p className="text-xs text-muted-foreground">
          建立於會員通知中心，不會發送瀏覽器或手機推播。
        </p>
        <Input placeholder="標題" value={inAppTitle} onChange={(e) => setInAppTitle(e.target.value)} />
        <textarea
          className="input-field min-h-[100px] w-full"
          placeholder="內容"
          value={inAppMessage}
          onChange={(e) => setInAppMessage(e.target.value)}
        />
        <select className="input-field w-full" value={inAppType} onChange={(e) => setInAppType(e.target.value)}>
          <option value="system">系統公告</option>
          <option value="product">商品通知</option>
          <option value="livestream">直播通知</option>
        </select>
        <Input
          placeholder="指定會員 user id（留空則全部會員）"
          value={inAppUserId}
          onChange={(e) => setInAppUserId(e.target.value)}
        />
        <Button onClick={sendInApp} disabled={inAppSending || !inAppTitle || !inAppMessage}>
          {inAppSending ? "建立中…" : "建立 App 內通知"}
        </Button>
        {inAppSent && <p className="text-sm text-green-700">{inAppSent}</p>}
      </section>

      <section className="space-y-4">
        <AdminPageHeader title="推播通知" description="裝置推播功能將於後續版本完善" />

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
          <h2 className="mb-3 font-medium text-coffee">推播紀錄</h2>
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
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SupportPage() {
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [chat, setChat] = useState<Array<{ role: string; content: string }>>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setChat((c) => [...c, { role: "user", content: message }]);
    try {
      const res = await fetch("/api/support/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });
      const data = await res.json();
      setChat((c) => [...c, { role: "bot", content: data.reply }]);
    } catch {
      setChat((c) => [...c, { role: "bot", content: "連線失敗，請稍後再試。" }]);
    }
    setMessage("");
    setLoading(false);
  };

  const createTicket = async () => {
    if (!subject.trim()) return;
    await fetch("/api/support-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, description: subject }),
    });
    alert("工單已建立，客服將盡快處理");
    setSubject("");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-coffee">客服中心</h1>
      <div className="min-h-[200px] rounded-xl bg-white p-4 shadow-card space-y-3">
        {chat.length === 0 && <p className="text-sm text-muted-foreground">有問題？在下方輸入訊息與我們聯繫。</p>}
        {chat.map((m, i) => (
          <div key={i} className={`text-sm ${m.role === "user" ? "text-right" : ""}`}>
            <span className={`inline-block rounded-lg px-3 py-2 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {m.content}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="輸入訊息..." onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
        <Button onClick={sendMessage} disabled={loading}>送出</Button>
      </div>
      <div className="border-t pt-4 space-y-2">
        <h2 className="font-medium">建立工單</h2>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="問題主旨" />
        <Button variant="outline" className="w-full" onClick={createTicket}>提交工單</Button>
      </div>
    </div>
  );
}

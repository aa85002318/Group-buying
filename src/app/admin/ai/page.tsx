"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_AI_SETTINGS, type AISettings } from "@/lib/ai/types";

type Stats = {
  todayUsers?: number;
  todayAsks?: number;
  successRate?: string;
  avgMs?: string;
  failures?: number;
  topTool?: string;
  topIngredients?: Array<{ label: string; count: number }>;
  topFailures?: Array<{ label: string; count: number }>;
  recipeCtr?: string;
  productCtr?: string;
  cartCvr?: string;
};

const TOOL_LABELS: Record<string, string> = {
  recipes: "材料推薦",
  scale: "份量換算",
  oven: "烤箱換算",
  substitute: "材料替代",
  failure: "失敗分析",
  chat: "對話",
};

export default function AdminAIPage() {
  const [stats, setStats] = useState<Stats>({});
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/ai")
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats ?? {});
        if (d.settings) setSettings({ ...DEFAULT_AI_SETTINGS, ...d.settings });
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    const res = await fetch("/api/admin/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setMessage(res.ok ? "已儲存" : "儲存失敗");
  };

  const cards = [
    ["今日使用人數", stats.todayUsers ?? 0],
    ["今日提問次數", stats.todayAsks ?? 0],
    ["回覆成功率", stats.successRate ?? "—"],
    ["平均回覆時間", stats.avgMs ?? "—"],
    ["失敗次數", stats.failures ?? 0],
    ["最常使用功能", TOOL_LABELS[String(stats.topTool)] ?? stats.topTool ?? "—"],
    ["食譜點擊率", stats.recipeCtr ?? "—"],
    ["商品點擊率", stats.productCtr ?? "—"],
    ["加入購物車轉換率", stats.cartCvr ?? "—"],
  ] as const;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="AI 烘焙助手"
        description="統計為去識別化匯總，後台不瀏覽會員完整私人對話。"
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-4 shadow-card">
            <p className="text-xs text-[#8A94A6]">{label}</p>
            <p className="mt-1 text-2xl font-black text-[#153E73]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="font-semibold text-[#153E73]">熱門材料</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {(stats.topIngredients ?? []).length === 0 ? (
              <li className="text-[#8A94A6]">尚無資料</li>
            ) : (
              (stats.topIngredients ?? []).map((i) => (
                <li key={i.label}>
                  {i.label}（{i.count}）
                </li>
              ))
            )}
          </ul>
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="font-semibold text-[#153E73]">熱門失敗問題</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {(stats.topFailures ?? []).length === 0 ? (
              <li className="text-[#8A94A6]">尚無資料</li>
            ) : (
              (stats.topFailures ?? []).map((i) => (
                <li key={i.label}>
                  {i.label}（{i.count}）
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-card">
        <h2 className="font-semibold text-[#153E73]">額度與開關</h2>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
          />
          啟用 AI 功能
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.maintenance}
            onChange={(e) => setSettings((s) => ({ ...s, maintenance: e.target.checked }))}
          />
          維護模式
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.saveConversationsDefault}
            onChange={(e) =>
              setSettings((s) => ({ ...s, saveConversationsDefault: e.target.checked }))
            }
          />
          預設保存對話
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <Num
            label="訪客每日次數"
            value={settings.guestDailyLimit}
            onChange={(n) => setSettings((s) => ({ ...s, guestDailyLimit: n }))}
          />
          <Num
            label="會員每日次數"
            value={settings.memberDailyLimit}
            onChange={(n) => setSettings((s) => ({ ...s, memberDailyLimit: n }))}
          />
          <Num
            label="管理員每日次數"
            value={settings.adminDailyLimit}
            onChange={(n) => setSettings((s) => ({ ...s, adminDailyLimit: n }))}
          />
          <Num
            label="單次輸入字數"
            value={settings.maxInputChars}
            onChange={(n) => setSettings((s) => ({ ...s, maxInputChars: n }))}
          />
          <Num
            label="對話保留天數"
            value={settings.conversationRetentionDays}
            onChange={(n) => setSettings((s) => ({ ...s, conversationRetentionDays: n }))}
          />
          <Num
            label="回覆長度 tokens"
            value={settings.replyMaxTokens}
            onChange={(n) => setSettings((s) => ({ ...s, replyMaxTokens: n }))}
          />
        </div>
        <div>
          <p className="mb-1 text-xs text-[#8A94A6]">系統提示詞版本</p>
          <Input
            value={settings.systemPromptVersion}
            onChange={(e) => setSettings((s) => ({ ...s, systemPromptVersion: e.target.value }))}
          />
        </div>
        <div>
          <p className="mb-1 text-xs text-[#8A94A6]">免責聲明</p>
          <textarea
            className="input-field min-h-24 w-full"
            value={settings.disclaimer}
            onChange={(e) => setSettings((s) => ({ ...s, disclaimer: e.target.value }))}
          />
        </div>
        <div>
          <p className="mb-1 text-xs text-[#8A94A6]">敏感內容規則</p>
          <textarea
            className="input-field min-h-20 w-full"
            value={settings.sensitiveRules}
            onChange={(e) => setSettings((s) => ({ ...s, sensitiveRules: e.target.value }))}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(settings.toolLimits).map(([tool, limit]) => (
            <Num
              key={tool}
              label={`${TOOL_LABELS[tool] ?? tool} 每日上限`}
              value={limit}
              onChange={(n) =>
                setSettings((s) => ({ ...s, toolLimits: { ...s.toolLimits, [tool]: n } }))
              }
            />
          ))}
        </div>
        <Button className="min-h-11" onClick={save}>
          儲存設定
        </Button>
        {message && <p className="text-sm text-[#153E73]">{message}</p>}
      </section>
    </div>
  );
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs text-[#8A94A6]">{label}</p>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Eye, History, Rocket, RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LayoutVersionMeta } from "@/lib/home/layout-versions";
import { cn } from "@/lib/utils";

type LayoutState = {
  draft: LayoutVersionMeta | null;
  scheduled: LayoutVersionMeta | null;
  versions: LayoutVersionMeta[];
};

export function HomeLayoutPublishBar({ onChanged }: { onChanged?: () => void }) {
  const [state, setState] = useState<LayoutState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/home/layout")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setState({
          draft: d.draft ?? null,
          scheduled: d.scheduled ?? null,
          versions: d.versions ?? [],
        });
      })
      .catch((e) => setMessage(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action: string, body: Record<string, unknown> = {}) => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/home/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "操作失敗");
      setMessage(
        action === "publish"
          ? "已發布到線上"
          : action === "schedule"
            ? "已設定排程"
            : action === "restore"
              ? "已還原至草稿"
              : action === "cancel_schedule"
                ? "已取消排程"
                : action === "reset_draft_from_live"
                  ? "草稿已從線上同步"
                  : "完成"
      );
      load();
      onChanged?.();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "操作失敗");
    } finally {
      setBusy(false);
    }
  };

  const draft = state?.draft;
  const scheduled = state?.scheduled;
  const history = (state?.versions ?? []).filter((v) => v.status === "published" || v.status === "archived");

  return (
    <div className="space-y-3 rounded-xl border border-border bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-coffee">版面發布</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            區塊變更先寫入草稿，發布後才會影響前台。訪客只會看到已發布版。
          </p>
          {loading ? (
            <p className="mt-2 text-xs text-muted-foreground">載入中…</p>
          ) : draft ? (
            <p className="mt-2 text-xs text-muted-foreground">
              目前草稿 v{draft.version_number}
              {draft.updated_at
                ? ` · 更新於 ${new Date(draft.updated_at).toLocaleString("zh-TW")}`
                : ""}
              {scheduled?.scheduled_at
                ? ` · 已排程 ${new Date(scheduled.scheduled_at).toLocaleString("zh-TW")}`
                : ""}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/home/preview"
            className={cn(buttonVariants({ size: "sm", variant: "outline" }), busy && "pointer-events-none opacity-50")}
          >
            <Eye className="mr-1.5 h-4 w-4" />
            預覽
          </Link>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => setShowSchedule((v) => !v)}
          >
            <CalendarClock className="mr-1.5 h-4 w-4" />
            排程
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => setShowHistory((v) => !v)}
          >
            <History className="mr-1.5 h-4 w-4" />
            版本
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => {
              if (!confirm("用目前線上版覆蓋草稿？未發布的草稿變更會遺失。")) return;
              void run("reset_draft_from_live");
            }}
          >
            <RotateCcw className="mr-1.5 h-4 w-4" />
            同步線上
          </Button>
          <Button
            size="sm"
            disabled={busy}
            onClick={() => {
              if (!confirm("確定發布草稿到線上首頁？")) return;
              void run("publish");
            }}
          >
            <Rocket className="mr-1.5 h-4 w-4" />
            發布
          </Button>
        </div>
      </div>

      {message ? (
        <p
          className={cn(
            "rounded-lg px-3 py-2 text-xs",
            message.includes("失敗") || message.includes("必須")
              ? "bg-red-50 text-red-800"
              : "bg-success-soft text-success"
          )}
        >
          {message}
        </p>
      ) : null}

      {showSchedule ? (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border-soft bg-surface-soft/50 p-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              排程發布時間
            </label>
            <Input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            disabled={busy || !scheduleAt}
            onClick={() =>
              void run("schedule", {
                scheduled_at: new Date(scheduleAt).toISOString(),
              })
            }
          >
            儲存排程
          </Button>
          {scheduled ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void run("cancel_schedule")}
            >
              取消排程
            </Button>
          ) : null}
        </div>
      ) : null}

      {showHistory ? (
        <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-border-soft p-3">
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">尚無發布紀錄</p>
          ) : (
            history.map((v) => (
              <div
                key={v.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border-soft px-3 py-2 text-sm"
              >
                <span className="min-w-0 flex-1 font-medium text-coffee">
                  v{v.version_number} · {v.label || v.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {v.published_at
                    ? new Date(v.published_at).toLocaleString("zh-TW")
                    : v.status}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    if (!confirm(`還原 v${v.version_number} 到草稿？`)) return;
                    void run("restore", { version_id: v.id });
                  }}
                >
                  還原到草稿
                </Button>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

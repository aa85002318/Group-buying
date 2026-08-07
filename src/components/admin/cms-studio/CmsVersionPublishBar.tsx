"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, Eye, History, Rocket, RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type CmsVersionMetaLite = {
  id: string;
  version_number: number;
  status: string;
  label: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  updated_at: string;
};

type VersionState = {
  draft: CmsVersionMetaLite | null;
  scheduled: CmsVersionMetaLite | null;
  versions: CmsVersionMetaLite[];
};

type CmsVersionPublishBarProps = {
  /** Admin API that supports GET + POST { action } */
  apiPath: string;
  title?: string;
  description?: string;
  previewHref?: string;
  publishConfirm?: string;
  /** When true, publish/schedule buttons are disabled (e.g. unsaved local edits) */
  publishDisabled?: boolean;
  publishDisabledHint?: string;
  onChanged?: () => void;
};

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatRelativeZh(iso: string): string {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return "";
  const diffMs = target - Date.now();
  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60000);
  if (mins < 1) return diffMs >= 0 ? "不到 1 分鐘後" : "剛剛到期";
  if (mins < 60) return diffMs >= 0 ? `${mins} 分鐘後` : `${mins} 分鐘前到期`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return diffMs >= 0 ? `約 ${hours} 小時後` : `約 ${hours} 小時前到期`;
  const days = Math.round(hours / 24);
  return diffMs >= 0 ? `約 ${days} 天後` : `約 ${days} 天前到期`;
}

export function CmsVersionPublishBar({
  apiPath,
  title = "草稿與發布",
  description = "變更先寫入草稿，發布後才會影響前台。訪客只會看到已發布版。",
  previewHref,
  publishConfirm = "確定發布草稿到線上？",
  publishDisabled = false,
  publishDisabledHint,
  onChanged,
}: CmsVersionPublishBarProps) {
  const [state, setState] = useState<VersionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    fetch(apiPath)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        const scheduled = (d.scheduled ?? null) as CmsVersionMetaLite | null;
        setState({
          draft: d.draft ?? null,
          scheduled,
          versions: d.versions ?? [],
        });
        if (scheduled?.scheduled_at) {
          setScheduleAt(toLocalInputValue(scheduled.scheduled_at));
          setShowSchedule(true);
        }
      })
      .catch((e) => setMessage(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, [apiPath]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!state?.scheduled?.scheduled_at) return;
    const id = window.setInterval(() => setNowTick((n) => n + 1), 30000);
    return () => window.clearInterval(id);
  }, [state?.scheduled?.scheduled_at]);

  const run = async (action: string, body: Record<string, unknown> = {}) => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(apiPath, {
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
            ? "已設定排程（系統約每 5 分鐘檢查並自動上線）"
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
  const history = (state?.versions ?? []).filter(
    (v) => v.status === "published" || v.status === "archived"
  );

  const scheduleRelative = useMemo(() => {
    void nowTick;
    return scheduled?.scheduled_at ? formatRelativeZh(scheduled.scheduled_at) : "";
  }, [scheduled?.scheduled_at, nowTick]);

  const scheduleOverdue = useMemo(() => {
    void nowTick;
    if (!scheduled?.scheduled_at) return false;
    return new Date(scheduled.scheduled_at).getTime() <= Date.now();
  }, [scheduled?.scheduled_at, nowTick]);

  return (
    <div className="space-y-3 rounded-[16px] border border-[#E5E8EE] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[#153E73]">{title}</p>
          <p className="mt-0.5 text-xs text-[#756B64]">{description}</p>
          {loading ? (
            <p className="mt-2 text-xs text-[#756B64]">載入中…</p>
          ) : draft ? (
            <p className="mt-2 text-xs text-[#756B64]">
              目前草稿 v{draft.version_number}
              {draft.updated_at
                ? ` · 更新於 ${new Date(draft.updated_at).toLocaleString("zh-TW")}`
                : ""}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {previewHref ? (
            <Link
              href={previewHref}
              target="_blank"
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                busy && "pointer-events-none opacity-50"
              )}
            >
              <Eye className="mr-1.5 h-4 w-4" />
              預覽草稿
            </Link>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            className={cn(scheduled && "border-[#FFE149] bg-[#FFFBEA] text-[#153E73]")}
            onClick={() => setShowSchedule((v) => !v)}
          >
            <CalendarClock className="mr-1.5 h-4 w-4" />
            {scheduled ? "已排程" : "排程"}
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
            className="bg-[#153E73] text-white hover:bg-[#0f2f58]"
            disabled={busy || publishDisabled}
            title={publishDisabled ? publishDisabledHint : undefined}
            onClick={() => {
              if (publishDisabled) return;
              if (!confirm(publishConfirm)) return;
              void run("publish");
            }}
          >
            <Rocket className="mr-1.5 h-4 w-4" />
            發布上線
          </Button>
        </div>
      </div>

      {scheduled?.scheduled_at ? (
        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-xs",
            scheduleOverdue
              ? "border-amber-300 bg-amber-50 text-amber-950"
              : "border-[#FFE149]/70 bg-[#FFFBEA] text-[#153E73]"
          )}
        >
          <p className="font-semibold">
            {scheduleOverdue ? "排程已到期，等待自動發布" : "已設定排程發布"}
          </p>
          <p className="mt-0.5">
            {new Date(scheduled.scheduled_at).toLocaleString("zh-TW")}
            {scheduleRelative ? `（${scheduleRelative}）` : ""}
            {scheduled.label ? ` · ${scheduled.label}` : ""}
          </p>
          <p className="mt-1 text-[11px] opacity-80">
            排程會鎖定「儲存當下」的草稿快照；之後再改草稿不會自動更新已排程內容。系統約每 5
            分鐘檢查一次。
          </p>
        </div>
      ) : null}

      {publishDisabled && publishDisabledHint ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {publishDisabledHint}
        </p>
      ) : null}

      {message ? (
        <p
          className={cn(
            "rounded-lg px-3 py-2 text-xs",
            message.includes("失敗") || message.includes("必須")
              ? "bg-red-50 text-red-800"
              : "bg-emerald-50 text-emerald-800"
          )}
        >
          {message}
        </p>
      ) : null}

      {showSchedule ? (
        <div className="space-y-2 rounded-lg border border-[#E5E8EE] bg-[#F7F8FA] p-3">
          <p className="text-xs text-[#756B64]">
            選擇時間後，會以<strong className="text-[#153E73]">目前已儲存的草稿</strong>
            建立排程快照。請先儲存草稿再排程。
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1">
              <label className="mb-1 block text-xs font-medium text-[#756B64]">
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
              disabled={busy || !scheduleAt || publishDisabled}
              onClick={() =>
                void run("schedule", {
                  scheduled_at: new Date(scheduleAt).toISOString(),
                })
              }
            >
              {scheduled ? "更新排程" : "儲存排程"}
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
        </div>
      ) : null}

      {showHistory ? (
        <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-[#E5E8EE] p-3">
          {history.length === 0 ? (
            <p className="text-xs text-[#756B64]">尚無發布紀錄</p>
          ) : (
            history.map((v) => (
              <div
                key={v.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-[#E5E8EE] px-3 py-2 text-sm"
              >
                <span className="min-w-0 flex-1 font-medium text-[#153E73]">
                  v{v.version_number} · {v.label || v.status}
                </span>
                <span className="text-xs text-[#756B64]">
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

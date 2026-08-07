"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { todayISO } from "@/lib/admin/store-ops";
import { cn } from "@/lib/utils";

export type WorkTabId = "todos" | "worklogs" | "messages";

type ChecklistItem = {
  id: string;
  label: string;
  href?: string | null;
  is_done?: boolean;
  source?: string | null;
};

type WorkLog = {
  id: string;
  body: string;
  author_name?: string | null;
  created_at?: string;
};

type StoreMessage = {
  id: string;
  body: string;
  author_name?: string | null;
  created_at?: string;
};

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

const TABS: Array<{ id: WorkTabId; label: string }> = [
  { id: "todos", label: "待辦事項" },
  { id: "worklogs", label: "每日工作紀錄" },
  { id: "messages", label: "交班留言" },
];

function formatTime(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 門市工作管理：待辦／工作紀錄／交班留言（不含發票／POS） */
export function StoreTodoCalendar({
  initialTab = "todos",
  initialDate,
}: {
  initialTab?: WorkTabId;
  initialDate?: string;
}) {
  const [day, setDay] = useState(initialDate || todayISO());
  const [tab, setTab] = useState<WorkTabId>(initialTab);
  const [todos, setTodos] = useState<ChecklistItem[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [messages, setMessages] = useState<StoreMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [todoDraft, setTodoDraft] = useState("");
  const [workDraft, setWorkDraft] = useState("");
  const [messageDraft, setMessageDraft] = useState("");

  const isToday = day === todayISO();
  const tomorrow = shiftDate(todayISO(), 1);
  const isTomorrow = day === tomorrow;

  const load = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, wRes, mRes] = await Promise.all([
        fetch(`/api/admin/store/todos?date=${encodeURIComponent(date)}`),
        fetch(`/api/admin/store/work-logs?date=${encodeURIComponent(date)}`),
        fetch(`/api/admin/store/messages?date=${encodeURIComponent(date)}`),
      ]);
      const [tData, wData, mData] = await Promise.all([
        tRes.json(),
        wRes.json(),
        mRes.json(),
      ]);
      if (!tRes.ok) throw new Error(tData.error ?? "待辦載入失敗");
      if (!wRes.ok) throw new Error(wData.error ?? "工作紀錄載入失敗");
      if (!mRes.ok) throw new Error(mData.error ?? "留言載入失敗");
      setTodos(tData.todos ?? []);
      setWorkLogs(wData.logs ?? []);
      setMessages(mData.messages ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
      setTodos([]);
      setWorkLogs([]);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(day);
  }, [day, load]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialDate) setDay(initialDate);
  }, [initialDate]);

  const weekDays = useMemo(() => {
    const start = shiftDate(day, -3);
    return Array.from({ length: 7 }, (_, i) => shiftDate(start, i));
  }, [day]);

  const doneCount = todos.filter((t) => t.is_done).length;

  const toggleTodo = async (item: ChecklistItem) => {
    const nextDone = !item.is_done;
    setTodos((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, is_done: nextDone } : t))
    );
    try {
      const res = await fetch("/api/admin/store/todos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, is_done: nextDone }),
      });
      if (!res.ok) throw new Error("更新失敗");
    } catch {
      setTodos((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, is_done: item.is_done } : t))
      );
    }
  };

  const addTodo = async () => {
    const label = todoDraft.trim();
    if (!label) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/store/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, todo_date: day }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "新增失敗");
      setTodoDraft("");
      setTodos((prev) => [...prev, data.item]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "新增失敗");
    } finally {
      setBusy(false);
    }
  };

  const removeTodo = async (item: ChecklistItem) => {
    if (!window.confirm(`刪除待辦「${item.label}」？`)) return;
    setTodos((prev) => prev.filter((t) => t.id !== item.id));
    try {
      const res = await fetch("/api/admin/store/todos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      if (!res.ok) throw new Error("刪除失敗");
    } catch {
      void load(day);
    }
  };

  const addWorkLog = async () => {
    const text = workDraft.trim();
    if (!text) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/store/work-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text, log_date: day }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "新增失敗");
      setWorkDraft("");
      setWorkLogs((prev) => [data.item, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "新增失敗");
    } finally {
      setBusy(false);
    }
  };

  const removeWorkLog = async (item: WorkLog) => {
    if (!window.confirm("刪除此工作紀錄？")) return;
    setWorkLogs((prev) => prev.filter((t) => t.id !== item.id));
    try {
      const res = await fetch("/api/admin/store/work-logs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      if (!res.ok) throw new Error("刪除失敗");
    } catch {
      void load(day);
    }
  };

  const addMessage = async () => {
    const text = messageDraft.trim();
    if (!text) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/store/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送出失敗");
      setMessageDraft("");
      // Only show if message falls on selected day (usually today)
      if (isToday || day === todayISO()) {
        setMessages((prev) => [...prev, data.item]);
      } else {
        setError("交班留言已送出（歸於今天）。切換到今天可查看。");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "送出失敗");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-[#E7EAF0] p-1.5 hover:bg-[#FFFBEA]"
            onClick={() => setDay((d) => shiftDate(d, -1))}
            aria-label="前一天"
          >
            <ChevronLeft className="h-4 w-4 text-[#153E73]" />
          </button>
          <div className="min-w-0 text-center">
            <p className="text-sm font-bold text-[#153E73]">{formatDayLabel(day)}</p>
            <div className="flex flex-wrap justify-center gap-2 text-[11px]">
              {!isToday ? (
                <button
                  type="button"
                  className="font-semibold text-[#153E73] underline"
                  onClick={() => setDay(todayISO())}
                >
                  今天
                </button>
              ) : (
                <span className="text-muted-foreground">今天</span>
              )}
              {!isTomorrow ? (
                <button
                  type="button"
                  className="font-semibold text-[#153E73] underline"
                  onClick={() => {
                    setDay(tomorrow);
                    setTab("todos");
                  }}
                >
                  明日待辦
                </button>
              ) : (
                <span className="font-semibold text-[#153E73]">明日待辦</span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg border border-[#E7EAF0] p-1.5 hover:bg-[#FFFBEA]"
            onClick={() => setDay((d) => shiftDate(d, 1))}
            aria-label="後一天"
          >
            <ChevronRight className="h-4 w-4 text-[#153E73]" />
          </button>
        </div>
        {tab === "todos" && todos.length > 0 ? (
          <p className="text-xs font-semibold text-[#153E73]/70">
            完成 {doneCount}/{todos.length}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((d) => {
          const dateObj = new Date(d + "T12:00:00");
          const selected = d === day;
          const isTmr = d === tomorrow;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDay(d)}
              className={cn(
                "rounded-lg px-1 py-2 text-center text-[11px] transition",
                selected
                  ? "bg-[#FFE149] font-bold text-[#153E73]"
                  : isTmr
                    ? "bg-[#FFFBEA] font-semibold text-[#153E73] ring-1 ring-[#FFE149]/50"
                    : "bg-[#F7F8FA] text-[#153E73]/80 hover:bg-[#FFFBEA]"
              )}
            >
              <span className="block text-[10px] opacity-70">
                {dateObj.toLocaleDateString("zh-TW", { weekday: "narrow" })}
              </span>
              <span className="text-sm">{dateObj.getDate()}</span>
            </button>
          );
        })}
      </div>

      <input
        type="date"
        className="h-10 w-full rounded-xl border border-[#E7EAF0] px-3 text-sm"
        value={day}
        onChange={(e) => e.target.value && setDay(e.target.value)}
      />

      <div className="flex gap-1 rounded-xl bg-[#F7F8FA] p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-lg px-2 py-2 text-xs font-bold transition sm:text-sm",
              tab === t.id
                ? "bg-[#FFE149] text-[#153E73]"
                : "text-[#153E73]/70 hover:bg-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : tab === "todos" ? (
        <div className="space-y-3">
          {isTomorrow ? (
            <p className="rounded-lg border border-[#FFE149]/50 bg-[#FFFBEA] px-3 py-2 text-xs text-[#153E73]">
              正在編輯明日待辦。交班前可先排好明天要處理的事。
            </p>
          ) : null}
          {todos.length === 0 ? (
            <p className="rounded-[12px] border border-dashed border-[#E8EBF0] bg-[#F7F8FA] px-3 py-4 text-sm text-muted-foreground">
              這天尚無待辦，可在下方新增。
            </p>
          ) : (
            <ul className="space-y-2">
              {todos.map((item) => {
                const done = Boolean(item.is_done);
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 rounded-[12px] border border-[#E8EBF0] px-3 py-2.5"
                  >
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => void toggleTodo(item)}
                      className="h-4 w-4 accent-[#FFE149]"
                    />
                    <span
                      className={cn(
                        "min-w-0 flex-1 text-sm font-medium text-[#153E73]",
                        done && "text-muted-foreground line-through"
                      )}
                    >
                      {item.label}
                    </span>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="text-xs font-semibold text-[#153E73]/60 underline"
                      >
                        前往
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-md p-1 text-red-500 hover:bg-red-50"
                      title="刪除"
                      onClick={() => void removeTodo(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex gap-2">
            <Input
              className="h-10 rounded-xl"
              placeholder={isTomorrow ? "新增明日待辦…" : "新增待辦事項…"}
              value={todoDraft}
              onChange={(e) => setTodoDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addTodo();
                }
              }}
            />
            <Button
              type="button"
              disabled={busy || !todoDraft.trim()}
              className="shrink-0 border-[#FFE149] bg-[#FFE149] text-[#153E73]"
              onClick={() => void addTodo()}
            >
              <Plus className="mr-1 h-4 w-4" />
              新增
            </Button>
          </div>
        </div>
      ) : tab === "worklogs" ? (
        <div className="space-y-3">
          <p className="text-[11px] text-muted-foreground">
            記錄當日實際完成的工作內容，方便交班對照。
          </p>
          {workLogs.length === 0 ? (
            <p className="rounded-[12px] border border-dashed border-[#E8EBF0] bg-[#F7F8FA] px-3 py-4 text-sm text-muted-foreground">
              這天尚無工作紀錄。
            </p>
          ) : (
            <ul className="space-y-2">
              {workLogs.map((item) => (
                <li
                  key={item.id}
                  className="rounded-[12px] border border-[#E8EBF0] px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="whitespace-pre-wrap text-sm text-[#153E73]">{item.body}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {item.author_name || "門市"}
                        {item.created_at ? ` · ${formatTime(item.created_at)}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-md p-1 text-red-500 hover:bg-red-50"
                      onClick={() => void removeWorkLog(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <textarea
            className="min-h-[88px] w-full rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm"
            placeholder="寫下今日工作內容…"
            value={workDraft}
            onChange={(e) => setWorkDraft(e.target.value)}
          />
          <Button
            type="button"
            disabled={busy || !workDraft.trim()}
            className="w-full border-[#FFE149] bg-[#FFE149] text-[#153E73]"
            onClick={() => void addWorkLog()}
          >
            <Plus className="mr-1 h-4 w-4" />
            新增工作紀錄
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[11px] text-muted-foreground">
            給下一班同事的訊息。留言一律記在送出當下（今天），與待辦／工作紀錄分開。
          </p>
          {messages.length === 0 ? (
            <p className="rounded-[12px] border border-dashed border-[#E8EBF0] bg-[#F7F8FA] px-3 py-4 text-sm text-muted-foreground">
              {isToday ? "今天還沒有交班留言。" : "這天沒有交班留言紀錄。"}
            </p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {messages.map((item) => (
                <li
                  key={item.id}
                  className="rounded-[12px] border border-[#E8EBF0] bg-white px-3 py-2.5"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-bold text-[#153E73]">
                      {item.author_name || "門市"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatTime(item.created_at)}
                    </p>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#153E73]/90">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Input
              className="h-10 rounded-xl"
              placeholder="快速交班留言…"
              value={messageDraft}
              onChange={(e) => setMessageDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addMessage();
                }
              }}
            />
            <Button
              type="button"
              disabled={busy || !messageDraft.trim()}
              className="shrink-0 border-[#FFE149] bg-[#FFE149] text-[#153E73]"
              onClick={() => void addMessage()}
            >
              送出
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

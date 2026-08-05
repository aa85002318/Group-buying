"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { todayISO } from "@/lib/admin/store-ops";
import { cn } from "@/lib/utils";

type TabId = "todos" | "worklogs" | "voids";

type ChecklistItem = {
  id: string;
  label: string;
  href?: string | null;
  is_done?: boolean;
};

type WorkLog = {
  id: string;
  body: string;
  author_name?: string | null;
  created_at?: string;
};

type VoidInvoice = {
  id: string;
  invoice_no: string;
  reason: string;
  invoice_medium: "carrier" | "paper";
  carrier_code?: string | null;
  created_by_name?: string | null;
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

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "todos", label: "待辦事項" },
  { id: "worklogs", label: "每日工作紀錄" },
  { id: "voids", label: "作廢發票" },
];

/** 門市行事曆：待辦／工作紀錄／作廢發票 */
export function StoreTodoCalendar({ initialTab = "todos" }: { initialTab?: TabId }) {
  const [day, setDay] = useState(todayISO());
  const [tab, setTab] = useState<TabId>(initialTab);
  const [todos, setTodos] = useState<ChecklistItem[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [voids, setVoids] = useState<VoidInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [todoDraft, setTodoDraft] = useState("");
  const [workDraft, setWorkDraft] = useState("");
  const [voidForm, setVoidForm] = useState({
    invoice_no: "",
    reason: "",
    invoice_medium: "paper" as "carrier" | "paper",
    carrier_code: "",
  });

  const isToday = day === todayISO();

  const load = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, wRes, vRes] = await Promise.all([
        fetch(`/api/admin/store/todos?date=${encodeURIComponent(date)}`),
        fetch(`/api/admin/store/work-logs?date=${encodeURIComponent(date)}`),
        fetch(`/api/admin/store/void-invoices?date=${encodeURIComponent(date)}`),
      ]);
      const [tData, wData, vData] = await Promise.all([tRes.json(), wRes.json(), vRes.json()]);
      if (!tRes.ok) throw new Error(tData.error ?? "待辦載入失敗");
      if (!wRes.ok) throw new Error(wData.error ?? "工作紀錄載入失敗");
      if (!vRes.ok) throw new Error(vData.error ?? "作廢發票載入失敗");
      setTodos(tData.todos ?? []);
      setWorkLogs(wData.logs ?? []);
      setVoids(vData.invoices ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
      setTodos([]);
      setWorkLogs([]);
      setVoids([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(day);
  }, [day, load]);

  const weekDays = useMemo(() => {
    const start = shiftDate(day, -3);
    return Array.from({ length: 7 }, (_, i) => shiftDate(start, i));
  }, [day]);

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

  const addVoid = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/store/void-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...voidForm,
          void_date: day,
          carrier_code:
            voidForm.invoice_medium === "carrier" ? voidForm.carrier_code : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "新增失敗");
      setVoidForm({
        invoice_no: "",
        reason: "",
        invoice_medium: "paper",
        carrier_code: "",
      });
      setVoids((prev) => [data.item, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "新增失敗");
    } finally {
      setBusy(false);
    }
  };

  const removeVoid = async (item: VoidInvoice) => {
    if (!window.confirm(`刪除作廢發票「${item.invoice_no}」？`)) return;
    setVoids((prev) => prev.filter((t) => t.id !== item.id));
    try {
      const res = await fetch("/api/admin/store/void-invoices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      if (!res.ok) throw new Error("刪除失敗");
    } catch {
      void load(day);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
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
          {!isToday ? (
            <button
              type="button"
              className="text-[11px] font-semibold text-[#153E73] underline"
              onClick={() => setDay(todayISO())}
            >
              回到今天
            </button>
          ) : (
            <p className="text-[11px] text-muted-foreground">今天</p>
          )}
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

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((d) => {
          const dateObj = new Date(d + "T12:00:00");
          const selected = d === day;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDay(d)}
              className={cn(
                "rounded-lg px-1 py-2 text-center text-[11px] transition",
                selected
                  ? "bg-[#FFE149] font-bold text-[#153E73]"
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
              placeholder="新增待辦事項…"
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
                        {item.created_at
                          ? ` · ${new Date(item.created_at).toLocaleTimeString("zh-TW", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          : ""}
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
          {voids.length === 0 ? (
            <p className="rounded-[12px] border border-dashed border-[#E8EBF0] bg-[#F7F8FA] px-3 py-4 text-sm text-muted-foreground">
              這天尚無作廢發票。
            </p>
          ) : (
            <ul className="space-y-2">
              {voids.map((item) => (
                <li
                  key={item.id}
                  className="rounded-[12px] border border-[#E8EBF0] px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#153E73]">
                        {item.invoice_no}
                        <span className="ml-2 text-xs font-medium text-[#153E73]/70">
                          {item.invoice_medium === "carrier" ? "載具" : "實體發票"}
                          {item.carrier_code ? ` · ${item.carrier_code}` : ""}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-[#153E73]/90">{item.reason}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {item.created_by_name || "門市"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-md p-1 text-red-500 hover:bg-red-50"
                      onClick={() => void removeVoid(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="space-y-2 rounded-xl border border-[#E9DED4] bg-[#FFFCF7] p-3">
            <Input
              className="h-10 rounded-xl"
              placeholder="發票號碼"
              value={voidForm.invoice_no}
              onChange={(e) => setVoidForm((f) => ({ ...f, invoice_no: e.target.value }))}
            />
            <Input
              className="h-10 rounded-xl"
              placeholder="原因"
              value={voidForm.reason}
              onChange={(e) => setVoidForm((f) => ({ ...f, reason: e.target.value }))}
            />
            <select
              className="h-10 w-full rounded-xl border border-[#E7EAF0] bg-white px-3 text-sm"
              value={voidForm.invoice_medium}
              onChange={(e) =>
                setVoidForm((f) => ({
                  ...f,
                  invoice_medium: e.target.value as "carrier" | "paper",
                }))
              }
            >
              <option value="paper">實體發票</option>
              <option value="carrier">載具</option>
            </select>
            {voidForm.invoice_medium === "carrier" ? (
              <Input
                className="h-10 rounded-xl"
                placeholder="載具號碼"
                value={voidForm.carrier_code}
                onChange={(e) => setVoidForm((f) => ({ ...f, carrier_code: e.target.value }))}
              />
            ) : null}
            <Button
              type="button"
              disabled={
                busy || !voidForm.invoice_no.trim() || !voidForm.reason.trim()
              }
              className="w-full border-[#FFE149] bg-[#FFE149] text-[#153E73]"
              onClick={() => void addVoid()}
            >
              <Plus className="mr-1 h-4 w-4" />
              新增作廢發票
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

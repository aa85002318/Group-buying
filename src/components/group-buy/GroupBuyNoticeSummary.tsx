"use client";

import { useEffect, useId, useState } from "react";
import {
  CalendarClock,
  CreditCard,
  PackageOpen,
  Thermometer,
  X,
} from "lucide-react";

const SUMMARY = [
  { icon: CreditCard, text: "結團前完成付款" },
  { icon: CalendarClock, text: "到貨日期依公告為準" },
  { icon: Thermometer, text: "不同溫層可能分開配送" },
  { icon: PackageOpen, text: "缺貨將聯繫更換或退款" },
] as const;

export function GroupBuyNoticeSummary({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const blocks = content
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <section
      className="rounded-2xl bg-white p-4 shadow-[0_6px_20px_rgba(21,62,115,0.08)] md:p-5"
      aria-label={title}
    >
      <h2 className="text-lg font-black text-[#153E73]">{title || "團購購買須知"}</h2>
      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        {SUMMARY.map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-start gap-2 rounded-2xl bg-[#EEF8FC] p-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#153E73]">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <p className="text-xs font-semibold leading-snug text-[#153E73] md:text-sm">
              {text}
            </p>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex h-11 items-center text-sm font-semibold text-[#153E73] underline-offset-2 hover:underline"
        aria-label="查看完整團購購買須知"
      >
        查看完整團購購買須知
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70]" role="presentation">
          <button
            type="button"
            className="absolute inset-0 border-0 bg-[rgba(21,62,115,0.42)]"
            aria-label="關閉須知"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[24px] bg-white p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[80vh] md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:pb-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 id={titleId} className="text-base font-bold text-[#153E73]">
                {title || "團購購買須知"}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full"
                aria-label="關閉"
              >
                <X className="h-5 w-5 text-[#153E73]" aria-hidden />
              </button>
            </div>
            <div className="space-y-3">
              {blocks.map((block, idx) => {
                const lines = block.split("\n");
                const head = (lines[0] ?? "").replace(/^【|】$/g, "");
                const body = lines.slice(1).join("\n") || lines[0];
                return (
                  <div key={idx} className="rounded-xl border border-[#E9EDF2] p-3">
                    <p className="text-sm font-semibold text-[#153E73]">{head}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-[#687386]">
                      {body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

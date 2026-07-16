"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

const SIZES = [
  { label: "小", value: "2" },
  { label: "中", value: "3" },
  { label: "大", value: "5" },
  { label: "特大", value: "6" },
];

const COLORS = [
  { label: "預設", value: "#333333" },
  { label: "咖啡色", value: "#6B4423" },
  { label: "紅色", value: "#B91C1C" },
  { label: "藍色", value: "#1D4ED8" },
  { label: "綠色", value: "#15803D" },
];

interface AdminRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

/** Lightweight HTML editor (bold / size / color) without extra packages. */
export function AdminRichTextEditor({
  value,
  onChange,
  placeholder = "輸入文章內容…",
}: AdminRichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const emit = () => {
    onChange(ref.current?.innerHTML ?? "");
  };

  const run = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/50 p-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => run("bold")}>
          粗體
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => run("italic")}>
          斜體
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => run("underline")}>
          底線
        </Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <select
          className="rounded border border-border bg-white px-2 py-1 text-xs"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) run("fontSize", e.target.value);
            e.target.value = "";
          }}
        >
          <option value="" disabled>
            文字大小
          </option>
          {SIZES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          className="rounded border border-border bg-white px-2 py-1 text-xs"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) run("foreColor", e.target.value);
            e.target.value = "";
          }}
        >
          <option value="" disabled>
            文字顏色
          </option>
          {COLORS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <Button type="button" size="sm" variant="secondary" onClick={() => run("insertUnorderedList")}>
          項目符號
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => run("removeFormat")}>
          清除格式
        </Button>
      </div>
      <div
        ref={ref}
        className="input-field min-h-[220px] rounded-none border-0 prose prose-sm max-w-none"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
      />
    </div>
  );
}

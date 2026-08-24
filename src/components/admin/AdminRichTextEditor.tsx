"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useBrandFontPreviewCss } from "@/components/admin/AdminBrandFontPicker";
import { BRAND_FONT_OPTIONS, getBrandFont, type BrandFontId } from "@/lib/branding";
import { brandGoogleFontsHref } from "@/lib/branding/fonts";
import { cleanRichTextHtml } from "@/lib/cms/safeHtml";

const SIZES = [
  { label: "小", value: "12px" },
  { label: "中", value: "16px" },
  { label: "大", value: "20px" },
  { label: "特大", value: "28px" },
];

const COLORS = [
  { label: "預設", value: "#333333" },
  { label: "咖啡色", value: "#6B4423" },
  { label: "紅色", value: "#B91C1C" },
  { label: "藍色", value: "#1D4ED8" },
  { label: "綠色", value: "#15803D" },
];

const LINE_HEIGHTS = [
  { label: "緊密", value: "1.2" },
  { label: "標準", value: "1.5" },
  { label: "寬鬆", value: "1.8" },
  { label: "超寬", value: "2.2" },
];

const FONT_OPTIONS = BRAND_FONT_OPTIONS.filter((f) => f.id !== "system");

const EDITOR_CLASS =
  "input-field min-h-[220px] rounded-none border-0 outline-none " +
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 " +
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 " +
  "[&_li]:my-0.5 [&_li]:list-item [&_li]:pl-0 " +
  "[&_h2]:my-2 [&_h2]:text-xl [&_h2]:font-extrabold " +
  "[&_h3]:my-2 [&_h3]:text-lg [&_h3]:font-bold " +
  "[&_a]:text-primary [&_a]:underline " +
  "[&_table]:w-full [&_th]:border [&_td]:border";

interface AdminRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  compact?: boolean;
}

/** Lightweight HTML editor (bold / size / color / font / image) without extra packages. */
export function AdminRichTextEditor({
  value,
  onChange,
  placeholder = "輸入文章內容…",
  compact = false,
}: AdminRichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [htmlMode, setHtmlMode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [openMenu, setOpenMenu] = useState<"font" | "size" | "color" | "line" | null>(null);
  useBrandFontPreviewCss();

  useEffect(() => {
    const editor = ref.current;
    if (htmlMode || !editor) return;
    if (document.activeElement === editor) return;
    if (editor.innerHTML !== (value || "")) {
      editor.innerHTML = value || "";
    }
  }, [htmlMode, value]);

  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [openMenu]);

  const emit = () => {
    onChange(cleanRichTextHtml(ref.current?.innerHTML ?? ""));
  };

  const keepFocus = (e: MouseEvent) => {
    e.preventDefault();
  };

  /** Only store non-collapsed ranges inside the editor; never overwrite with a caret. */
  const saveSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!ref.current?.contains(range.commonAncestorContainer)) return;
    if (range.collapsed) return;
    savedRange.current = range.cloneRange();
  };

  useEffect(() => {
    const onSelectionChange = () => saveSelection();
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  const restoreSelection = () => {
    const editor = ref.current;
    if (!editor) return false;
    editor.focus();
    const sel = window.getSelection();
    if (!sel) return false;
    if (savedRange.current) {
      sel.removeAllRanges();
      try {
        sel.addRange(savedRange.current);
        return true;
      } catch {
        /* range may be stale */
      }
    }
    return sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed;
  };

  const getWorkingRange = (): Range | null => {
    restoreSelection();
    const editor = ref.current;
    const sel = window.getSelection();
    if (!editor || !sel) return null;
    if (sel.rangeCount === 0 || sel.getRangeAt(0).collapsed) {
      if (savedRange.current && !savedRange.current.collapsed) {
        sel.removeAllRanges();
        try {
          sel.addRange(savedRange.current);
        } catch {
          return null;
        }
      } else {
        return null;
      }
    }
    return sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
  };

  /** Wrap each text node in the selection so font/size/color survive across <br>/blocks. */
  const applyInline = (styles: Record<string, string>) => {
    const editor = ref.current;
    const range = getWorkingRange();
    if (!editor || !range || range.collapsed) {
      window.alert("請先反白要套用格式的文字，再選擇字型／大小／顏色。");
      return;
    }

    const textNodes = collectTextNodesInRange(range, editor);
    if (textNodes.length === 0) {
      window.alert("請先反白要套用格式的文字，再選擇字型／大小／顏色。");
      return;
    }

    let firstSpan: HTMLElement | null = null;
    let lastSpan: HTMLElement | null = null;

    for (const { node, start, end } of textNodes) {
      if (start >= end) continue;
      const full = node.textContent ?? "";
      const before = full.slice(0, start);
      const mid = full.slice(start, end);
      const after = full.slice(end);
      if (!mid) continue;

      const span = document.createElement("span");
      // setAttribute avoids Chrome copying inherited Tailwind --tw-* vars into innerHTML.
      span.setAttribute(
        "style",
        Object.entries(styles)
          .map(([key, val]) => `${key}: ${val}`)
          .join("; ")
      );
      span.textContent = mid;

      const parent = node.parentNode;
      if (!parent) continue;
      const frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));
      frag.appendChild(span);
      if (after) frag.appendChild(document.createTextNode(after));
      parent.replaceChild(frag, node);

      if (!firstSpan) firstSpan = span;
      lastSpan = span;
    }

    if (firstSpan && lastSpan) {
      const sel = window.getSelection();
      if (sel) {
        const after = document.createRange();
        after.setStartBefore(firstSpan);
        after.setEndAfter(lastSpan);
        sel.removeAllRanges();
        sel.addRange(after);
        savedRange.current = after.cloneRange();
      }
    }
    setOpenMenu(null);
    emit();
  };

  const run = (command: string, arg?: string) => {
    restoreSelection();
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand(command, false, arg);
    emit();
  };

  const applyHeading = (tag: "p" | "h2" | "h3") => {
    restoreSelection();
    document.execCommand("formatBlock", false, tag);
    if (!ref.current?.querySelector(tag)) {
      document.execCommand("formatBlock", false, `<${tag}>`);
    }
    emit();
  };

  const applyList = () => {
    restoreSelection();
    const editor = ref.current;
    const sel = window.getSelection();
    if (!editor || !sel) return;

    const inList =
      sel.anchorNode instanceof Element
        ? sel.anchorNode.closest("ul,ol")
        : sel.anchorNode?.parentElement?.closest("ul,ol");
    if (inList && editor.contains(inList)) {
      document.execCommand("insertUnorderedList");
      emit();
      return;
    }

    const ok = document.execCommand("insertUnorderedList");
    const hasList = Boolean(editor.querySelector("ul"));
    if (!ok || !hasList) {
      const range = sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
      const raw =
        range && !range.collapsed
          ? range.toString()
          : (editor.innerText || "").trim();
      const lines = raw.split(/\n+/).map((t) => t.trim()).filter(Boolean);
      const items = (lines.length ? lines : [" "])
        .map((t) => `<li>${escapeHtml(t)}</li>`)
        .join("");
      if (range && !range.collapsed) {
        range.deleteContents();
        const wrapper = document.createElement("div");
        wrapper.innerHTML = `<ul>${items}</ul>`;
        range.insertNode(wrapper.firstChild!);
      } else {
        editor.insertAdjacentHTML("beforeend", `<ul>${items}</ul>`);
      }
    }
    emit();
  };

  const applyFont = (id: BrandFontId) => {
    ensureFontStylesheet(id);
    const opt = getBrandFont(id);
    // Quote first family name for reliable CSS; keep fallbacks.
    applyInline({ "font-family": opt.family });
  };

  const applyLineHeight = (value: string) => {
    const editor = ref.current;
    const range = getWorkingRange();
    if (!editor) return;
    if (!range || range.collapsed) {
      window.alert("請先反白要調整行距的文字。");
      return;
    }
    const blocks = collectBlocksInRange(range, editor);
    if (blocks.length === 0) {
      applyInline({ "line-height": value });
      return;
    }
    for (const el of blocks) {
      el.style.lineHeight = value;
    }
    setOpenMenu(null);
    emit();
  };

  const insertLink = () => {
    restoreSelection();
    const url = window.prompt("請輸入連結網址", "https://");
    if (!url) return;
    document.execCommand("createLink", false, url);
    emit();
  };

  const insertTable = () => {
    restoreSelection();
    document.execCommand(
      "insertHTML",
      false,
      [
        "<table style='width:100%;border-collapse:collapse;margin:12px 0;'>",
        "<thead><tr>",
        "<th style='border:1px solid #CBD5E1;padding:8px;background:#F8FAFC;'>欄位 1</th>",
        "<th style='border:1px solid #CBD5E1;padding:8px;background:#F8FAFC;'>欄位 2</th>",
        "</tr></thead>",
        "<tbody><tr>",
        "<td style='border:1px solid #CBD5E1;padding:8px;'>內容</td>",
        "<td style='border:1px solid #CBD5E1;padding:8px;'>內容</td>",
        "</tr></tbody>",
        "</table>",
      ].join("")
    );
    emit();
  };

  const insertImageFile = async (file: File) => {
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "product-images");
      fd.append("folder", "articles/inline");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "上傳失敗");
      restoreSelection();
      document.execCommand(
        "insertHTML",
        false,
        `<p><img src="${data.url}" alt="" style="max-width:100%;height:auto;border-radius:12px;margin:12px 0;" /></p>`
      );
      emit();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "圖片上傳失敗");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const insertImageByUrl = () => {
    restoreSelection();
    const url = window.prompt("請輸入圖片網址", "https://");
    if (!url) return;
    document.execCommand(
      "insertHTML",
      false,
      `<p><img src="${url}" alt="" style="max-width:100%;height:auto;border-radius:12px;margin:12px 0;" /></p>`
    );
    emit();
  };

  const toggleMenu = (menu: typeof openMenu) => (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    saveSelection();
    setOpenMenu((cur) => (cur === menu ? null : menu));
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/50 p-2">
        <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={() => run("bold")}>
          粗體
        </Button>
        <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={() => run("italic")}>
          斜體
        </Button>
        {!compact ? (
          <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={() => run("underline")}>
            底線
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={() => applyHeading("p")}>
          段落
        </Button>
        <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={() => applyHeading("h2")}>
          H2
        </Button>
        <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={() => applyHeading("h3")}>
          H3
        </Button>
        {compact ? (
          <>
            <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={applyList}>
              項目符號
            </Button>
            <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={() => run("insertOrderedList")}>
              編號
            </Button>
            <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={() => run("justifyLeft")}>
              左對齊
            </Button>
            <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={() => run("justifyCenter")}>
              置中
            </Button>
          </>
        ) : null}
        {!compact ? (
          <>
        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarMenu
          label="字型"
          open={openMenu === "font"}
          onToggle={toggleMenu("font")}
        >
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.id}
              type="button"
              className="block w-full px-3 py-2 text-left text-xs hover:bg-[#FFF5C7]"
              style={{ fontFamily: f.family }}
              onMouseDown={keepFocus}
              onClick={(e) => {
                e.stopPropagation();
                applyFont(f.id);
              }}
            >
              {f.label}
            </button>
          ))}
        </ToolbarMenu>

        <ToolbarMenu
          label="文字大小"
          open={openMenu === "size"}
          onToggle={toggleMenu("size")}
        >
          {SIZES.map((s) => (
            <button
              key={s.value}
              type="button"
              className="block w-full px-3 py-2 text-left text-xs hover:bg-[#FFF5C7]"
              style={{ fontSize: s.value }}
              onMouseDown={keepFocus}
              onClick={(e) => {
                e.stopPropagation();
                applyInline({ "font-size": s.value });
              }}
            >
              {s.label}
            </button>
          ))}
        </ToolbarMenu>

        <ToolbarMenu
          label="文字顏色"
          open={openMenu === "color"}
          onToggle={toggleMenu("color")}
        >
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[#FFF5C7]"
              onMouseDown={keepFocus}
              onClick={(e) => {
                e.stopPropagation();
                applyInline({ color: c.value });
              }}
            >
              <span className="inline-block h-3 w-3 rounded-full border border-border" style={{ background: c.value }} />
              {c.label}
            </button>
          ))}
        </ToolbarMenu>

        <ToolbarMenu
          label="行距"
          open={openMenu === "line"}
          onToggle={toggleMenu("line")}
        >
          {LINE_HEIGHTS.map((lh) => (
            <button
              key={lh.value}
              type="button"
              className="block w-full px-3 py-2 text-left text-xs hover:bg-[#FFF5C7]"
              onMouseDown={keepFocus}
              onClick={(e) => {
                e.stopPropagation();
                applyLineHeight(lh.value);
              }}
            >
              {lh.label}（{lh.value}）
            </button>
          ))}
        </ToolbarMenu>
          </>
        ) : null}

        {!compact ? (
        <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={applyList}>
          項目符號
        </Button>
        ) : null}
        {!compact ? (
          <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={insertLink}>
            連結
          </Button>
        ) : (
          <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={insertLink}>
            插入連結
          </Button>
        )}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void insertImageFile(file);
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={uploadingImage}
          onMouseDown={keepFocus}
          onClick={() => imageInputRef.current?.click()}
        >
          {uploadingImage ? "上傳中…" : "插入圖片"}
        </Button>
        <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={insertImageByUrl}>
          圖片網址
        </Button>
        {!compact ? (
          <>
        <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={insertTable}>
          表格
        </Button>
        <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={() => run("removeFormat")}>
          清除格式
        </Button>
        <Button
          type="button"
          size="sm"
          variant={htmlMode ? "default" : "secondary"}
          onClick={() => setHtmlMode((current) => !current)}
        >
          HTML
        </Button>
          </>
        ) : null}
      </div>
      {htmlMode ? (
        <textarea
          className="min-h-[220px] w-full rounded-none border-0 bg-white p-4 font-mono text-sm outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <div
          ref={ref}
          className={compact ? EDITOR_CLASS.replace("min-h-[220px]", "min-h-[280px]") : EDITOR_CLASS}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onInput={emit}
          onBlur={emit}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
        />
      )}
      <p className="border-t border-border bg-muted/30 px-3 py-1.5 text-[11px] text-foreground-muted">
        變更字型／大小／顏色／行距前，請先反白文字再點選。明體、圓體差異最明顯。
      </p>
    </div>
  );
}

function ToolbarMenu({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: (e: MouseEvent) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="rounded border border-border bg-white px-2 py-1 text-xs font-medium text-foreground hover:bg-[#FFFBEA]"
        onMouseDown={onToggle}
      >
        {label} ▾
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-64 min-w-[12rem] overflow-y-auto rounded-md border border-border bg-white py-1 shadow-lg">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const BLOCK_TAGS = new Set(["P", "DIV", "LI", "H1", "H2", "H3", "H4", "TD", "TH"]);

function collectBlocksInRange(range: Range, editor: HTMLElement): HTMLElement[] {
  const found = new Set<HTMLElement>();
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode() as HTMLElement | null;
  while (node) {
    if (BLOCK_TAGS.has(node.tagName) && range.intersectsNode(node)) {
      found.add(node);
    }
    node = walker.nextNode() as HTMLElement | null;
  }
  if (found.size === 0) {
    let n: Node | null = range.commonAncestorContainer;
    if (n.nodeType === Node.TEXT_NODE) n = n.parentElement;
    while (n && n !== editor) {
      if (n instanceof HTMLElement && BLOCK_TAGS.has(n.tagName)) {
        found.add(n);
        break;
      }
      n = n.parentElement;
    }
  }
  return Array.from(found);
}

function collectTextNodesInRange(
  range: Range,
  editor: HTMLElement
): Array<{ node: Text; start: number; end: number }> {
  const out: Array<{ node: Text; start: number; end: number }> = [];
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;
  while (node) {
    if (!range.intersectsNode(node)) {
      node = walker.nextNode() as Text | null;
      continue;
    }
    const len = node.textContent?.length ?? 0;
    let start = 0;
    let end = len;
    if (node === range.startContainer) start = range.startOffset;
    if (node === range.endContainer) end = range.endOffset;
    if (start < end) out.push({ node, start, end });
    node = walker.nextNode() as Text | null;
  }
  return out;
}

function ensureFontStylesheet(id: BrandFontId) {
  const href = brandGoogleFontsHref([id]);
  if (!href) return;
  const linkId = `admin-font-${id}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { AdminBrandFontSelect, useBrandFontPreviewCss } from "@/components/admin/AdminBrandFontPicker";
import { getBrandFont, type BrandFontId } from "@/lib/branding";
import { brandGoogleFontsHref } from "@/lib/branding/fonts";

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
}

/** Lightweight HTML editor (bold / size / color / font / image) without extra packages. */
export function AdminRichTextEditor({
  value,
  onChange,
  placeholder = "輸入文章內容…",
}: AdminRichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [htmlMode, setHtmlMode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  useBrandFontPreviewCss();

  useEffect(() => {
    const editor = ref.current;
    if (htmlMode || !editor) return;
    if (document.activeElement === editor) return;
    if (editor.innerHTML !== (value || "")) {
      editor.innerHTML = value || "";
    }
  }, [htmlMode, value]);

  const emit = () => {
    onChange(ref.current?.innerHTML ?? "");
  };

  const keepFocus = (e: MouseEvent) => {
    e.preventDefault();
  };

  const saveSelectionRef = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (ref.current && ref.current.contains(range.commonAncestorContainer)) {
      savedRange.current = range.cloneRange();
    }
  };

  const saveSelection = () => {
    saveSelectionRef();
  };

  useEffect(() => {
    const onSelectionChange = () => saveSelectionRef();
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  const restoreSelection = () => {
    const editor = ref.current;
    if (!editor) return;
    editor.focus();
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    if (savedRange.current) {
      try {
        sel.addRange(savedRange.current);
      } catch {
        /* range may be stale after HTML rewrite */
      }
    }
  };

  const applyInline = (styles: Record<string, string>) => {
    restoreSelection();
    const editor = ref.current;
    const sel = window.getSelection();
    if (!editor || !sel) return;
    if (sel.rangeCount === 0) {
      const fallback = document.createRange();
      fallback.selectNodeContents(editor);
      sel.addRange(fallback);
    }
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      const node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        range.setStart(node, 0);
        range.setEnd(node, node.textContent.length);
      } else if (editor.childNodes.length) {
        range.selectNodeContents(editor);
      }
    }
    const span = document.createElement("span");
    for (const [key, val] of Object.entries(styles)) {
      span.style.setProperty(key, val);
    }
    try {
      range.surroundContents(span);
    } catch {
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    }
    sel.removeAllRanges();
    const after = document.createRange();
    after.selectNodeContents(span);
    sel.addRange(after);
    savedRange.current = after.cloneRange();
    emit();
  };

  const run = (command: string, arg?: string) => {
    restoreSelection();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, arg);
    emit();
  };

  const applyHeading = (tag: "h2" | "h3") => {
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
    applyInline({ "font-family": opt.family });
  };

  const applyLineHeight = (value: string) => {
    restoreSelection();
    const editor = ref.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const blocks = collectBlocksInRange(range, editor);
    if (blocks.length === 0) {
      applyInline({ "line-height": value });
      return;
    }
    for (const el of blocks) {
      el.style.lineHeight = value;
    }
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

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/50 p-2">
        <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={() => run("bold")}>
          粗體
        </Button>
        <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={() => run("italic")}>
          斜體
        </Button>
        <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={() => run("underline")}>
          底線
        </Button>
        <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={() => applyHeading("h2")}>
          H2
        </Button>
        <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={() => applyHeading("h3")}>
          H3
        </Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <AdminBrandFontSelect
          onChange={applyFont}
          placeholder="字型"
          onMouseDown={saveSelection}
        />
        <select
          className="rounded border border-border bg-white px-2 py-1 text-xs"
          defaultValue=""
          onMouseDown={saveSelection}
          onChange={(e) => {
            if (e.target.value) applyInline({ "font-size": e.target.value });
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
          onMouseDown={saveSelection}
          onChange={(e) => {
            if (e.target.value) applyInline({ color: e.target.value });
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
        <select
          className="rounded border border-border bg-white px-2 py-1 text-xs"
          defaultValue=""
          onMouseDown={saveSelection}
          onChange={(e) => {
            if (e.target.value) applyLineHeight(e.target.value);
            e.target.value = "";
          }}
        >
          <option value="" disabled>
            行距
          </option>
          {LINE_HEIGHTS.map((lh) => (
            <option key={lh.value} value={lh.value}>
              {lh.label}
            </option>
          ))}
        </select>
        <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={applyList}>
          項目符號
        </Button>
        <Button type="button" size="sm" variant="secondary" onMouseDown={keepFocus} onClick={insertLink}>
          連結
        </Button>
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
          className={EDITOR_CLASS}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onInput={emit}
          onBlur={() => {
            saveSelectionRef();
            emit();
          }}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
        />
      )}
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

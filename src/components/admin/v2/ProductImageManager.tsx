"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { GripVertical, ImageIcon, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CONTENT_IMAGE_MAX_BYTES,
  CONTENT_MAX_COUNT,
  GALLERY_IMAGE_MAX_BYTES,
  GALLERY_MAX_COUNT,
  MAIN_IMAGE_MAX_BYTES,
  type ProductImageItem,
  type ProductImageWidthMode,
  isAllowedProductImageType,
} from "@/lib/products/product-images";
import { cn } from "@/lib/utils";

type Props = {
  productId?: string | null;
  main: ProductImageItem | null;
  gallery: ProductImageItem[];
  content: ProductImageItem[];
  onMainChange: (main: ProductImageItem | null) => void;
  onGalleryChange: (gallery: ProductImageItem[]) => void;
  onContentChange: (content: ProductImageItem[]) => void;
  uploadingLock?: boolean;
  onUploadingChange?: (busy: boolean) => void;
};

async function uploadProductImage(
  file: File,
  folder: string
): Promise<{ url: string } | { error: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", "product-images");
  formData.append("folder", folder);
  const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    return { error: data.error || "上傳失敗" };
  }
  return { url: data.url as string };
}

function validateFile(file: File, maxBytes: number): string | null {
  if (!isAllowedProductImageType(file.type)) {
    return "僅支援 JPG、PNG、WebP";
  }
  if (file.size > maxBytes) {
    return `檔案不可超過 ${Math.round(maxBytes / (1024 * 1024))}MB`;
  }
  return null;
}

export function ProductImageManager({
  productId,
  main,
  gallery,
  content,
  onMainChange,
  onGalleryChange,
  onContentChange,
  onUploadingChange,
}: Props) {
  const mainRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragGallery = useRef<number | null>(null);
  const dragContent = useRef<number | null>(null);

  const folderBase = productId
    ? `products/${productId}`
    : `products/draft`;

  const setUploading = (v: boolean) => {
    setBusy(v);
    onUploadingChange?.(v);
  };

  const handleMain = async (file: File) => {
    const err = validateFile(file, MAIN_IMAGE_MAX_BYTES);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const result = await uploadProductImage(file, `${folderBase}/main`);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onMainChange({
        url: result.url,
        alt_text: main?.alt_text ?? "",
        sort_order: 0,
        image_type: "main",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryFiles = async (files: FileList | File[]) => {
    const room = GALLERY_MAX_COUNT - gallery.length;
    const list = Array.from(files).slice(0, room);
    if (list.length === 0) {
      setError(`附圖最多 ${GALLERY_MAX_COUNT} 張`);
      return;
    }
    setError(null);
    setUploading(true);
    const next = [...gallery];
    try {
      for (const file of list) {
        const err = validateFile(file, GALLERY_IMAGE_MAX_BYTES);
        if (err) {
          setError(err);
          continue;
        }
        const result = await uploadProductImage(file, `${folderBase}/gallery`);
        if ("error" in result) {
          setError(result.error);
          continue;
        }
        next.push({
          url: result.url,
          alt_text: "",
          sort_order: next.length,
          image_type: "gallery",
        });
      }
      onGalleryChange(next.map((g, i) => ({ ...g, sort_order: i })));
    } finally {
      setUploading(false);
    }
  };

  const handleContentFiles = async (files: FileList | File[]) => {
    const room = CONTENT_MAX_COUNT - content.length;
    const list = Array.from(files).slice(0, room);
    if (list.length === 0) {
      setError(`內容圖片最多 ${CONTENT_MAX_COUNT} 張`);
      return;
    }
    setError(null);
    setUploading(true);
    const next = [...content];
    try {
      for (const file of list) {
        const err = validateFile(file, CONTENT_IMAGE_MAX_BYTES);
        if (err) {
          setError(err);
          continue;
        }
        const result = await uploadProductImage(file, `${folderBase}/content`);
        if ("error" in result) {
          setError(result.error);
          continue;
        }
        next.push({
          url: result.url,
          alt_text: "",
          caption: "",
          width_mode: "full",
          sort_order: next.length,
          image_type: "content",
        });
      }
      onContentChange(next.map((g, i) => ({ ...g, sort_order: i })));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {error ? (
        <p className="rounded-xl border border-[#F16458]/30 bg-[#F16458]/10 px-3 py-2 text-sm text-[#F16458]">
          {error}
        </p>
      ) : null}
      {busy ? (
        <p className="text-sm font-medium text-[#153E73]">圖片上傳中，請稍候再儲存…</p>
      ) : null}

      {/* A. Main */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-[#153E73]">A. 商品主圖</h3>
          <p className="text-xs text-[#667085]">
            必填 · 建議 1200×1200px · JPG/PNG/WebP · 上限 2MB · 僅一張
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative h-36 w-36 overflow-hidden rounded-2xl border border-[#E8E1D7] bg-[#F7F1E7]">
            {main?.url ? (
              <Image src={main.url} alt={main.alt_text || "主圖"} fill className="object-contain" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-[#8A94A6]">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => mainRef.current?.click()}>
                <Upload className="mr-1 h-4 w-4" />
                {main ? "替換主圖" : "上傳主圖"}
              </Button>
              {main ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm("確定刪除主圖？")) onMainChange(null);
                  }}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  刪除
                </Button>
              ) : null}
            </div>
            {main ? (
              <label className="block text-xs text-[#667085]">
                Alt 替代文字
                <input
                  className="mt-1 w-full min-w-[220px] rounded-xl border border-[#E8E1D7] px-3 py-2 text-sm"
                  value={main.alt_text}
                  onChange={(e) => onMainChange({ ...main, alt_text: e.target.value })}
                  placeholder="描述主圖內容"
                />
              </label>
            ) : null}
          </div>
        </div>
        <input
          ref={mainRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleMain(f);
            e.target.value = "";
          }}
        />
      </section>

      {/* B. Gallery */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#153E73]">B. 商品附圖</h3>
            <p className="text-xs text-[#667085]">
              最多 {GALLERY_MAX_COUNT} 張 · 可拖曳排序 · 建議 1200×1200px · 上限 2MB
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy || gallery.length >= GALLERY_MAX_COUNT}
            onClick={() => galleryRef.current?.click()}
          >
            新增多張
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {gallery.map((item, index) => (
            <div
              key={`${item.url}-${index}`}
              draggable
              onDragStart={() => {
                dragGallery.current = index;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                const from = dragGallery.current;
                if (from === null || from === index) return;
                const next = [...gallery];
                const [moved] = next.splice(from, 1);
                next.splice(index, 0, moved);
                onGalleryChange(next.map((g, i) => ({ ...g, sort_order: i })));
                dragGallery.current = null;
              }}
              className="group relative overflow-hidden rounded-2xl border border-[#E8E1D7] bg-white"
            >
              <div className="relative aspect-square bg-[#F7F1E7]">
                <Image src={item.url} alt={item.alt_text || ""} fill className="object-contain" unoptimized />
                <span className="absolute left-2 bottom-2 rounded bg-black/45 p-1 text-white opacity-0 group-hover:opacity-100">
                  <GripVertical className="h-4 w-4" />
                </span>
              </div>
              <button
                type="button"
                className="absolute right-2 top-2 rounded-full bg-white/95 p-1.5 text-[#F16458] shadow"
                onClick={() => {
                  if (!window.confirm("確定刪除此附圖？")) return;
                  onGalleryChange(gallery.filter((_, i) => i !== index).map((g, i) => ({ ...g, sort_order: i })));
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <input
                className="m-2 w-[calc(100%-1rem)] rounded-lg border border-[#E8E1D7] px-2 py-1 text-[11px]"
                placeholder="Alt"
                value={item.alt_text}
                onChange={(e) => {
                  const next = [...gallery];
                  next[index] = { ...item, alt_text: e.target.value };
                  onGalleryChange(next);
                }}
              />
            </div>
          ))}
        </div>
        <input
          ref={galleryRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void handleGalleryFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </section>

      {/* C. Content */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#153E73]">C. 商品內容圖片</h3>
            <p className="text-xs text-[#667085]">
              顯示於「商品介紹」· 最多 {CONTENT_MAX_COUNT} 張 · 寬 1200px 建議 · 單張上限 3MB
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy || content.length >= CONTENT_MAX_COUNT}
            onClick={() => contentRef.current?.click()}
          >
            新增內容圖片
          </Button>
        </div>
        <div className="space-y-3">
          {content.map((item, index) => (
            <div
              key={`${item.url}-${index}`}
              draggable
              onDragStart={() => {
                dragContent.current = index;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                const from = dragContent.current;
                if (from === null || from === index) return;
                const next = [...content];
                const [moved] = next.splice(from, 1);
                next.splice(index, 0, moved);
                onContentChange(next.map((g, i) => ({ ...g, sort_order: i })));
                dragContent.current = null;
              }}
              className="flex flex-col gap-3 rounded-2xl border border-[#E8E1D7] bg-white p-3 sm:flex-row"
            >
              <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-[#F7F1E7] sm:w-36">
                <Image src={item.url} alt={item.alt_text || ""} fill className="object-contain" unoptimized />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#667085]">
                  <GripVertical className="h-4 w-4" />
                  拖曳排序 · #{index + 1}
                </div>
                <input
                  className="w-full rounded-xl border border-[#E8E1D7] px-3 py-2 text-sm"
                  placeholder="圖片標題／說明（caption）"
                  value={item.caption ?? ""}
                  onChange={(e) => {
                    const next = [...content];
                    next[index] = { ...item, caption: e.target.value };
                    onContentChange(next);
                  }}
                />
                <input
                  className="w-full rounded-xl border border-[#E8E1D7] px-3 py-2 text-sm"
                  placeholder="Alt 替代文字"
                  value={item.alt_text}
                  onChange={(e) => {
                    const next = [...content];
                    next[index] = { ...item, alt_text: e.target.value };
                    onContentChange(next);
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="rounded-xl border border-[#E8E1D7] px-3 py-2 text-sm"
                    value={item.width_mode ?? "full"}
                    onChange={(e) => {
                      const next = [...content];
                      next[index] = {
                        ...item,
                        width_mode: e.target.value as ProductImageWidthMode,
                      };
                      onContentChange(next);
                    }}
                  >
                    <option value="full">滿版</option>
                    <option value="three_quarters">75%</option>
                    <option value="half">50%</option>
                  </select>
                  <button
                    type="button"
                    className={cn(
                      "ml-auto rounded-xl border border-[#F16458]/40 px-3 py-2 text-sm text-[#F16458]"
                    )}
                    onClick={() => {
                      if (!window.confirm("確定刪除此內容圖片？")) return;
                      onContentChange(
                        content.filter((_, i) => i !== index).map((g, i) => ({ ...g, sort_order: i }))
                      );
                    }}
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <input
          ref={contentRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void handleContentFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </section>
    </div>
  );
}

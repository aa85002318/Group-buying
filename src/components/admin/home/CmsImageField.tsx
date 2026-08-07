"use client";

import { useRef, useState } from "react";
import { FolderOpen, ImagePlus, Trash2, Upload } from "lucide-react";
import { MediaLibraryPicker } from "@/components/admin/media/MediaLibraryPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type CmsImageSpec = {
  label: string;
  width: number;
  height: number;
  ratioLabel: string;
  maxKb?: number;
  formats?: string;
};

type Props = {
  value?: string | null;
  onChange: (url: string | null) => void;
  alt?: string;
  onAltChange?: (alt: string) => void;
  spec: CmsImageSpec;
  uploadFolder?: string;
  bucket?: string;
  className?: string;
  deviceLabel?: "桌面版" | "手機版" | string;
  enforceMaxKb?: boolean;
  /** Show “從素材庫選擇” (default true) */
  allowLibrary?: boolean;
};

/**
 * Shared CMS image field — always shows size / ratio / format hints.
 */
export function CmsImageField({
  value,
  onChange,
  alt,
  onAltChange,
  spec,
  uploadFolder = "cms/home",
  bucket = "product-images",
  className,
  deviceLabel,
  enforceMaxKb = false,
  allowLibrary = true,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const maxKb = spec.maxKb ?? 500;
  const formats = spec.formats ?? "JPG、PNG、WebP";

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setWarn(null);
    try {
      if (file.size > maxKb * 1024) {
        if (enforceMaxKb) {
          setError(`圖片不可超過 ${maxKb}KB`);
          return;
        }
        setWarn(`檔案約 ${Math.round(file.size / 1024)}KB，建議 ${maxKb}KB 以下`);
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);
      formData.append("folder", uploadFolder);
      formData.append("register_library", "1");
      if (alt) formData.append("alt_text", alt);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "上傳失敗");
        return;
      }
      onChange(data.url ?? null);
      const img = new window.Image();
      img.onload = () => {
        if (img.naturalWidth < spec.width * 0.7 || img.naturalHeight < spec.height * 0.7) {
          setWarn(
            `目前尺寸 ${img.naturalWidth}×${img.naturalHeight}，建議 ${spec.width}×${spec.height}`
          );
        }
      };
      img.src = data.url;
    } catch {
      setError("上傳失敗");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("space-y-2 rounded-xl border border-border bg-white p-3", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          {deviceLabel ? (
            <p className="text-xs font-bold text-[#153E73]">{deviceLabel}</p>
          ) : null}
          <p className="text-sm font-semibold text-coffee">{spec.label}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            建議尺寸 {spec.width}×{spec.height} px（{spec.ratioLabel}）· {formats} · {maxKb}KB 以下
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {allowLibrary ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => setLibraryOpen(true)}
            >
              <FolderOpen className="mr-1 h-3.5 w-3.5" />
              素材庫
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mr-1 h-3.5 w-3.5" />
            {value ? "更換" : "上傳"}
          </Button>
          {value ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                onChange(null);
                setWarn(null);
              }}
            >
              <Trash2 className="h-3.5 w-3.5 text-danger" />
            </Button>
          ) : null}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadFile(f);
          e.target.value = "";
        }}
      />

      <div
        className="relative flex min-h-[120px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-[#FFFEFA]"
        style={{ aspectRatio: `${spec.width} / ${spec.height}`, maxHeight: 200 }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={alt || ""} className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
            <ImagePlus className="h-6 w-6 opacity-50" />
            <span>尚未上傳</span>
          </div>
        )}
      </div>

      {onAltChange ? (
        <div>
          <label className="mb-1 block text-[11px] text-muted-foreground">Alt 替代文字</label>
          <Input
            value={alt ?? ""}
            onChange={(e) => onAltChange(e.target.value)}
            placeholder="描述圖片內容"
          />
        </div>
      ) : null}

      {warn ? <p className="text-[11px] text-amber-700">{warn}</p> : null}
      {error ? <p className="text-[11px] text-danger">{error}</p> : null}
      {uploading ? <p className="text-[11px] text-muted-foreground">上傳中…</p> : null}

      {allowLibrary ? (
        <MediaLibraryPicker
          open={libraryOpen}
          onClose={() => setLibraryOpen(false)}
          folder={uploadFolder}
          onSelect={(asset) => {
            onChange(asset.file_url);
            if (onAltChange && asset.alt_text) onAltChange(asset.alt_text);
            setWarn(null);
            setError(null);
          }}
        />
      ) : null}
    </div>
  );
}

export const CMS_IMAGE_SPECS = {
  heroDesktop: {
    label: "Hero 桌面版",
    width: 1500,
    height: 600,
    ratioLabel: "5:2",
    maxKb: 500,
  },
  heroMobile: {
    label: "Hero 手機版",
    width: 1080,
    height: 900,
    ratioLabel: "6:5",
    maxKb: 500,
  },
  campaignWide: {
    label: "活動橫圖",
    width: 1200,
    height: 600,
    ratioLabel: "2:1",
    maxKb: 400,
  },
  campaignSquare: {
    label: "活動方圖",
    width: 1080,
    height: 1080,
    ratioLabel: "1:1",
    maxKb: 400,
  },
  serviceIcon: {
    label: "服務 Icon",
    width: 400,
    height: 400,
    ratioLabel: "1:1",
    maxKb: 200,
    formats: "PNG、WebP（去背）",
  },
  memberVisual: {
    label: "會員中心主圖",
    width: 800,
    height: 800,
    ratioLabel: "1:1",
    maxKb: 300,
    formats: "PNG、WebP（去背）",
  },
  groupBuyDesktop: {
    label: "團購 Banner 桌面版",
    width: 1500,
    height: 600,
    ratioLabel: "5:2",
    maxKb: 500,
  },
  groupBuyMobile: {
    label: "團購 Banner 手機版",
    width: 1080,
    height: 900,
    ratioLabel: "6:5",
    maxKb: 500,
  },
  shortcut: {
    label: "快捷入口圖",
    width: 400,
    height: 400,
    ratioLabel: "1:1",
    maxKb: 200,
    formats: "PNG、WebP（去背）",
  },
} as const satisfies Record<string, CmsImageSpec>;

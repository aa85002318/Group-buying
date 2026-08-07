"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AspectPreset = "target" | "1:1" | "4:3" | "16:9" | "free";

type GiftImageCropUploadProps = {
  value: string | null;
  onChange: (url: string | null) => void;
  label: string;
  /** Default / target output width in px */
  outWidth: number;
  /** Default / target output height in px */
  outHeight: number;
  uploadFolder: string;
  maxFileBytes?: number;
  className?: string;
};

const DEFAULT_MAX = 2 * 1024 * 1024;

function aspectValue(preset: AspectPreset, target: number, free: number): number {
  if (preset === "target") return target;
  if (preset === "1:1") return 1;
  if (preset === "4:3") return 4 / 3;
  if (preset === "16:9") return 16 / 9;
  return Math.max(0.5, Math.min(2.5, free));
}

/**
 * Crop → canvas export → /api/admin/upload.
 * Supports pan, zoom, 90° rotate, aspect presets.
 */
export function GiftImageCropUpload({
  value,
  onChange,
  label,
  outWidth,
  outHeight,
  uploadFolder,
  maxFileBytes = DEFAULT_MAX,
  className,
}: GiftImageCropUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectPreset, setAspectPreset] = useState<AspectPreset>("target");
  const [freeAspect, setFreeAspect] = useState(outWidth / outHeight);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [drag, setDrag] = useState<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");

  const targetAspect = outWidth / outHeight;
  const aspect = useMemo(
    () => aspectValue(aspectPreset, targetAspect, freeAspect),
    [aspectPreset, targetAspect, freeAspect]
  );

  const outputSize = useMemo(() => {
    if (aspectPreset === "target") return { w: outWidth, h: outHeight };
    // Keep long edge roughly matching the larger of outWidth/outHeight
    const long = Math.max(outWidth, outHeight);
    if (aspect >= 1) return { w: long, h: Math.round(long / aspect) };
    return { w: Math.round(long * aspect), h: long };
  }, [aspectPreset, aspect, outWidth, outHeight]);

  useEffect(() => {
    if (!src) {
      setImg(null);
      return;
    }
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setZoom(1);
      setRotation(0);
      setOffsetX(0);
      setOffsetY(0);
      setAspectPreset("target");
      setFreeAspect(outWidth / outHeight);
    };
    image.onerror = () => setError("無法載入圖片");
    image.src = src;
  }, [src, outWidth, outHeight]);

  const pickFile = async (file: File | null) => {
    setError(null);
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("僅支援 JPG、PNG、WebP");
      return;
    }
    if (file.size > maxFileBytes) {
      setError(`單張上限 ${Math.round(maxFileBytes / (1024 * 1024))}MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSrc(String(reader.result));
      setOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const rotatedNatural = (image: HTMLImageElement, rot: number) => {
    const swap = rot % 180 !== 0;
    return {
      w: swap ? image.naturalHeight : image.naturalWidth,
      h: swap ? image.naturalWidth : image.naturalHeight,
    };
  };

  const coverScale = (image: HTMLImageElement, rot: number, frameAspect: number) => {
    const frameW = 320;
    const frameH = frameW / frameAspect;
    const nat = rotatedNatural(image, rot);
    return Math.max(frameW / nat.w, frameH / nat.h);
  };

  const exportAndUpload = async () => {
    if (!img) return;
    setBusy(true);
    setError(null);
    try {
      const { w: outW, h: outH } = outputSize;
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("無法建立畫布");

      const frameW = 320;
      const frameH = frameW / aspect;
      const base = coverScale(img, rotation, aspect) * zoom;
      const nat = rotatedNatural(img, rotation);

      ctx.fillStyle = "#FFFDF6";
      ctx.fillRect(0, 0, outW, outH);

      const temp = document.createElement("canvas");
      temp.width = nat.w;
      temp.height = nat.h;
      const tctx = temp.getContext("2d");
      if (!tctx) throw new Error("無法建立暫存畫布");
      tctx.translate(nat.w / 2, nat.h / 2);
      tctx.rotate((rotation * Math.PI) / 180);
      tctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      const srcX = nat.w / 2 - (frameW / 2 + offsetX) / base;
      const srcY = nat.h / 2 - (frameH / 2 + offsetY) / base;
      const srcW = frameW / base;
      const srcH = frameH / base;

      ctx.drawImage(temp, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );
      if (!blob) throw new Error("裁切失敗");
      if (blob.size > maxFileBytes) {
        throw new Error("裁切後仍超過大小上限，請縮小圖片");
      }

      const form = new FormData();
      form.append(
        "file",
        new File([blob], `gift-${outW}x${outH}.jpg`, { type: "image/jpeg" })
      );
      form.append("bucket", "product-images");
      form.append("folder", uploadFolder);

      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "上傳失敗");
      onChange(data.url);
      setOpen(false);
      setSrc(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上傳失敗");
    } finally {
      setBusy(false);
    }
  };

  const frameW = 320;
  const frameH = frameW / aspect;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-semibold text-[#153E73]">{label}</p>
      <p className="text-[11px] text-[#8A94A6]">
        建議輸出 {outWidth}×{outHeight}px · JPG／PNG／WebP · ≤
        {Math.round(maxFileBytes / (1024 * 1024))}MB · 支援旋轉與比例
      </p>

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-[#E7EAF0] bg-[#F3F4F6]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="mx-auto max-h-40 w-full object-contain" />
          <div className="flex gap-2 p-2">
            <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              重新裁切上傳
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => onChange(null)}>
              清除
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-28 w-full items-center justify-center rounded-xl border border-dashed border-[#C9D0DC] bg-[#FFFDF6] text-xs font-semibold text-[#687386] hover:border-[#153E73]"
        >
          選擇圖片並裁切
        </button>
      )}

      <div className="flex gap-2">
        <Input
          className="text-xs"
          placeholder="或貼上圖片網址"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            if (urlInput.trim()) {
              onChange(urlInput.trim());
              setUrlInput("");
            }
          }}
        >
          套用
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          void pickFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      {error && !open ? <p className="text-xs text-red-600">{error}</p> : null}

      {open && src && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-2xl bg-white p-4 shadow-xl">
            <h3 className="text-sm font-bold text-[#153E73]">裁切預覽</h3>
            <p className="text-[11px] text-[#8A94A6]">
              拖曳調整位置 · 輸出約 {outputSize.w}×{outputSize.h}
            </p>

            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["target", "建議比例"],
                  ["1:1", "1:1"],
                  ["4:3", "4:3"],
                  ["16:9", "16:9"],
                  ["free", "自由"],
                ] as Array<[AspectPreset, string]>
              ).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setAspectPreset(k)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-bold",
                    aspectPreset === k
                      ? "bg-[#FEE169] text-[#153E73]"
                      : "bg-[#F3F4F6] text-[#687386]"
                  )}
                >
                  {l}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-bold text-[#687386]"
              >
                旋轉 90°
              </button>
            </div>

            {aspectPreset === "free" ? (
              <label className="block text-xs text-[#687386]">
                自由比例 {freeAspect.toFixed(2)}
                <input
                  type="range"
                  min={0.5}
                  max={2.5}
                  step={0.01}
                  value={freeAspect}
                  onChange={(e) => setFreeAspect(Number(e.target.value))}
                  className="mt-1 w-full"
                />
              </label>
            ) : null}

            <div
              className="relative mx-auto overflow-hidden rounded-xl bg-[#1a1a1a]"
              style={{ width: frameW, height: frameH, touchAction: "none" }}
              onPointerDown={(e) => {
                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                setDrag({ x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY });
              }}
              onPointerMove={(e) => {
                if (!drag) return;
                setOffsetX(drag.ox + (e.clientX - drag.x));
                setOffsetY(drag.oy + (e.clientY - drag.y));
              }}
              onPointerUp={() => setDrag(null)}
              onPointerCancel={() => setDrag(null)}
            >
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    width: img.naturalWidth * coverScale(img, rotation, aspect) * zoom,
                    height: img.naturalHeight * coverScale(img, rotation, aspect) * zoom,
                    transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) rotate(${rotation}deg)`,
                  }}
                />
              ) : null}
              <div className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-[#FEE169]" />
            </div>

            <label className="block text-xs text-[#687386]">
              縮放 {zoom.toFixed(2)}×
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="mt-1 w-full"
              />
            </label>

            {error ? <p className="text-xs text-red-600">{error}</p> : null}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setOpen(false);
                  setSrc(null);
                  setError(null);
                }}
              >
                取消
              </Button>
              <Button type="button" disabled={busy || !img} onClick={() => void exportAndUpload()}>
                {busy ? "上傳中…" : "裁切並上傳"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

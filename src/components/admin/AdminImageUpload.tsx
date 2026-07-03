"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImagePlus, Link2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AdminImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  multiple?: boolean;
  maxImages?: number;
  aspectRatio?: "square" | "video";
  label?: string;
  hint?: string;
  uploadFolder?: string;
  bucket?: string;
}

export function AdminImageUpload({
  images,
  onChange,
  multiple = true,
  maxImages = 10,
  aspectRatio = "square",
  label = "商品圖片",
  hint,
  uploadFolder = "products",
  bucket = "product-images",
}: AdminImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAddMore = multiple ? images.length < maxImages : images.length === 0;

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);
      formData.append("folder", uploadFolder);

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        if (data.fallback) {
          setError("未連接 Supabase，請使用下方網址輸入");
        } else {
          setError(data.error ?? "上傳失敗");
        }
        return;
      }

      if (multiple) {
        onChange([...images, data.url]);
      } else {
        onChange([data.url]);
      }
    } catch {
      setError("上傳失敗，請改用圖片網址");
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || !canAddMore) return;
    const list = multiple ? Array.from(files) : [files[0]];
    const remaining = maxImages - images.length;
    for (const file of list.slice(0, remaining)) {
      await uploadFile(file);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const addUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (multiple) {
      onChange([...images, url]);
    } else {
      onChange([url]);
    }
    setUrlInput("");
    setError(null);
  };

  const removeAt = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= images.length) return;
    const copy = [...images];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    onChange(copy);
  };

  const aspectClass = aspectRatio === "video" ? "aspect-video" : "aspect-square";

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-coffee">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>

      {images.length > 0 && (
        <div className={cn("grid gap-2", multiple ? "grid-cols-2 sm:grid-cols-3" : "max-w-md")}>
          {images.map((url, i) => (
            <div key={`${url}-${i}`} className="group relative overflow-hidden rounded-lg border border-border bg-muted">
              <div className={cn("relative w-full", aspectClass)}>
                <Image src={url} alt={`圖片 ${i + 1}`} fill className="object-cover" unoptimized />
                {i === 0 && multiple && (
                  <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-white">
                    主圖
                  </span>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-coffee/70 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                {multiple && (
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-30"
                      aria-label="往前移"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === images.length - 1}
                      className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-30"
                      aria-label="往後移"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="ml-auto rounded p-1 text-white hover:bg-red-500/80"
                  aria-label="刪除圖片"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple={multiple}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              "上傳中…"
            ) : (
              <>
                <Upload className="mr-1.5 h-4 w-4" />
                {multiple ? "上傳圖片" : "上傳橫幅"}
              </>
            )}
          </Button>
        </div>
      )}

      {canAddMore && (
        <div className="flex gap-2">
          <Input
            placeholder="或貼上圖片網址（Mock / 外部圖床）"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
          />
          <Button type="button" variant="secondary" size="sm" onClick={addUrl}>
            <Link2 className="mr-1 h-4 w-4" />
            加入
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-primary">{error}</p>}

      {multiple && images.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          <ImagePlus className="h-5 w-5 shrink-0" />
          <span>第一張圖片將作為商品主圖</span>
        </div>
      )}
    </div>
  );
}

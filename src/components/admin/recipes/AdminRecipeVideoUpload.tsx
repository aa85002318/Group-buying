"use client";

import { useRef, useState } from "react";
import { Film, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RECIPE_VIDEO_ACCEPT,
  recipeVideoDirectUploadMaxMb,
  recipeVideoMaxMb,
  shouldUseSignedUpload,
  validateRecipeVideoFile,
  type RecipeVideoMediaScope,
} from "@/lib/recipes/video-upload";
import type { RecipeMedia } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type UploadStatus =
  | "idle"
  | "validating"
  | "waiting"
  | "authorizing"
  | "uploading"
  | "confirming"
  | "processing"
  | "done"
  | "failed";

type AdminRecipeVideoUploadProps = {
  recipeId: string;
  mediaScope: RecipeVideoMediaScope;
  stepId?: string | null;
  chapterId?: string | null;
  storyPageId?: string | null;
  replaceMediaId?: string | null;
  target?: "recipe_media" | "story_page_media";
  sortOrder?: number;
  label?: string;
  hint?: string;
  existing?: Pick<
    RecipeMedia,
    | "id"
    | "url"
    | "thumbnail_url"
    | "original_filename"
    | "file_size_bytes"
    | "duration_seconds"
    | "storage_path"
    | "mime_type"
    | "is_active"
    | "processing_status"
  > | null;
  onUploaded?: (media: RecipeMedia) => void;
  onClear?: () => void;
  className?: string;
};

function formatBytes(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_LABEL: Record<UploadStatus, string> = {
  idle: "等待上傳",
  validating: "驗證中",
  waiting: "等待上傳",
  authorizing: "取得上傳權限",
  uploading: "上傳中",
  confirming: "確認檔案",
  processing: "處理中",
  done: "完成",
  failed: "失敗",
};

export function AdminRecipeVideoUpload({
  recipeId,
  mediaScope,
  stepId = null,
  chapterId = null,
  storyPageId = null,
  replaceMediaId = null,
  target = "recipe_media",
  sortOrder = 0,
  label = "上傳教學影片",
  hint,
  existing = null,
  onUploaded,
  onClear,
  className,
}: AdminRecipeVideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const uploadingLock = useRef(false);
  const [status, setStatus] = useState<UploadStatus>(existing?.url ? "done" : "idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hintMsg, setHintMsg] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);
  const [pendingSize, setPendingSize] = useState<number | null>(null);
  const [pendingMode, setPendingMode] = useState<"direct" | "signed" | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existing?.url ?? null);
  const [posterUrl, setPosterUrl] = useState(existing?.thumbnail_url ?? "");
  const maxMb = recipeVideoMaxMb(mediaScope);
  const directMb = recipeVideoDirectUploadMaxMb();

  const cancelUpload = () => {
    xhrRef.current?.abort();
    xhrRef.current = null;
    uploadingLock.current = false;
    setStatus("failed");
    setError("已取消上傳");
  };

  const uploadFile = async (file: File) => {
    if (uploadingLock.current) return;
    uploadingLock.current = true;
    setError(null);
    setHintMsg(null);
    setStatus("validating");
    setPendingName(file.name);
    setPendingSize(file.size);

    const validated = validateRecipeVideoFile({
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      scope: mediaScope,
    });
    if (!validated.ok) {
      setStatus("failed");
      setError(validated.error);
      uploadingLock.current = false;
      return;
    }
    if (validated.movHint) setHintMsg(validated.movHint);

    const useSigned = shouldUseSignedUpload(file.size);
    setPendingMode(useSigned ? "signed" : "direct");

    try {
      if (!useSigned) {
        setStatus("uploading");
        setProgress(10);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("purpose", "recipe_video");
        formData.append("recipeId", recipeId);
        formData.append("mediaScope", mediaScope);
        if (stepId) formData.append("stepId", stepId);
        if (chapterId) formData.append("chapterId", chapterId);
        if (storyPageId) formData.append("storyPageId", storyPageId);
        if (replaceMediaId) formData.append("replaceMediaId", replaceMediaId);
        if (posterUrl.trim()) formData.append("thumbnailUrl", posterUrl.trim());
        formData.append("altText", file.name);
        formData.append("target", target);

        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "上傳失敗");
        setProgress(100);
        setStatus("done");
        setPreviewUrl(data.media?.url ?? data.url ?? null);
        onUploaded?.(data.media);
        return;
      }

      setStatus("authorizing");
      const initRes = await fetch(`/api/admin/recipes/${recipeId}/media/signed-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          fileSize: file.size,
          mediaScope,
          stepId,
          chapterId,
          storyPageId,
          replaceMediaId,
        }),
      });
      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.error ?? "無法取得上傳權限");
      if (initData.movHint) setHintMsg(initData.movHint);

      setStatus("uploading");
      setProgress(0);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open("PUT", initData.signedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Storage 上傳失敗（${xhr.status}）`));
        };
        xhr.onerror = () => reject(new Error("網路錯誤，上傳失敗"));
        xhr.onabort = () => reject(new Error("已取消上傳"));
        xhr.send(file);
      });

      setStatus("confirming");
      const finRes = await fetch(`/api/admin/recipes/${recipeId}/media/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: initData.mediaId,
          path: initData.path,
          bucket: initData.bucket,
          mimeType: initData.mimeType,
          fileSize: file.size,
          originalFilename: initData.originalFilename,
          mediaScope,
          stepId,
          storyPageId,
          thumbnailUrl: posterUrl.trim() || null,
          altText: file.name,
          target,
          sortOrder,
          activate: true,
        }),
      });
      const finData = await finRes.json();
      if (!finRes.ok) throw new Error(finData.error ?? "確認檔案失敗");

      setStatus("done");
      setProgress(100);
      setPreviewUrl(finData.media?.url ?? initData.publicUrl);
      onUploaded?.(finData.media);
    } catch (e) {
      setStatus("failed");
      setError(e instanceof Error ? e.message : "上傳失敗");
    } finally {
      xhrRef.current = null;
      uploadingLock.current = false;
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const busy =
    status === "uploading" ||
    status === "authorizing" ||
    status === "confirming" ||
    status === "processing" ||
    status === "validating";

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-3",
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) void uploadFile(file);
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-coffee">{label}</p>
          <p className="text-xs text-muted-foreground">
            {hint ??
              `拖曳影片到這裡，或選擇檔案。支援 MP4、WebM、MOV。≤${directMb}MB 直傳；更大走 signed upload（上限 ${maxMb} MB）。不可使用 YouTube。`}
          </p>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {STATUS_LABEL[status]}
          {status === "uploading" ? ` ${progress}%` : ""}
          {pendingMode ? ` · ${pendingMode === "signed" ? "大檔" : "小檔"}` : ""}
        </span>
      </div>

      {(previewUrl || existing?.url) && status !== "uploading" ? (
        <div className="overflow-hidden rounded-md bg-black">
          <video
            key={previewUrl || existing?.url || "v"}
            src={(previewUrl || existing?.url) ?? undefined}
            poster={posterUrl || existing?.thumbnail_url || undefined}
            controls
            playsInline
            preload="metadata"
            muted
            className="aspect-video w-full"
          />
        </div>
      ) : (
        <button
          type="button"
          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-white text-sm text-muted-foreground"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <Film className="h-8 w-8 opacity-40" />
          <span>選擇影片 / 拖曳影片到這裡</span>
          <span className="text-xs">支援 MP4、WebM、MOV</span>
        </button>
      )}

      {(pendingName || existing?.original_filename) && (
        <p className="text-xs text-muted-foreground">
          {pendingName || existing?.original_filename}
          {" · "}
          {formatBytes(pendingSize ?? existing?.file_size_bytes)}
          {existing?.mime_type ? ` · ${existing.mime_type}` : null}
          {existing?.storage_path ? (
            <>
              <br />
              <span className="font-mono text-[10px]">{existing.storage_path}</span>
            </>
          ) : null}
        </p>
      )}

      {status === "uploading" ? (
        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <Button type="button" size="sm" variant="outline" onClick={cancelUpload}>
            <X className="mr-1 h-4 w-4" />
            取消上傳
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={RECIPE_VIDEO_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadFile(file);
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                {STATUS_LABEL[status]}…
              </>
            ) : (
              <>
                <Upload className="mr-1.5 h-4 w-4" />
                {existing?.url || previewUrl ? "更換影片" : "選擇影片"}
              </>
            )}
          </Button>
          {(existing?.url || previewUrl) && onClear ? (
            <Button type="button" size="sm" variant="outline" onClick={onClear}>
              清除預覽
            </Button>
          ) : null}
        </div>
      )}

      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">封面圖 URL（可選）</p>
        <Input
          placeholder="poster 圖片網址"
          value={posterUrl}
          onChange={(e) => setPosterUrl(e.target.value)}
        />
      </div>

      {hintMsg ? <p className="text-xs text-amber-700">{hintMsg}</p> : null}
      {error ? <p className="text-xs text-primary">{error}</p> : null}
      {status === "failed" ? (
        <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
          重試上傳
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Shared recipe video upload rules (admin + API).
 * Prefer uploaded files in recipe-media bucket — never YouTube/Vimeo embeds.
 */

export const RECIPE_VIDEO_BUCKET = "recipe-media";

export type RecipeVideoMediaScope =
  | "recipe_full"
  | "chapter"
  | "step"
  | "story_page";

export type RecipeWritableSourceType = "upload" | "storage" | "cdn";

const ALLOWED_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const EXT_BY_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

const ALLOWED_EXT = new Set(["mp4", "webm", "mov"]);

function envInt(name: string, fallback: number): number {
  const raw =
    typeof process !== "undefined" ? process.env[name] : undefined;
  const n = raw != null && raw !== "" ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Files at or below this size may go through POST /api/admin/upload (server proxy). */
export function recipeVideoDirectUploadMaxMb(): number {
  return envInt(
    "NEXT_PUBLIC_RECIPE_VIDEO_DIRECT_UPLOAD_MAX_MB",
    envInt("RECIPE_VIDEO_DIRECT_UPLOAD_MAX_MB", 20)
  );
}

export function recipeVideoDirectUploadMaxBytes(): number {
  return recipeVideoDirectUploadMaxMb() * 1024 * 1024;
}

/** Max size in MB by scope — server + client share NEXT_PUBLIC_* where needed. */
export function recipeVideoMaxMb(scope: RecipeVideoMediaScope): number {
  switch (scope) {
    case "recipe_full":
      return envInt(
        "NEXT_PUBLIC_RECIPE_VIDEO_MAX_SIZE_MB",
        envInt("RECIPE_VIDEO_MAX_SIZE_MB", 500)
      );
    case "step":
      return envInt(
        "NEXT_PUBLIC_RECIPE_STEP_VIDEO_MAX_SIZE_MB",
        envInt("RECIPE_STEP_VIDEO_MAX_SIZE_MB", 100)
      );
    case "chapter":
    case "story_page":
      return envInt(
        "NEXT_PUBLIC_RECIPE_STEP_VIDEO_MAX_SIZE_MB",
        envInt(
          "RECIPE_STEP_VIDEO_MAX_SIZE_MB",
          envInt("RECIPE_VIDEO_MAX_SIZE_MB_STORY", 100)
        )
      );
    default:
      return 100;
  }
}

export function recipeVideoMaxBytes(scope: RecipeVideoMediaScope): number {
  return recipeVideoMaxMb(scope) * 1024 * 1024;
}

export function shouldUseSignedUpload(fileSize: number): boolean {
  return fileSize > recipeVideoDirectUploadMaxBytes();
}

export function isAllowedVideoMime(mime: string): boolean {
  return ALLOWED_MIME.has((mime || "").toLowerCase());
}

export function extensionForMime(mime: string): string | null {
  return EXT_BY_MIME[mime.toLowerCase()] ?? null;
}

export function sanitizeOriginalFilename(name: string): string {
  return name.replace(/[^\w.\u4e00-\u9fff()-]+/g, "_").slice(0, 180);
}

export function fileExtension(filename: string): string {
  const parts = filename.split(".");
  return (parts.length > 1 ? parts.pop() : "")?.toLowerCase() ?? "";
}

export type VideoValidationOk = {
  ok: true;
  mime: string;
  ext: string;
  safeOriginal: string;
  movHint: string | null;
};

export type VideoValidationErr = {
  ok: false;
  error: string;
};

/** Validate MIME + extension + size before upload. */
export function validateRecipeVideoFile(input: {
  fileName: string;
  mimeType: string;
  fileSize: number;
  scope: RecipeVideoMediaScope;
}): VideoValidationOk | VideoValidationErr {
  const mime = (input.mimeType || "").toLowerCase();
  const ext = fileExtension(input.fileName);
  if (!isAllowedVideoMime(mime) || !ALLOWED_EXT.has(ext)) {
    return {
      ok: false,
      error: "僅支援 MP4、WebM、MOV 影片檔案",
    };
  }
  const expected = extensionForMime(mime);
  if (mime === "video/webm" && ext !== "webm") {
    return { ok: false, error: "檔案副檔名與格式不符" };
  }
  if (mime === "video/mp4" && ext !== "mp4") {
    return { ok: false, error: "檔案副檔名與格式不符" };
  }
  if (mime === "video/quicktime" && ext !== "mov") {
    return { ok: false, error: "檔案副檔名與格式不符" };
  }
  const max = recipeVideoMaxBytes(input.scope);
  if (input.fileSize > max) {
    return {
      ok: false,
      error: "影片檔案過大，請壓縮後再上傳。",
    };
  }
  if (input.fileSize <= 0) {
    return { ok: false, error: "無效的影片檔案" };
  }
  return {
    ok: true,
    mime,
    ext: expected ?? ext,
    safeOriginal: sanitizeOriginalFilename(input.fileName),
    movHint:
      mime === "video/quicktime"
        ? "為確保手機與瀏覽器相容性，建議轉換為 MP4（H.264）後上傳。"
        : null,
  };
}

export function isWritableSourceType(value: string): value is RecipeWritableSourceType {
  return value === "upload" || value === "storage" || value === "cdn";
}

export function isPlayableUploadedSource(sourceType: string | null | undefined): boolean {
  return sourceType === "upload" || sourceType === "storage" || sourceType === "cdn";
}

/** Server-owned storage path — never accept client-provided paths. */
export function buildRecipeVideoStoragePath(input: {
  recipeId: string;
  mediaId: string;
  scope: RecipeVideoMediaScope;
  ext: string;
  stepId?: string | null;
  chapterId?: string | null;
  storyPageId?: string | null;
}): string {
  const ext = input.ext.replace(/[^a-z0-9]/gi, "") || "mp4";
  const mediaId = input.mediaId;
  const recipeId = input.recipeId;
  switch (input.scope) {
    case "recipe_full":
      return `recipes/${recipeId}/full/${mediaId}.${ext}`;
    case "chapter":
      return `recipes/${recipeId}/chapters/${input.chapterId || "unknown"}/${mediaId}.${ext}`;
    case "step":
      return `recipes/${recipeId}/steps/${input.stepId || "unknown"}/${mediaId}.${ext}`;
    case "story_page":
      return `recipes/${recipeId}/story-pages/${input.storyPageId || "unknown"}/${mediaId}.${ext}`;
    default:
      return `recipes/${recipeId}/misc/${mediaId}.${ext}`;
  }
}

export const RECIPE_VIDEO_ACCEPT =
  "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov";

export const DEMO_MEDIA_SEED_KEY = "chimeidiy-smart-recipe-demo-v1";

import JSZip from "jszip";
import sharp from "sharp";
import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  IMAGE_BATCH_MAX_BYTES,
  IMAGE_MAX_EDGE,
  IMAGE_MIN_EDGE,
  TEMP_PREFIX,
  ZIP_MAX_BYTES,
  ZIP_MAX_FILES,
  ZIP_MAX_UNCOMPRESSED,
} from "@/lib/admin/product-image-batch";

export function detectImageMime(buffer: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "image/png";
  const riff = buffer.slice(0, 4).toString("ascii");
  const webp = buffer.slice(8, 12).toString("ascii");
  if (riff === "RIFF" && webp === "WEBP") return "image/webp";
  return null;
}

export function safeZipEntryName(name: string): string | null {
  const n = name.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!n || n.includes("..") || n.startsWith("/") || /^[a-zA-Z]:/.test(n)) return null;
  const base = n.split("/").pop() ?? "";
  if (!base || base.startsWith(".")) return null;
  return base;
}

export async function extractZipImages(zipBuffer: Buffer): Promise<Array<{ fileName: string; buffer: Buffer }>> {
  if (zipBuffer.length > ZIP_MAX_BYTES) {
    throw new Error(`ZIP 不可超過 ${Math.round(ZIP_MAX_BYTES / 1024 / 1024)}MB`);
  }
  const zip = await JSZip.loadAsync(zipBuffer);
  const names = Object.keys(zip.files);
  if (names.length > ZIP_MAX_FILES) {
    throw new Error(`ZIP 內檔案不可超過 ${ZIP_MAX_FILES} 個`);
  }
  const out: Array<{ fileName: string; buffer: Buffer }> = [];
  let total = 0;
  for (const rawName of names) {
    const entry = zip.files[rawName];
    if (!entry || entry.dir) continue;
    const fileName = safeZipEntryName(rawName);
    if (!fileName) continue;
    if (!/\.(jpe?g|png|webp)$/i.test(fileName)) continue;
    const buffer = Buffer.from(await entry.async("uint8array"));
    total += buffer.length;
    if (total > ZIP_MAX_UNCOMPRESSED) {
      throw new Error("ZIP 解壓縮後容量超過限制");
    }
    if (buffer.length > IMAGE_BATCH_MAX_BYTES) {
      throw new Error(`${fileName} 超過 10MB`);
    }
    out.push({ fileName, buffer });
  }
  if (!out.length) throw new Error("ZIP 內沒有可用的 JPG / PNG / WebP");
  return out;
}

export async function processProductImage(buffer: Buffer): Promise<{
  webp: Buffer;
  thumb: Buffer;
  width: number;
  height: number;
}> {
  const mime = detectImageMime(buffer);
  if (!mime) throw new Error("不是有效的圖片檔（伺服器已檢查檔案內容）");
  const img = sharp(buffer, { failOn: "none", animated: false });
  const meta = await img.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < IMAGE_MIN_EDGE && height < IMAGE_MIN_EDGE) {
    throw new Error("圖片尺寸不足");
  }
  const webp = await sharp(buffer, { failOn: "none", animated: false })
    .rotate()
    .resize({
      width: IMAGE_MAX_EDGE,
      height: IMAGE_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82, alphaQuality: 90, effort: 4 })
    .toBuffer();
  const thumb = await sharp(webp).resize({ width: 400, height: 400, fit: "inside" }).webp({ quality: 70 }).toBuffer();
  return { webp, thumb, width, height };
}

export async function uploadTempImage(
  admin: SupabaseClient,
  jobId: string,
  fileName: string,
  buffer: Buffer
) {
  const mime = detectImageMime(buffer);
  if (!mime) throw new Error(`${fileName} 不是有效圖片`);
  if (buffer.length > IMAGE_BATCH_MAX_BYTES) throw new Error(`${fileName} 超過 10MB`);
  const processed = await processProductImage(buffer);
  const safeName = fileName.replace(/[^A-Za-z0-9._-]/g, "_").replace(/\.[^.]+$/, "");
  const path = `${TEMP_PREFIX}/${jobId}/${Date.now()}-${safeName}.webp`;
  const { error: upErr } = await admin.storage.from("product-images").upload(path, processed.webp, {
    contentType: "image/webp",
    upsert: false,
  });
  if (upErr) throw new Error(upErr.message);
  const { data: pub } = admin.storage.from("product-images").getPublicUrl(path);
  return {
    fileName,
    path,
    url: pub.publicUrl,
    size: processed.webp.length,
    mime: "image/webp" as const,
    width: processed.width,
    height: processed.height,
    tooSmall: processed.width < IMAGE_MIN_EDGE && processed.height < IMAGE_MIN_EDGE,
  };
}

export async function promoteToProductPath(
  admin: SupabaseClient,
  productId: string,
  tempPath: string
): Promise<{ url: string; path: string; thumbUrl: string }> {
  const { data, error } = await admin.storage.from("product-images").download(tempPath);
  if (error || !data) throw new Error(error?.message ?? "讀取暫存圖片失敗");
  const buffer = Buffer.from(await data.arrayBuffer());
  const processed = await processProductImage(buffer);
  const imageId = randomUUID();
  const path = `products/${productId}/${imageId}.webp`;
  const thumbPath = `products/${productId}/${imageId}-thumb.webp`;
  const uploaded: string[] = [];
  const up1 = await admin.storage.from("product-images").upload(path, processed.webp, {
    contentType: "image/webp",
    upsert: false,
  });
  if (up1.error) throw new Error(up1.error.message);
  uploaded.push(path);
  const up2 = await admin.storage.from("product-images").upload(thumbPath, processed.thumb, {
    contentType: "image/webp",
    upsert: false,
  });
  if (up2.error) {
    await admin.storage.from("product-images").remove(uploaded);
    throw new Error(up2.error.message);
  }
  const { data: pub } = admin.storage.from("product-images").getPublicUrl(path);
  const { data: thumbPub } = admin.storage.from("product-images").getPublicUrl(thumbPath);
  return { url: pub.publicUrl, path, thumbUrl: thumbPub.publicUrl };
}

export async function cleanupExpiredImportFolders(admin: SupabaseClient) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: jobs } = await admin
    .from("product_batch_jobs")
    .select("id, status, created_at")
    .eq("job_type", "image_upload")
    .lt("created_at", cutoff)
    .limit(30);
  for (const job of jobs ?? []) {
    const folder = `${TEMP_PREFIX}/${job.id}`;
    const { data: listed } = await admin.storage.from("product-images").list(folder, { limit: 1000 });
    const paths = (listed ?? []).map((f) => `${folder}/${f.name}`);
    if (paths.length) await admin.storage.from("product-images").remove(paths);
  }
}

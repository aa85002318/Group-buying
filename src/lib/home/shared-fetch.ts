"use client";

/**
 * 首頁共用的 GET 快取。
 *
 * 首頁在手機尺寸會先掛上 App 版，水合之後電腦尺寸再換成網站版，兩棵樹都會各自
 * 去抓 /api/cms、/api/products…，等於每次開首頁都把同一支 API 叫兩次。
 * 這裡用網址當 key，短時間內共用同一個 Promise：同時發的併成一次，剛抓過的
 * 直接重用，換版型就不會再多打一輪。
 */

type Entry = { at: number; promise: Promise<unknown> };

const cache = new Map<string, Entry>();

const DEFAULT_TTL_MS = 20_000;

export function sharedJson<T = Record<string, unknown>>(
  url: string,
  opts?: { ttlMs?: number; credentials?: RequestCredentials }
): Promise<T> {
  const ttl = opts?.ttlMs ?? DEFAULT_TTL_MS;
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < ttl) return hit.promise as Promise<T>;

  const promise = fetch(url, { credentials: opts?.credentials ?? "same-origin" })
    .then((r) => r.json())
    .catch(() => ({}) as T);

  cache.set(url, { at: Date.now(), promise });
  return promise as Promise<T>;
}

/** 後台發布完要看到新內容時用。 */
export function clearSharedJson(url?: string) {
  if (url) cache.delete(url);
  else cache.clear();
}

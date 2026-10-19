import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 後台保溫。
 *
 * 問題：Vercel 上每一支 API 都是各自獨立的 serverless function，閒置久了會被回收。
 * 後台沒有訪客流量，所以幾乎每次打開都是冷的——要重啟 function、重建 Supabase
 * 連線、重驗 session，實測第一次開要 7～25 秒，暖機後只要 0.3 秒。
 *
 * 做法：定時去打後台一進去就會用到的那幾支，把它們維持在熱的狀態。
 *
 * 注意幾件事：
 * - 這裡是「打自己網站的 HTTP 端點」，不是直接呼叫函式。必須這樣才會真的喚醒
 *   那幾支各自獨立的 function；在這支裡面 import 它們的邏輯是沒有用的。
 * - 回 401 也算成功。/api/auth/me 沒帶 session 本來就會 401，但 function 已經
 *   被喚醒、Supabase 連線也建好了，目的就達到了。
 * - 每支 5 秒就放棄，不讓某一支卡住整個保溫工作。
 */

/** 後台開啟時會打的幾支，順序無所謂，反正是平行打。 */
const WARM_PATHS = [
  "/api/auth/me",
  "/api/branding",
  "/api/admin/dashboard",
  "/api/admin/store/notifications",
];

const PER_REQUEST_TIMEOUT_MS = 5000;

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") ?? "";
  const vercelCron = request.headers.get("x-vercel-cron");

  if (secret) {
    return auth === `Bearer ${secret}`;
  }
  if (vercelCron === "1") return true;
  return process.env.NODE_ENV !== "production";
}

/** 用請求本身的 host，正式站和測試站就各自保溫自己，不會打錯環境。 */
function originOf(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

async function warm(origin: string, path: string) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PER_REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${origin}${path}`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { "x-keep-warm": "1" },
    });
    // 讀完 body 才算真的跑完一輪，不然連線可能提早斷掉。
    await res.text().catch(() => "");
    return { path, status: res.status, ms: Date.now() - started };
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return { path, status: null, ms: Date.now() - started, error: aborted ? "timeout" : "failed" };
  } finally {
    clearTimeout(timer);
  }
}

async function handle(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = originOf(request);
  const results = await Promise.all(WARM_PATHS.map((p) => warm(origin, p)));
  // 有回應就算喚醒成功，401／403 也算（沒帶 session 本來就會被擋）。
  const woken = results.filter((r) => r.status !== null).length;
  const slowest = results.reduce((a, b) => (b.ms > a.ms ? b : a), results[0]);

  return NextResponse.json({
    ok: woken === results.length,
    origin,
    woken,
    total: results.length,
    slowest_ms: slowest?.ms ?? null,
    results,
    ran_at: new Date().toISOString(),
  });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

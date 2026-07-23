"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const MEDIA_PENDING_REPLACE = [
  "完整教學影片：尚未上傳／已上傳 · Storage path · 檔案大小 · 時長 · 替換狀態",
  "步驟影片：各 Step 是否有正式 MP4（不可再使用 YouTube）",
  "Story Page 影片：上傳後綁定並設定 start/end 片段",
  "封面與章節全版圖（目前為 Unsplash 示意，需換實拍）",
  "[DEMO] 商品圖（需換成實際上架 SKU 實拍）",
] as const;

type DemoStatus = {
  exists: boolean;
  recipeId: string | null;
  slug: string;
  demoKey?: string;
  counts?: Record<string, number>;
  videos?: Array<{
    id: string;
    scope: string;
    stepId: string | null;
    stepNumber?: number | null;
    label?: string;
    sourceType: string;
    processingStatus: string | null;
    uploadStatus: string | null;
    isActive: boolean;
    isDemo?: boolean;
    hasFile: boolean;
    storagePath: string | null;
    originalFilename?: string | null;
    fileSizeBytes: number | null;
    durationSeconds: number | null;
    status?: "pending" | "uploaded";
  }>;
  missingOfficialVideos?: boolean;
  checks?: {
    bucketConfigured: boolean;
    activeYoutubeMedia: number;
    placeholderCount: number;
    uploadedOfficialCount: number;
  };
  error?: string;
};

const CHECKLIST = [
  "食譜資料",
  "翻頁模式",
  "完整閱讀",
  "配方倍率",
  "材料勾選",
  "商品推薦",
  "分段影片",
  "影片時間標記",
  "每一步 AI",
  "問題討論",
  "成品分享",
  "Storybook 章節",
  "多版型頁面",
  "Guided Cook",
  "Story Builder 後台",
  "手機版待人工確認",
] as const;

type Props = {
  isDev: boolean;
  canMutate: boolean;
  userEmail: string | null;
};

export function RecipeDemoClient({ isDev, canMutate, userEmail }: Props) {
  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"seed" | "remove" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/demo/smart-recipe");
      const data = await res.json();
      if (!res.ok) {
        setStatus({
          exists: false,
          recipeId: null,
          slug: "chocolate-nut-soft-cookies-demo",
          error: data.error ?? `HTTP ${res.status}`,
        });
      } else {
        setStatus(data);
      }
    } catch (e) {
      setStatus({
        exists: false,
        recipeId: null,
        slug: "chocolate-nut-soft-cookies-demo",
        error: e instanceof Error ? e.message : "載入失敗",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runAction = async (action: "seed" | "remove") => {
    if (!canMutate) return;
    setBusy(action);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/demo/smart-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "操作失敗");
      } else {
        setMessage(action === "seed" ? "已重新寫入 DEMO 食譜" : "已移除 DEMO 食譜");
        await refresh();
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "操作失敗");
    } finally {
      setBusy(null);
    }
  };

  const slug = status?.slug || "chocolate-nut-soft-cookies-demo";
  const recipeId = status?.recipeId;
  const counts = status?.counts ?? {};

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 text-stone-800">
      <p className="text-sm text-stone-500">
        /dev/recipe-demo · {isDev ? "development" : "production（管理員）"}
        {userEmail ? ` · ${userEmail}` : ""}
      </p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight text-stone-900">
        CHIMEIDIY 智慧食譜 DEMO 驗收
      </h1>
      <p className="mt-2 text-stone-600">
        示範食譜：巧克力堅果軟餅乾。僅透過{" "}
        <code className="rounded bg-stone-100 px-1 text-sm">demo_key</code> 管理，不會刪除正式資料。
      </p>

      <section className="mt-8 border-t border-stone-200 pt-6">
        <h2 className="text-lg font-medium text-stone-900">狀態</h2>
        {loading ? (
          <p className="mt-2 text-sm text-stone-500">載入中…</p>
        ) : status?.error ? (
          <p className="mt-2 text-sm text-red-700">{status.error}</p>
        ) : (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-stone-500">存在</dt>
              <dd className="font-medium">{status?.exists ? "是" : "否"}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Slug</dt>
              <dd className="break-all font-mono text-xs">{slug}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Recipe ID</dt>
              <dd className="break-all font-mono text-xs">{recipeId ?? "—"}</dd>
            </div>
            {Object.entries(counts).map(([k, v]) => (
              <div key={k}>
                <dt className="text-stone-500">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="mt-8 border-t border-stone-200 pt-6">
        <h2 className="text-lg font-medium text-stone-900">上線前媒材替換清單</h2>
        <p className="mt-1 text-sm text-stone-500">
          小檔走 `/api/admin/upload`（purpose=recipe_video），大檔走 signed-upload → finalize。
          {status?.missingOfficialVideos ? " · 尚缺正式影片" : " · 正式影片已就緒"}
        </p>
        {status?.checks ? (
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-stone-500">active YouTube</dt>
              <dd className="font-medium">{status.checks.activeYoutubeMedia}</dd>
            </div>
            <div>
              <dt className="text-stone-500">placeholder</dt>
              <dd className="font-medium">{status.checks.placeholderCount}</dd>
            </div>
            <div>
              <dt className="text-stone-500">已上傳正式片</dt>
              <dd className="font-medium">{status.checks.uploadedOfficialCount}</dd>
            </div>
            <div>
              <dt className="text-stone-500">bucket</dt>
              <dd className="font-medium">{status.checks.bucketConfigured ? "recipe-media" : "—"}</dd>
            </div>
          </dl>
        ) : null}
        {(status?.videos?.length ?? 0) > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b text-stone-500">
                  <th className="py-1 pr-3">項目</th>
                  <th className="py-1 pr-3">狀態</th>
                  <th className="py-1 pr-3">DEMO</th>
                  <th className="py-1 pr-3">檔名</th>
                  <th className="py-1 pr-3">大小／時長</th>
                  <th className="py-1">path</th>
                </tr>
              </thead>
              <tbody>
                {status!.videos!.map((v) => (
                  <tr key={v.id} className="border-b border-stone-100">
                    <td className="py-1.5 pr-3">{v.label || (v.scope === "full" ? "完整教學影片" : "步驟影片")}</td>
                    <td className="py-1.5 pr-3">
                      {v.status === "uploaded" ? "uploaded" : "pending"}
                      {v.isActive ? " · 啟用" : " · 未啟用"}
                    </td>
                    <td className="py-1.5 pr-3">{v.isDemo ? "是" : "否"}</td>
                    <td className="max-w-[140px] truncate py-1.5 pr-3">
                      {v.originalFilename || "—"}
                    </td>
                    <td className="py-1.5 pr-3">
                      {v.fileSizeBytes != null
                        ? `${(v.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`
                        : "—"}
                      {v.durationSeconds != null ? ` · ${v.durationSeconds}s` : ""}
                    </td>
                    <td className="max-w-[220px] truncate py-1.5 font-mono text-[10px]">
                      {v.storagePath ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-700">
            {MEDIA_PENDING_REPLACE.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 border-t border-stone-200 pt-6">
        <h2 className="text-lg font-medium text-stone-900">功能檢查清單</h2>
        <ul className="mt-3 space-y-2">
          {CHECKLIST.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm">
              <span className="inline-block h-4 w-4 rounded border border-stone-300 bg-white" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 flex flex-wrap gap-3 border-t border-stone-200 pt-6">
        <Link
          href={`/recipes/${slug}`}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800"
        >
          開啟前台食譜
        </Link>
        {recipeId ? (
          <Link
            href={`/admin/recipes/${recipeId}`}
            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm hover:bg-stone-50"
          >
            開啟後台編輯
          </Link>
        ) : (
          <span className="rounded-md border border-dashed border-stone-300 px-4 py-2 text-sm text-stone-400">
            後台編輯（需先 seed）
          </span>
        )}
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm hover:bg-stone-50"
        >
          重新整理狀態
        </button>
      </section>

      {canMutate ? (
        <section className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void runAction("seed")}
            className="rounded-md bg-amber-700 px-4 py-2 text-sm text-white hover:bg-amber-800 disabled:opacity-50"
          >
            {busy === "seed" ? "寫入中…" : "重新 Seed DEMO"}
          </button>
          <button
            type="button"
            disabled={busy !== null || !status?.exists}
            onClick={() => {
              if (confirm("確定只刪除 demo_key 對應的 DEMO 食譜？")) void runAction("remove");
            }}
            className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {busy === "remove" ? "移除中…" : "移除 DEMO"}
          </button>
        </section>
      ) : (
        <p className="mt-6 text-sm text-stone-500">
          Seed／移除需以 admin 或 content_editor 登入後操作；或執行{" "}
          <code className="rounded bg-stone-100 px-1">npm run seed:demo-recipe</code>。
        </p>
      )}

      {message ? <p className="mt-4 text-sm text-amber-800">{message}</p> : null}
    </main>
  );
}

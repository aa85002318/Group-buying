"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { JOB_STATUS_LABEL, type ImageUpdateMode } from "@/lib/admin/product-image-batch";

type Uploaded = {
  fileName: string;
  url: string;
  path?: string;
  parsed: { sku: string; sequence: number; isMain: boolean } | null;
};
type MatchRow = {
  fileName: string;
  url: string;
  path?: string;
  status: string;
  reason?: string;
  productId?: string | null;
  productName?: string;
  sku?: string;
  sequence?: number;
  alt?: string;
};
type ProductHit = { id: string; name: string; sku?: string | null };

const STATUS_TEXT: Record<string, string> = {
  matched: "已配對",
  pending: "待確認",
  sku_missing: "SKU 不存在",
  bad_name: "檔名格式錯誤",
  duplicate: "重複圖片",
  too_small: "圖片尺寸不足",
  ignored: "已忽略",
};

function statusClass(status: string) {
  if (status === "matched") return "bg-emerald-100 text-emerald-800";
  if (status === "pending" || status === "bad_name") return "bg-[#FFF5CC] text-[#153E73]";
  return "bg-red-100 text-red-700";
}

function AdminProductImageBatchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [jobId, setJobId] = useState<string | null>(searchParams.get("jobId"));
  const [jobStatus, setJobStatus] = useState("uploading");
  const [files, setFiles] = useState<Uploaded[]>([]);
  const [rejected, setRejected] = useState<Array<{ fileName: string; error: string }>>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [mode, setMode] = useState<ImageUpdateMode>("fill_missing");
  const [preview, setPreview] = useState<{ summary: Record<string, number | string>; rows: Array<Record<string, unknown>> } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ProductHit[]>([]);
  const [assignFile, setAssignFile] = useState<string | null>(null);

  const hydrateJob = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/products/images/batch/jobs/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "讀取作業失敗");
    const meta = (data.job?.metadata ?? {}) as { files?: Uploaded[]; matches?: MatchRow[] };
    setJobStatus(data.job?.status ?? "uploading");
    setFiles(meta.files ?? []);
    if (meta.matches?.length) {
      setMatches(meta.matches);
      setStep(data.job?.status === "previewed" || data.job?.status === "completed" || data.job?.status === "writing" ? 3 : 2);
    }
    if (data.job?.metadata?.preview) setPreview(data.job.metadata.preview);
    setJobId(id);
  }, []);

  useEffect(() => {
    const id = searchParams.get("jobId");
    if (id) void hydrateJob(id).catch((e) => setError(e instanceof Error ? e.message : "讀取失敗"));
  }, [searchParams, hydrateJob]);

  useEffect(() => {
    if (!jobId || !["writing", "processing", "uploading"].includes(jobStatus)) return;
    const t = setInterval(() => {
      void hydrateJob(jobId).catch(() => {});
    }, 2500);
    return () => clearInterval(t);
  }, [jobId, jobStatus, hydrateJob]);

  const ensureJob = async () => {
    if (jobId) return jobId;
    const res = await fetch("/api/admin/products/images/batch/create-job", { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "建立作業失敗");
    const id = data.job.id as string;
    setJobId(id);
    router.replace(`/admin/products/images/batch?jobId=${id}`);
    return id;
  };

  const uploadList = async (list: File[]) => {
    setBusy(true);
    setError(null);
    try {
      const id = await ensureJob();
      const uploaded: Uploaded[] = [];
      const failed: Array<{ fileName: string; error: string }> = [];
      for (const file of list) {
        const fd = new FormData();
        fd.append("jobId", id);
        fd.append("file", file);
        const res = await fetch("/api/admin/products/images/batch/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          failed.push({ fileName: file.name, error: data.error ?? "上傳失敗" });
          continue;
        }
        uploaded.push(...(data.files ?? (data.file ? [data.file] : [])));
        failed.push(...(data.rejected ?? []));
      }
      setFiles((prev) => [...prev, ...uploaded]);
      setRejected((prev) => [...prev, ...failed]);
      setJobStatus("uploading");
    } catch (e) {
      setError(e instanceof Error ? e.message : "上傳失敗");
    } finally {
      setBusy(false);
    }
  };

  const persistMatches = async (next: MatchRow[]) => {
    if (!jobId) return;
    await fetch("/api/admin/products/images/batch/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        manual: next.map((m) => ({
          fileName: m.fileName,
          productId: m.status === "ignored" ? null : m.productId ?? null,
          sequence: m.sequence,
          ignored: m.status === "ignored",
          unmatched: m.status === "pending" && !m.productId,
        })),
      }),
    });
  };

  const runMatch = async () => {
    if (!jobId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/products/images/batch/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "配對失敗");
      setMatches(data.matches ?? []);
      setStep(2);
      setJobStatus("processing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "配對失敗");
    } finally {
      setBusy(false);
    }
  };

  const searchProducts = async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setHits([]);
      return;
    }
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    const list = (data.products ?? []) as ProductHit[];
    const n = q.toLowerCase();
    setHits(
      list
        .filter((p) => `${p.name} ${p.sku ?? ""}`.toLowerCase().includes(n))
        .slice(0, 8)
    );
  };

  const assignToProduct = async (fileName: string, product: ProductHit, sequence = 99) => {
    const next = matches.map((m) =>
      m.fileName === fileName
        ? {
            ...m,
            status: "matched",
            productId: product.id,
            productName: product.name,
            sku: product.sku ?? undefined,
            sequence,
            reason: undefined,
          }
        : m
    );
    setMatches(next);
    setAssignFile(null);
    setHits([]);
    await persistMatches(next);
  };

  const patchRow = async (fileName: string, patch: Partial<MatchRow>) => {
    const next = matches.map((m) => (m.fileName === fileName ? { ...m, ...patch } : m));
    setMatches(next);
    await persistMatches(next);
  };

  const moveSeq = async (fileName: string, dir: -1 | 1) => {
    const row = matches.find((m) => m.fileName === fileName);
    if (!row?.productId) return;
    const siblings = matches
      .filter((m) => m.productId === row.productId && m.status === "matched")
      .sort((a, b) => (a.sequence ?? 99) - (b.sequence ?? 99));
    const i = siblings.findIndex((m) => m.fileName === fileName);
    const j = i + dir;
    if (j < 0 || j >= siblings.length) return;
    const a = siblings[i].sequence ?? i + 1;
    const b = siblings[j].sequence ?? j + 1;
    const next = matches.map((m) => {
      if (m.fileName === siblings[i].fileName) return { ...m, sequence: b };
      if (m.fileName === siblings[j].fileName) return { ...m, sequence: a };
      return m;
    });
    setMatches(next);
    await persistMatches(next);
  };

  const runPreview = async () => {
    if (!jobId) return;
    setBusy(true);
    try {
      await persistMatches(matches);
      const res = await fetch("/api/admin/products/images/batch/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "預覽失敗");
      setPreview(data);
      setStep(3);
      setJobStatus("previewed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "預覽失敗");
    } finally {
      setBusy(false);
    }
  };

  const execute = async () => {
    if (!jobId) return;
    const products = Number(preview?.summary?.products ?? 0);
    const images = Number(preview?.summary?.matched ?? matches.filter((m) => m.status === "matched").length);
    if (!confirm(`本次將更新 ${products} 件商品，共 ${images} 張圖片。是否確認？`)) return;
    if (mode === "replace_all" && !confirm("將取代全部圖片，確定繼續？")) return;
    setBusy(true);
    setJobStatus("writing");
    try {
      let done = false;
      let last = { success: 0, failed: 0 };
      while (!done) {
        const res = await fetch("/api/admin/products/images/batch/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, mode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "更新失敗");
        done = Boolean(data.done);
        last = data;
        setJobStatus(data.status);
      }
      alert(`完成：成功 ${last.success}、失敗 ${last.failed}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新失敗");
    } finally {
      setBusy(false);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, MatchRow[]>();
    for (const row of matches) {
      const key = String(row.productId || row.status);
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return map;
  }, [matches]);

  const pendingCount = matches.filter((m) => m.status === "pending" || m.status === "bad_name").length;
  const errorCount = matches.filter((m) => ["sku_missing", "duplicate", "too_small"].includes(m.status)).length;

  return (
    <div className="space-y-6 pb-24">
      <AdminPageHeader
        title="商品圖片批次上傳"
        description="先上傳、再配對、最後才寫入正式商品圖片。檔名建議 SKU_01.jpg"
        actions={
          <Link href="/admin/products">
            <Button variant="outline">返回商品總覽</Button>
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <ol className="flex flex-wrap gap-2 font-bold text-[#153E73]">
          {[1, 2, 3].map((n) => (
            <li key={n} className={`rounded-full px-3 py-1 ${step === n ? "bg-[#FFD454]" : "bg-white border border-[#E8E1D7]"}`}>
              {n === 1 ? "1. 上傳圖片" : n === 2 ? "2. 自動配對" : "3. 確認更新"}
            </li>
          ))}
        </ol>
        <span className="rounded-full bg-white px-3 py-1 text-[#8A94A6]">
          {JOB_STATUS_LABEL[jobStatus] ?? jobStatus}
        </span>
      </div>

      {error ? <p className="text-sm text-[#F16458]">{error}</p> : null}

      {step === 1 ? (
        <section
          className="rounded-[24px] border-2 border-dashed border-[#FFD454] bg-white p-8 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void uploadList(Array.from(e.dataTransfer.files));
          }}
        >
          <p className="font-bold text-[#153E73]">拖曳多張 JPG / PNG / WebP，或 ZIP</p>
          <p className="mt-1 text-sm text-[#8A94A6]">命名：SKU_01 為首圖，_02 起為輪播。單張 10MB，ZIP 32MB。不會在此步驟寫入正式商品。</p>
          <input
            className="mt-4 max-w-full"
            type="file"
            accept="image/jpeg,image/png,image/webp,.zip,application/zip"
            multiple
            onChange={(e) => void uploadList(Array.from(e.target.files ?? []))}
          />
          <ul className="mt-4 grid gap-2 text-left text-sm">
            {files.map((f) => (
              <li key={f.fileName + f.url} className="flex items-center gap-3 rounded-xl bg-[#FFFEFA] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt="" className="h-14 w-14 rounded-lg bg-white object-contain" />
                <span className="min-w-0 flex-1 truncate">{f.fileName}</span>
                <span className="text-xs text-[#8A94A6]">{f.parsed ? `${f.parsed.sku} #${f.parsed.sequence}` : "待手動配對"}</span>
              </li>
            ))}
          </ul>
          {rejected.length ? (
            <ul className="mt-3 text-left text-sm text-[#F16458]">
              {rejected.map((r) => (
                <li key={r.fileName}>{r.fileName}：{r.error}</li>
              ))}
            </ul>
          ) : null}
          <Button className="mt-4" disabled={!files.length || busy} onClick={() => void runMatch()}>
            {busy ? "處理中…" : "進入自動配對"}
          </Button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-3">
          <p className="text-sm text-[#8A94A6]">
            已配對 {matches.filter((m) => m.status === "matched").length} · 待確認 {pendingCount} · 錯誤 {errorCount}
          </p>
          <input
            className="input-field max-w-sm"
            placeholder="搜尋商品名稱或 SKU，再指定待配對圖片"
            value={query}
            onChange={(e) => void searchProducts(e.target.value)}
          />
          {assignFile && hits.length ? (
            <ul className="rounded-2xl border border-[#E8E1D7] bg-white p-2 text-sm">
              {hits.map((p) => (
                <li key={p.id}>
                  <button className="w-full rounded-lg px-2 py-1 text-left hover:bg-[#FFF5CC]" onClick={() => void assignToProduct(assignFile, p, 2)}>
                    {p.name}　{p.sku}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {Array.from(grouped.entries()).map(([key, rows]) => (
            <div key={key} className="rounded-2xl border border-[#E8E1D7] bg-white p-3">
              {rows
                .slice()
                .sort((a, b) => (a.sequence ?? 99) - (b.sequence ?? 99))
                .map((row) => (
                  <div key={row.fileName} className="flex flex-wrap items-center gap-3 border-b border-[#F3EEE6] py-2 last:border-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={row.url} alt="" className="h-16 w-16 rounded-lg bg-[#F7F1E7] object-contain" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{row.productName || row.fileName}</p>
                      <p className="text-xs text-[#8A94A6]">{row.sku || row.fileName} · 序號 {row.sequence ?? "—"}</p>
                      <input
                        className="input-field mt-1 h-8 text-xs"
                        placeholder="Alt 文字"
                        value={row.alt ?? ""}
                        onChange={(e) => void patchRow(row.fileName, { alt: e.target.value })}
                      />
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass(row.status)}`}>
                      {STATUS_TEXT[row.status] || row.reason || row.status}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => setAssignFile(row.fileName)}>手動配對</Button>
                      <Button size="sm" variant="outline" onClick={() => void patchRow(row.fileName, { sequence: 1, status: row.productId ? "matched" : row.status })}>
                        設為首圖
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void patchRow(row.fileName, { sequence: Math.max(2, row.sequence ?? 2) })}>
                        改為輪播
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void moveSeq(row.fileName, -1)}>上移</Button>
                      <Button size="sm" variant="outline" onClick={() => void moveSeq(row.fileName, 1)}>下移</Button>
                      <Button size="sm" variant="ghost" onClick={() => void patchRow(row.fileName, { productId: null, status: "pending", reason: "已取消配對" })}>
                        取消配對
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void patchRow(row.fileName, { status: "ignored", productId: null })}>
                        忽略
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ))}
          <div className="sticky bottom-4 z-20 flex gap-2 overflow-x-auto rounded-2xl bg-white p-3 shadow">
            <Button variant="outline" onClick={() => setStep(1)}>上一步</Button>
            <Button className="bg-[#FFD454] text-[#153E73]" disabled={busy} onClick={() => void runPreview()}>
              預覽更新
            </Button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-3">
          <label className="block text-sm font-bold text-[#153E73]">
            圖片更新模式
            <select className="input-field mt-1" value={mode} onChange={(e) => setMode(e.target.value as ImageUpdateMode)}>
              <option value="fill_missing">只補缺少圖片</option>
              <option value="main_only">只更新首圖</option>
              <option value="append_gallery">附加輪播圖片</option>
              <option value="replace_all">取代全部圖片</option>
            </select>
          </label>
          {mode === "replace_all" ? <p className="font-bold text-[#F16458]">將覆蓋原有首圖與輪播圖，且可從操作紀錄復原。</p> : null}
          {preview ? (
            <div className="rounded-2xl bg-white p-4 text-sm">
              <p>上傳 {String(preview.summary.uploaded)} 張 · 配對 {String(preview.summary.matched)} · 待確認 {pendingCount} · 錯誤 {errorCount}</p>
              <p>受影響商品 {String(preview.summary.products)} · 新增首圖 {String(preview.summary.addedMain)} · 新增輪播 {String(preview.summary.addedGallery)} · 將被取代 {String(preview.summary.replaced)}</p>
            </div>
          ) : null}
          <div className="sticky bottom-4 z-20 flex flex-wrap gap-2 overflow-x-auto rounded-2xl bg-white p-3 shadow">
            <Button variant="outline" onClick={() => setStep(2)}>上一步</Button>
            <Button className="bg-[#FFD454] text-[#153E73]" disabled={busy} onClick={() => void runPreview()}>預覽更新</Button>
            <Button disabled={busy || !preview} onClick={() => void execute()}>
              {busy ? "寫入中…" : "確認更新"}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default function AdminProductImageBatchPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm">載入中…</p>}>
      <AdminProductImageBatchInner />
    </Suspense>
  );
}

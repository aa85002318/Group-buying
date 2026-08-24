"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { JOB_STATUS_LABEL } from "@/lib/admin/product-image-batch";

type Job = {
  id: string;
  job_type: string;
  status: string;
  operation_mode: string | null;
  total_items: number;
  success_items: number;
  failed_items: number;
  created_at: string;
  metadata?: { undone?: boolean };
};

type Item = {
  id: string;
  product_id: string | null;
  status: string;
  error_message: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
};

function HistoryInner() {
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("job");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    fetch("/api/admin/products/batch/jobs")
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs ?? []))
      .catch(() => setError("載入失敗"));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setItems([]);
      return;
    }
    fetch(`/api/admin/products/batch/jobs/${selectedId}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setError("無法載入作業明細"));
  }, [selectedId]);

  const undo = async (job: Job) => {
    if (!confirm("復原前會還原這次作業寫入的欄位／圖片。確定？")) return;
    const url =
      job.job_type === "image_upload"
        ? "/api/admin/products/images/batch/undo"
        : "/api/admin/products/batch/undo";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "復原失敗");
      return;
    }
    alert(`已復原 ${data.restored ?? 0} 筆`);
    load();
  };

  const selected = jobs.find((j) => j.id === selectedId);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="商品批次操作紀錄"
        description="查看批次修改與批次圖片作業，必要時可復原"
        actions={
          <Link href="/admin/products">
            <Button variant="outline">返回商品總覽</Button>
          </Link>
        }
      />
      {error ? <p className="text-sm text-[#F16458]">{error}</p> : null}
      <div className="overflow-x-auto rounded-[20px] border border-[#E8E1D7] bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-[#8A94A6]">
              <th className="p-3">類型</th>
              <th className="p-3">時間</th>
              <th className="p-3">狀態</th>
              <th className="p-3">成功／失敗</th>
              <th className="p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className={`border-t border-[#F3EEE6] ${job.id === selectedId ? "bg-[#FFF5CC]" : ""}`}>
                <td className="p-3">{job.job_type === "image_upload" ? "批次圖片" : "批次修改"}</td>
                <td className="p-3">{new Date(job.created_at).toLocaleString("zh-TW")}</td>
                <td className="p-3">
                  {JOB_STATUS_LABEL[job.status] ?? job.status}
                  {job.metadata?.undone ? "（已復原）" : ""}
                </td>
                <td className="p-3">
                  {job.success_items} / {job.failed_items}（共 {job.total_items}）
                </td>
                <td className="p-3">
                  <Link href={`/admin/products/batch-history?job=${job.id}`} className="mr-2 underline">
                    查看
                  </Link>
                  {job.job_type === "image_upload" ? (
                    <Link href={`/admin/products/images/batch?jobId=${job.id}`} className="mr-2 underline">
                      繼續作業
                    </Link>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={() => void undo(job)}>
                    復原
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected ? (
        <div className="rounded-[20px] border border-[#E8E1D7] bg-white p-4 text-sm">
          <h3 className="font-bold text-[#153E73]">作業明細</h3>
          <p className="mt-1 text-[#8A94A6]">
            {selected.job_type === "image_upload" ? "批次圖片" : "批次修改"} · {JOB_STATUS_LABEL[selected.status]} · 模式 {selected.operation_mode ?? "—"}
          </p>
          <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="border-b border-[#F3EEE6] pb-2">
                <p>
                  {item.status === "ok" ? "成功" : item.status} {item.product_id ?? ""}
                </p>
                {item.error_message ? <p className="text-[#F16458]">{item.error_message}</p> : null}
                <p className="text-xs text-[#8A94A6]">前：{JSON.stringify(item.before_data)}</p>
                <p className="text-xs text-[#8A94A6]">後：{JSON.stringify(item.after_data)}</p>
              </li>
            ))}
            {!items.length ? <li>尚無明細（預覽尚未執行或寫入中）</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminProductBatchHistoryPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm">載入中…</p>}>
      <HistoryInner />
    </Suspense>
  );
}

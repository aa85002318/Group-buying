"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminShell } from "@/components/admin/AdminShell";

type ReversalRequest = {
  id: string;
  status: string;
  reason: string;
  restore_inventory: boolean;
  reactivate_voucher: boolean;
  created_at: string;
  review_note?: string | null;
  member_gift_claims?: {
    redemption_number?: string | null;
    redemption_code?: string;
    redeemed_store_name_snapshot?: string | null;
    gift_campaigns?: { name?: string; gift_name?: string } | null;
    profiles?: { full_name?: string; member_number?: string } | null;
  } | null;
  requester?: { full_name?: string; role?: string } | null;
  reviewer?: { full_name?: string } | null;
};

export default function MemberGiftReversalsPage() {
  const { profile } = useAdminShell();
  const isAdmin = profile?.role === "admin";
  const [rows, setRows] = useState<ReversalRequest[]>([]);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const load = () => {
    setLoading(true);
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    fetch(`/api/admin/member-gifts/reversals${q}`)
      .then((r) => r.json())
      .then((d) => setRows(d.requests ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const decide = async (id: string, decision: "approve" | "reject") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/member-gifts/reversals/${id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, review_note: note }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "審核失敗");
      alert(d.message ?? "完成");
      setNote("");
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "審核失敗");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="沖銷申請"
        description={
          isAdmin
            ? "審核門市主管送出的核銷沖銷申請；核准後才會回補庫存／重啟兌換券"
            : "查看本店已送出的沖銷申請進度"
        }
      />

      <div className="flex flex-wrap gap-2">
        {[
          { v: "pending", l: "待審核" },
          { v: "approved", l: "已核准" },
          { v: "rejected", l: "已駁回" },
          { v: "all", l: "全部" },
        ].map((opt) => (
          <button
            key={opt.v}
            type="button"
            onClick={() => setStatus(opt.v)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              status === opt.v ? "bg-[#FEE169] text-[#153E73]" : "bg-[#F3F4F6] text-[#687386]"
            }`}
          >
            {opt.l}
          </button>
        ))}
      </div>

      {isAdmin && status === "pending" ? (
        <label className="block max-w-md text-xs">
          審核備註（選填）
          <Input
            className="mt-1"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="核准或駁回說明"
          />
        </label>
      ) : null}

      <ul className="space-y-3">
        {loading ? (
          <li className="text-sm text-[#8A94A6]">載入中…</li>
        ) : rows.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-[#E7EAF0] px-4 py-8 text-center text-sm text-[#8A94A6]">
            尚無申請
          </li>
        ) : (
          rows.map((r) => {
            const claim = r.member_gift_claims;
            return (
              <li
                key={r.id}
                className="space-y-2 rounded-2xl border border-[#E7EAF0] bg-white px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-[#153E73]">
                      {claim?.gift_campaigns?.name ?? "活動"} · {r.status}
                    </p>
                    <p className="text-xs text-[#687386]">
                      {claim?.profiles?.full_name ?? "會員"} ·{" "}
                      {claim?.redemption_number || claim?.redemption_code} ·{" "}
                      {claim?.redeemed_store_name_snapshot ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-[#153E73]">原因：{r.reason}</p>
                    <p className="text-[11px] text-[#8A94A6]">
                      申請人 {r.requester?.full_name ?? "—"} ·{" "}
                      {new Date(r.created_at).toLocaleString("zh-TW")}
                      {r.reviewer?.full_name ? ` · 審核 ${r.reviewer.full_name}` : ""}
                      {r.review_note ? ` · ${r.review_note}` : ""}
                    </p>
                    <p className="text-[11px] text-[#8A94A6]">
                      {r.restore_inventory ? "回補庫存" : "不回補庫存"} ·{" "}
                      {r.reactivate_voucher ? "重啟兌換券" : "作廢兌換券"}
                    </p>
                  </div>
                  {isAdmin && r.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === r.id}
                        onClick={() => void decide(r.id, "reject")}
                      >
                        駁回
                      </Button>
                      <Button
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => void decide(r.id, "approve")}
                      >
                        {busyId === r.id ? "處理中…" : "核准沖銷"}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminShell } from "@/components/admin/AdminShell";

type Voucher = {
  id: string;
  status: string;
  quantity: number;
  claimed_at?: string;
  expires_at?: string | null;
  redeemed_at?: string | null;
  redemption_code?: string;
  redemption_number?: string | null;
  redeemed_store_name_snapshot?: string | null;
  gift_campaigns?: { name?: string; gift_name?: string } | null;
  profiles?: { full_name?: string; member_number?: string; phone?: string } | null;
};

type ModalMode = "reverse" | "void";

export default function MemberGiftVouchersPage() {
  const { profile } = useAdminShell();
  const isAdmin = profile?.role === "admin";
  const isManager = profile?.role === "store_manager";
  const isMarketing = profile?.role === "content_editor" || isAdmin;
  const canReverse = isAdmin || isManager;
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalId, setModalId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>("reverse");
  const [reason, setReason] = useState("");
  const [restoreInventory, setRestoreInventory] = useState(true);
  const [reactivate, setReactivate] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    fetch(`/api/admin/member-gifts/vouchers${q}`)
      .then((r) => r.json())
      .then((d) => setVouchers(d.vouchers ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const submit = async () => {
    if (!modalId) return;
    setBusy(true);
    try {
      if (modalMode === "void") {
        const res = await fetch(`/api/admin/member-gifts/claims/${modalId}/void`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason,
            restore_inventory: restoreInventory,
          }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "作廢失敗");
        alert(d.message ?? "已作廢");
      } else {
        const endpoint = isAdmin
          ? `/api/admin/member-gifts/claims/${modalId}/reverse`
          : `/api/admin/member-gifts/claims/${modalId}/reverse-request`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason,
            restore_inventory: restoreInventory,
            reactivate_voucher: reactivate,
          }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "操作失敗");
        alert(d.message ?? "完成");
      }
      setModalId(null);
      setReason("");
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "操作失敗");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="兌換券管理"
        description="可作廢未兌換券；已核銷由門市主管申請沖銷或總管直接沖銷。"
        actions={
          canReverse ? (
            <Link href="/admin/member-gifts/reversals" className="text-sm font-semibold text-[#153E73] underline">
              沖銷申請
            </Link>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2">
        {[
          { v: "", l: "全部" },
          { v: "available", l: "可兌換" },
          { v: "redeemed", l: "已兌換" },
          { v: "expired", l: "已過期" },
          { v: "cancelled", l: "已作廢" },
        ].map((opt) => (
          <button
            key={opt.v || "all"}
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

      <div className="overflow-hidden rounded-2xl border border-[#E7EAF0] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#FFFDF6] text-[11px] uppercase text-[#8A94A6]">
            <tr>
              <th className="px-3 py-2">會員</th>
              <th className="px-3 py-2">活動／禮品</th>
              <th className="px-3 py-2">狀態</th>
              <th className="px-3 py-2">兌換碼</th>
              <th className="px-3 py-2">時間</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F2F5]">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-[#8A94A6]">
                  載入中…
                </td>
              </tr>
            ) : vouchers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-[#8A94A6]">
                  尚無兌換券
                </td>
              </tr>
            ) : (
              vouchers.map((v) => (
                <tr key={v.id}>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-[#153E73]">
                      {v.profiles?.full_name ?? "會員"}
                    </p>
                    <p className="text-xs text-[#8A94A6]">
                      {v.profiles?.member_number ?? v.profiles?.phone ?? v.id.slice(0, 8)}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <p>{v.gift_campaigns?.name}</p>
                    <p className="text-[#8A94A6]">{v.gift_campaigns?.gift_name}</p>
                  </td>
                  <td className="px-3 py-3 text-xs">{v.status}</td>
                  <td className="px-3 py-3 font-mono text-xs">
                    {v.redemption_number || v.redemption_code}
                  </td>
                  <td className="px-3 py-3 text-xs text-[#8A94A6]">
                    領 {v.claimed_at ? new Date(v.claimed_at).toLocaleString("zh-TW") : "—"}
                    {v.redeemed_at
                      ? ` / 兌 ${new Date(v.redeemed_at).toLocaleString("zh-TW")}`
                      : ""}
                    {v.redeemed_store_name_snapshot
                      ? ` · ${v.redeemed_store_name_snapshot}`
                      : ""}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {isMarketing && v.status === "available" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setModalMode("void");
                            setModalId(v.id);
                            setReason("");
                            setRestoreInventory(true);
                          }}
                        >
                          作廢
                        </Button>
                      ) : null}
                      {canReverse && v.status === "redeemed" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setModalMode("reverse");
                            setModalId(v.id);
                            setReason("");
                            setRestoreInventory(true);
                            setReactivate(true);
                          }}
                        >
                          {isAdmin ? "直接沖銷" : "申請沖銷"}
                        </Button>
                      ) : null}
                      {!(
                        (isMarketing && v.status === "available") ||
                        (canReverse && v.status === "redeemed")
                      ) ? (
                        <span className="text-xs text-[#8A94A6]">—</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-[#153E73]">
              {modalMode === "void"
                ? "作廢兌換券"
                : isAdmin
                  ? "直接核銷沖銷"
                  : "申請核銷沖銷"}
            </h3>
            <p className="text-xs text-[#687386]">
              {modalMode === "void"
                ? "作廢後會員無法再出示兌換。可選擇是否回補領取時保留的庫存。"
                : isAdmin
                  ? "會立即執行沖銷並保留稽核紀錄。"
                  : "送出後由總管理員核准才會回補庫存／重啟兌換券。僅限本店核銷。"}
            </p>
            <label className="block text-xs">
              {modalMode === "void" ? "作廢原因（必填）" : "沖銷原因（必填）"}
              <Input
                className="mt-1"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="例如：重複發放、會員要求取消"
              />
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={restoreInventory}
                onChange={(e) => setRestoreInventory(e.target.checked)}
              />
              恢復庫存
            </label>
            {modalMode === "reverse" ? (
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={reactivate}
                  onChange={(e) => setReactivate(e.target.checked)}
                />
                重新啟用兌換券（否則作廢）
              </label>
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" disabled={busy} onClick={() => setModalId(null)}>
                取消
              </Button>
              <Button disabled={busy || reason.trim().length < 2} onClick={() => void submit()}>
                {busy
                  ? "處理中…"
                  : modalMode === "void"
                    ? "確認作廢"
                    : isAdmin
                      ? "確認沖銷"
                      : "送出申請"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

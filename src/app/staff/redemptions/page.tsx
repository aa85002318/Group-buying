"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrScanner } from "@/components/staff/QrScanner";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";

type LookupResult = {
  can_redeem: boolean;
  reason?: string | null;
  claim: {
    id: string;
    status: string;
    gift_name?: string;
    gift_image_url?: string | null;
    quantity?: number;
    expires_at?: string | null;
    campaign_type?: string;
    redeemed_at?: string | null;
    redemption_number?: string | null;
    redeemed_store_name_snapshot?: string | null;
    redeemed_staff_code_snapshot?: string | null;
  };
  gift_items?: Array<{ id: string; gift_name: string }>;
  member: { name_masked: string; member_tail: string };
  store: { id?: string | null; name: string; allowed: boolean };
};

type SuccessResult = {
  redemption_number?: string;
  gift_name?: string;
  quantity?: number;
  redeemed_at?: string;
  store_name?: string;
  staff_code?: string;
  member?: { name_masked: string; member_tail: string };
};

type MemberClaimRow = {
  id: string;
  gift_name: string;
  campaign_name?: string;
  redemption_code: string;
};

export default function StaffRedemptionsPage() {
  const [mode, setMode] = useState<"scan" | "member">("scan");
  const [code, setCode] = useState("");
  const [memberQ, setMemberQ] = useState("");
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [memberClaims, setMemberClaims] = useState<MemberClaimRow[]>([]);
  const [memberInfo, setMemberInfo] = useState<{
    name_masked: string;
    member_tail: string;
  } | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [staffItemId, setStaffItemId] = useState("");
  const [staffItems, setStaffItems] = useState<Array<{ id: string; gift_name: string }>>([]);

  const applyLookup = (d: LookupResult, raw: string) => {
    setLookup(d);
    setToken(raw);
    const items = d.gift_items ?? [];
    setStaffItems(items);
    setStaffItemId(items[0]?.id ?? "");
  };

  const doLookup = useCallback(async (raw: string) => {
    setLoading(true);
    setMessage(null);
    setSuccess(null);
    setConfirmOpen(false);
    setMemberClaims([]);
    try {
      const res = await fetch("/api/staff/redemptions/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: raw, code: raw }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "查詢失敗");
      applyLookup(d, raw);
    } catch (e) {
      setLookup(null);
      setMessage(e instanceof Error ? e.message : "查詢失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  const searchMember = async () => {
    setLoading(true);
    setMessage(null);
    setSuccess(null);
    setLookup(null);
    setMemberClaims([]);
    setMemberInfo(null);
    try {
      const res = await fetch("/api/staff/redemptions/member-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: memberQ.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "查詢失敗");
      setMemberInfo(d.member);
      setMemberClaims(d.claims ?? []);
      if (!(d.claims ?? []).length) {
        setMessage("此會員目前沒有可核銷的兌換券");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "查詢失敗");
    } finally {
      setLoading(false);
    }
  };

  const pickMemberClaim = async (row: MemberClaimRow) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/staff/redemptions/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: row.redemption_code }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "查詢失敗");
      applyLookup(d, row.redemption_code);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "查詢失敗");
    } finally {
      setLoading(false);
    }
  };

  const confirmRedeem = async () => {
    if (!lookup?.claim?.id) return;
    if (staffItems.length > 0 && !staffItemId) {
      setMessage("請先選擇贈品");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/staff/redemptions/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim_id: lookup.claim.id,
          token,
          code: token,
          confirmed: true,
          idempotency_key: `${lookup.claim.id}:${Date.now()}`,
          ...(staffItemId ? { gift_item_id: staffItemId } : {}),
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        if (d.prior) {
          setMessage(
            `${d.error}\n原兌換編號：${d.prior.redemption_number ?? "—"}\n時間：${d.prior.redeemed_at ?? "—"}\n門市：${d.prior.store_name ?? "—"}\n人員：${d.prior.staff_code ?? "—"}`
          );
        } else {
          throw new Error(d.error ?? "核銷失敗");
        }
        setConfirmOpen(false);
        return;
      }
      setSuccess(d.result);
      setLookup(null);
      setMemberClaims([]);
      setConfirmOpen(false);
      setStaffItemId("");
      setStaffItems([]);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "核銷失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 pb-10">
      <div>
        <p className="text-xs font-semibold text-[#687386]">
          <Link href={APP_ROUTES.staffHome} className="underline">
            今日作業
          </Link>{" "}
          / 門市核銷
        </p>
        <h1 className="mt-1 text-xl font-bold text-[#153E73]">會員禮核銷</h1>
        <p className="text-sm text-[#687386]">
          掃描 QR、輸入備用碼，或以電話／會員編號查詢。
        </p>
      </div>

      {!success ? (
        <div className="flex gap-1 rounded-2xl border border-[#E8E1D7] bg-white p-1">
          {(
            [
              ["scan", "掃碼／兌換碼"],
              ["member", "電話／會員編號"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setMode(id);
                setMessage(null);
                setLookup(null);
                setMemberClaims([]);
              }}
              className={cn(
                "flex-1 rounded-xl px-2 py-2 text-xs font-bold",
                mode === id ? "bg-[#FEE169] text-[#153E73]" : "text-[#687386]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {success ? (
        <div className="space-y-3 rounded-2xl border border-[#E8E1D7] bg-white p-4">
          <h2 className="text-lg font-bold text-[#4F8A62]">核銷成功</h2>
          <dl className="space-y-1 text-sm text-[#687386]">
            <div className="flex justify-between"><dt>兌換編號</dt><dd>{success.redemption_number}</dd></div>
            <div className="flex justify-between"><dt>禮品</dt><dd>{success.gift_name}</dd></div>
            <div className="flex justify-between"><dt>會員</dt><dd>{success.member?.name_masked}（尾碼 {success.member?.member_tail}）</dd></div>
            <div className="flex justify-between"><dt>數量</dt><dd>{success.quantity}</dd></div>
            <div className="flex justify-between"><dt>時間</dt><dd>{success.redeemed_at ? new Date(success.redeemed_at).toLocaleString("zh-TW") : "—"}</dd></div>
            <div className="flex justify-between"><dt>門市</dt><dd>{success.store_name}</dd></div>
            <div className="flex justify-between"><dt>人員</dt><dd>{success.staff_code}</dd></div>
          </dl>
          <Button
            className="h-12 w-full bg-[#FEE169] font-bold text-[#153E73]"
            onClick={() => {
              setSuccess(null);
              setCode("");
              setMemberQ("");
            }}
          >
            完成並掃描下一張
          </Button>
          <Link href={APP_ROUTES.staffHome} className="block text-center text-sm text-[#153E73] underline">
            返回門市首頁
          </Link>
        </div>
      ) : mode === "scan" ? (
        <>
          <QrScanner onScan={(v) => void doLookup(v)} disabled={loading} />
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="輸入備用兌換碼"
            />
            <Button disabled={loading || !code.trim()} onClick={() => void doLookup(code)}>
              查詢
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={memberQ}
              onChange={(e) => setMemberQ(e.target.value)}
              placeholder="手機號碼或會員編號"
            />
            <Button disabled={loading || !memberQ.trim()} onClick={() => void searchMember()}>
              查詢
            </Button>
          </div>
          {memberInfo ? (
            <p className="text-xs text-[#687386]">
              會員 {memberInfo.name_masked}（尾碼 {memberInfo.member_tail}）
            </p>
          ) : null}
          {memberClaims.length > 0 ? (
            <ul className="space-y-2">
              {memberClaims.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className="w-full rounded-2xl border border-[#E8E1D7] bg-white px-4 py-3 text-left"
                    onClick={() => void pickMemberClaim(row)}
                  >
                    <p className="font-semibold text-[#153E73]">{row.gift_name}</p>
                    <p className="text-xs text-[#8A94A6]">
                      {row.campaign_name ?? "活動"} · 碼 {row.redemption_code}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      {message ? (
        <pre className="whitespace-pre-wrap rounded-2xl bg-[#FDE8E6] px-3 py-2 text-sm text-[#B42318]">
          {message}
        </pre>
      ) : null}

      {lookup ? (
        <div className="space-y-3 rounded-2xl border border-[#E8E1D7] bg-white p-4">
          {lookup.claim.gift_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lookup.claim.gift_image_url}
              alt=""
              className="aspect-[5/2] w-full rounded-xl object-cover"
            />
          ) : null}
          <h2 className="text-lg font-bold text-[#153E73]">{lookup.claim.gift_name}</h2>
          <dl className="space-y-1 text-sm text-[#687386]">
            <div className="flex justify-between"><dt>會員</dt><dd>{lookup.member.name_masked}（尾碼 {lookup.member.member_tail}）</dd></div>
            <div className="flex justify-between"><dt>數量</dt><dd>{lookup.claim.quantity ?? 1}</dd></div>
            <div className="flex justify-between"><dt>期限</dt><dd>{lookup.claim.expires_at ? new Date(lookup.claim.expires_at).toLocaleString("zh-TW") : "—"}</dd></div>
            <div className="flex justify-between"><dt>目前門市</dt><dd>{lookup.store.name}</dd></div>
            <div className="flex justify-between"><dt>狀態</dt><dd>{lookup.claim.status}</dd></div>
          </dl>
          {staffItems.length > 0 ? (
            <label className="block text-xs font-semibold text-[#153E73]">
              選擇贈品（門市選定）
              <select
                className="input-field mt-1 w-full"
                value={staffItemId}
                onChange={(e) => setStaffItemId(e.target.value)}
              >
                {staffItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.gift_name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {lookup.reason ? (
            <p className="rounded-xl bg-[#FFF5CC] px-3 py-2 text-sm text-[#153E73]">{lookup.reason}</p>
          ) : null}
          {lookup.can_redeem ? (
            <Button
              className="h-12 w-full bg-[#153E73] font-bold text-white"
              disabled={loading || (staffItems.length > 0 && !staffItemId)}
              onClick={() => setConfirmOpen(true)}
            >
              確認兌換
            </Button>
          ) : null}
        </div>
      ) : null}

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 sm:items-center sm:justify-center">
          <div className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5">
            <h3 className="text-lg font-bold text-[#153E73]">確認兌換會員禮？</h3>
            <p className="text-sm text-[#687386]">
              完成後此兌換碼將立即失效，無法重複兌換。請確認禮品已備妥並準備交付會員。
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                取消
              </Button>
              <Button
                className="bg-[#153E73] text-white"
                disabled={loading}
                onClick={() => void confirmRedeem()}
              >
                確認兌換
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

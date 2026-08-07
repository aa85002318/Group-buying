"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { APP_ROUTES } from "@/lib/site-links";

export default function MemberGiftVoucherDetailPage() {
  const { voucherId } = useParams<{ voucherId: string }>();
  const [data, setData] = useState<{
    claim: Record<string, unknown>;
    qr: { token: string; expires_at: number; refresh_ms: number } | null;
    member: { display_name: string };
  } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!voucherId) return;
    fetch(`/api/member/gifts/claims/${voucherId}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"));
  }, [voucherId]);

  useEffect(() => {
    load();
    const poll = window.setInterval(load, 15000);
    return () => window.clearInterval(poll);
  }, [load]);

  useEffect(() => {
    if (!data?.qr?.token) {
      setQrDataUrl("");
      return;
    }
    let cancelled = false;
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(data.qr!.token, { width: 240, margin: 1 }).then((url) => {
        if (!cancelled) setQrDataUrl(url);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [data?.qr?.token]);

  useEffect(() => {
    if (!data?.qr?.expires_at) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((data.qr!.expires_at - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) load();
    };
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [data?.qr?.expires_at, load]);

  const claim = data?.claim;
  const redeemed = claim?.status === "redeemed";
  const giftName = String(claim?.gift_name ?? "");
  const giftImage = (claim?.gift_image_url as string | null | undefined) ?? null;
  const terms = (claim?.terms as string | null | undefined) ?? null;
  const notes = (claim?.notes as string | null | undefined) ?? null;

  return (
    <RequireAuth>
      <div className="mx-auto max-w-lg space-y-4 px-4 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1rem)] pt-2">
        <div className="flex items-center gap-3">
          <Link href="/member/benefits/vouchers">
            <ArrowLeft className="h-5 w-5 text-[#153E73]" />
          </Link>
          <h1 className="text-xl font-bold text-[#153E73]">兌換條碼</h1>
        </div>

        {error ? <p className="text-sm text-[#B42318]">{error}</p> : null}

        {!claim && !error ? (
          <p className="text-sm text-[#687386]">載入中…</p>
        ) : claim ? (
          <div
            className={`space-y-4 rounded-[16px] border border-[#E8E1D7] bg-white p-4 ${
              redeemed ? "opacity-90" : ""
            }`}
          >
            {giftImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={giftImage}
                alt=""
                className="aspect-[5/2] w-full rounded-xl object-cover"
              />
            ) : null}
            <div>
              <p className="text-lg font-bold text-[#153E73]">{giftName}</p>
              <p className="text-sm text-[#687386]">
                {data?.member?.display_name} · 狀態：
                {redeemed ? "已兌換" : String(claim.status)}
              </p>
            </div>

            {redeemed ? (
              <div className="space-y-2 rounded-2xl bg-[#E8F8EF] p-4 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-[#4F8A62]" />
                <h2 className="text-lg font-bold text-[#4F8A62]">兌換完成</h2>
                <dl className="space-y-1 text-left text-sm text-[#687386]">
                  <div className="flex justify-between">
                    <dt>兌換編號</dt>
                    <dd>{String(claim.redemption_number ?? "—")}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>數量</dt>
                    <dd>{String(claim.quantity ?? 1)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>時間</dt>
                    <dd>
                      {claim.redeemed_at
                        ? new Date(String(claim.redeemed_at)).toLocaleString("zh-TW")
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>門市</dt>
                    <dd>{String(claim.redeemed_store_name_snapshot ?? "—")}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>人員</dt>
                    <dd>{String(claim.redeemed_staff_code_snapshot ?? "—")}</dd>
                  </div>
                </dl>
                <p className="text-xs text-[#687386]">
                  本兌換券已完成核銷，無法再次使用。
                </p>
                <div className="grid gap-2 pt-2">
                  <Link
                    href={APP_ROUTES.memberBenefits}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#FEE169] text-sm font-bold text-[#153E73]"
                  >
                    返回會員禮
                  </Link>
                  <Link
                    href="/member/benefits?tab=history"
                    className="text-center text-sm text-[#153E73] underline"
                  >
                    查看兌換紀錄
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#FFFDF6] p-4">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrDataUrl} alt="兌換 QR Code" className="h-56 w-56" />
                  ) : (
                    <div className="flex h-56 w-56 items-center justify-center text-sm text-[#687386]">
                      產生 QR 中…
                    </div>
                  )}
                  <p className="text-xs text-[#687386]">條碼約 {secondsLeft} 秒後更新</p>
                  <p className="font-mono text-lg font-bold tracking-widest text-[#153E73]">
                    {String(claim.redemption_code ?? "")}
                  </p>
                  <p className="text-center text-xs text-[#687386]">
                    請於指定門市出示此條碼，並由門市人員操作核銷。
                  </p>
                </div>
                <ul className="space-y-1 text-xs text-[#687386]">
                  <li>
                    兌換期限：
                    {claim.expires_at
                      ? new Date(String(claim.expires_at)).toLocaleString("zh-TW")
                      : "—"}
                  </li>
                  <li>
                    指定門市：
                    {Array.isArray(claim.stores)
                      ? (claim.stores as Array<{ name: string }>).map((s) => s.name).join("、") ||
                        "依活動設定"
                      : "依活動設定"}
                  </li>
                  <li>{terms || "請依活動說明至指定門市兌換。"}</li>
                  <li>{notes || "條碼不可由會員自行點擊完成核銷。"}</li>
                </ul>
              </>
            )}
          </div>
        ) : null}
      </div>
    </RequireAuth>
  );
}

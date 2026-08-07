"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";

type IdentityQrResponse = {
  token: string;
  expires_at: number;
  member_number: string | null;
  refresh_ms: number;
};

export function MemberQrCodeDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<IdentityQrResponse | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/member/identity-qr")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "無法產生 QR");
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "無法產生 QR"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!open) return;
    load();
  }, [open, load]);

  useEffect(() => {
    if (!open || !data?.token) {
      setQrDataUrl("");
      return;
    }
    let cancelled = false;
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(data.token, { width: 240, margin: 1 }).then((url) => {
        if (!cancelled) setQrDataUrl(url);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [open, data?.token]);

  useEffect(() => {
    if (!open || !data?.expires_at) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((data.expires_at - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) load();
    };
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [open, data?.expires_at, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="會員 QR Code"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-[0_12px_40px_rgba(21,62,115,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#153E73]">會員識別 QR</h2>
            <p className="mt-1 text-xs text-[#687386]">
              請出示給門市掃描。內容為短效識別碼，不含姓名或電話。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#153E73] hover:bg-[#FFFEFA]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#FFFEFA] px-4 py-5">
          {error ? (
            <p className="text-sm text-[#B42318]">{error}</p>
          ) : qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="會員識別 QR Code" className="h-56 w-56 rounded-xl bg-white" />
          ) : (
            <div className="flex h-56 w-56 items-center justify-center rounded-xl bg-white text-sm text-[#687386]">
              {loading ? "產生中…" : "—"}
            </div>
          )}
          <p className="font-mono text-sm font-bold tracking-wide text-[#153E73]">
            {data?.member_number ?? "—"}
          </p>
          <p className="text-xs text-[#687386]">
            {secondsLeft > 0 ? `${secondsLeft} 秒後自動更新` : "更新中…"}
          </p>
        </div>

        <p className="rounded-2xl bg-[#EEF8FC] px-3 py-2 text-xs leading-relaxed text-[#153E73]">
          掃描時請調高螢幕亮度，並避免反光，方便門市快速辨識。
        </p>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#FFD454] text-sm font-bold text-[#153E73] disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          重新整理 QR
        </button>
      </div>
    </div>
  );
}

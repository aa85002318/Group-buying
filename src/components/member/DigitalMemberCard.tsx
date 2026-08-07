"use client";

import Link from "next/link";
import { Pencil, QrCode } from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";

type DigitalMemberCardProps = {
  fullName: string;
  memberNumber: string;
  memberLevel: string;
  avatarUrl?: string | null;
  onOpenQr: () => void;
};

export function DigitalMemberCard({
  fullName,
  memberNumber,
  memberLevel,
  avatarUrl,
  onOpenQr,
}: DigitalMemberCardProps) {
  const initial = fullName.trim()?.[0] || "?";

  return (
    <section
      className="relative overflow-hidden rounded-2xl px-5 pb-5 pt-5 text-[#153E73]"
      style={{ background: "#FFD454" }}
      aria-label="數位會員卡"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-14 w-14 shrink-0 rounded-full border-2 border-white/70 object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#153E73] text-xl font-bold text-white">
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-lg font-bold leading-tight">{fullName || "會員"}</p>
            <p className="mt-0.5 text-sm font-medium text-[#153E73]/80">{memberLevel}</p>
          </div>
        </div>
        <p className="shrink-0 text-right text-[11px] font-bold tracking-[0.04em] text-[#153E73]/75">
          CHIMEIDIY
        </p>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[#153E73]/70">會員編號</p>
          <p className="mt-0.5 font-mono text-base font-bold tracking-wide">{memberNumber || "—"}</p>
        </div>
        <button
          type="button"
          onClick={onOpenQr}
          className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-white/90 text-[#153E73] shadow-[0_2px_8px_rgba(21,62,115,0.08)] transition active:scale-[0.98]"
          aria-label="顯示會員 QR Code"
        >
          <QrCode className="h-7 w-7" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
        <button
          type="button"
          onClick={onOpenQr}
          className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#153E73] text-sm font-bold text-white"
        >
          顯示 QR
        </button>
        <Link
          href={APP_ROUTES.memberBarcode}
          className="inline-flex h-10 items-center justify-center rounded-2xl bg-white/85 text-sm font-bold text-[#153E73]"
        >
          查看條碼
        </Link>
        <Link
          href={APP_ROUTES.memberProfile}
          aria-label="編輯個人資料"
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/85 text-[#153E73]"
        >
          <Pencil className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

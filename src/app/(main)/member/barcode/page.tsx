"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Maximize2 } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { MemberBarcode } from "@/components/profile/MemberBarcode";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/config";
import { APP_ROUTES } from "@/lib/site-links";

type ProfilePayload = {
  full_name?: string | null;
  member_number?: string | null;
  member_code?: string | null;
  updated_at?: string | null;
};

function MemberBarcodePageInner() {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setProfile({
        full_name: "示範會員",
        member_number: "CM000001",
        member_code: "CM000001",
        updated_at: new Date().toISOString(),
      });
      setFetchedAt(new Date());
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetch("/api/auth/me")
      .then(async (r) => {
        if (!r.ok) throw new Error("無法載入會員資料");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const p = data.profile as ProfilePayload | undefined;
        if (!p) {
          setError("找不到會員資料");
          return;
        }
        setProfile(p);
        setFetchedAt(new Date());
      })
      .catch(() => {
        if (!cancelled) setError("載入失敗，請稍後再試");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const barcodeValue =
    profile?.member_number?.trim() || profile?.member_code?.trim() || "";

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="mx-auto h-[280px] w-[260px] animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-foreground-secondary">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          重新載入
        </Button>
      </div>
    );
  }

  if (!barcodeValue) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="font-medium text-foreground">尚無可用的會員編號</p>
        <p className="text-sm text-foreground-secondary">
          無法產生會員條碼。請確認帳號已完成註冊，或聯絡客服協助。
        </p>
        <Link href={APP_ROUTES.support} className="text-sm text-primary hover:underline">
          前往客服中心
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={APP_ROUTES.member}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface shadow-card"
          aria-label="返回會員中心"
        >
          <ArrowLeft className="h-5 w-5 text-caramel" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-caramel">會員條碼</h1>
          <p className="text-sm text-foreground-secondary">門市識別會員身分用</p>
        </div>
      </div>

      <div className="rounded-[20px] bg-surface p-5 text-center shadow-card">
        <p className="font-medium text-foreground">{profile?.full_name || "會員"}</p>
        <p className="mt-1 font-mono text-sm tracking-wide text-caramel">{barcodeValue}</p>
        <p className="mt-1 text-xs text-foreground-secondary">App 會員編號</p>
      </div>

      <MemberBarcode value={barcodeValue} title="請出示此條碼" />

      <div className="flex justify-center">
        <Button type="button" variant="outline" className="min-h-11" onClick={() => setZoomOpen(true)}>
          <Maximize2 className="mr-2 h-4 w-4" />
          放大條碼
        </Button>
      </div>

      {fetchedAt && (
        <p className="text-center text-xs text-foreground-secondary">
          更新時間：
          {fetchedAt.toLocaleString("zh-TW", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}

      <section className="rounded-[20px] border border-border bg-peach-soft/40 p-4 text-sm text-foreground-secondary">
        <p className="font-medium text-caramel">使用說明</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>此條碼僅供門市人員辨識 App 會員身分。</li>
          <li>不代表 POS 消費同步、點數累積或會員等級。</li>
          <li>不包含門市現場消費紀錄或發票交易同步。</li>
          <li>請勿將條碼截圖公開分享。</li>
        </ul>
      </section>

      {zoomOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-white"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="放大會員條碼"
        >
          <div className="flex justify-end p-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setZoomOpen(false)}>
              關閉
            </Button>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
            <MemberBarcode value={barcodeValue} title="" className="scale-110" />
            <p className="mt-6 text-center text-sm text-foreground-secondary">
              請將螢幕亮度調高後出示給門市人員
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MemberBarcodePage() {
  return (
    <RequireAuth>
      <MemberBarcodePageInner />
    </RequireAuth>
  );
}

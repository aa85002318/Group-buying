"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DigitalMemberCard } from "@/components/member/DigitalMemberCard";
import { MemberOrderStatus, type MemberOrderCounts } from "@/components/member/MemberOrderStatus";
import { MemberQrCodeDialog } from "@/components/member/MemberQrCodeDialog";
import { DesktopInnerPageLayout } from "@/components/desktop/layout/DesktopInnerPageLayout";
import { Button } from "@/components/ui/button";
import { INNER_PAGE_HEROES, MEMBER_SIDEBAR_ITEMS } from "@/lib/desktop/inner-page-config";
import { isSupabaseConfigured } from "@/lib/config";
import { APP_ROUTES } from "@/lib/site-links";

type ProfileSummary = {
  full_name?: string | null;
  email?: string | null;
  member_number?: string | null;
  member_code?: string | null;
  member_level?: string | null;
  avatar_url?: string | null;
};

function activeMemberKey(pathname: string) {
  if (pathname.startsWith(APP_ROUTES.memberOrders)) return "orders";
  if (pathname.startsWith(APP_ROUTES.memberBenefits)) return "benefits";
  if (pathname.startsWith(APP_ROUTES.favorites)) return "favorites";
  if (pathname.startsWith(APP_ROUTES.memberStores)) return "stores";
  if (pathname.startsWith(APP_ROUTES.memberCarrier)) return "carrier";
  if (pathname.startsWith(APP_ROUTES.memberAddresses)) return "addresses";
  if (pathname.startsWith(APP_ROUTES.support)) return "support";
  if (pathname.startsWith(APP_ROUTES.memberProfile)) return "profile";
  return "profile";
}

export function DesktopMember() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [orderCounts, setOrderCounts] = useState<MemberOrderCounts | null>(null);
  const [memberLevel, setMemberLevel] = useState("一般會員");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setProfile({
        full_name: "示範會員",
        email: "demo@example.com",
        member_number: "CM000001",
        member_level: "一般會員",
      });
      setOrderCounts({
        awaitingPayment: 0,
        awaitingShipment: 0,
        readyForPickup: 0,
        completed: 0,
      });
      setLoading(false);
      return;
    }

    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/member/summary").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([authData, summaryData]) => {
        if (authData.profile) {
          setProfile({
            ...authData.profile,
            email: authData.user?.email ?? authData.profile.email,
            member_number:
              summaryData?.memberNumber ??
              authData.profile.member_number ??
              authData.profile.member_code,
          });
        }
        if (summaryData?.summary) {
          const s = summaryData.summary;
          setOrderCounts({
            awaitingPayment: s.awaitingPayment ?? 0,
            awaitingShipment: s.awaitingShipment ?? 0,
            readyForPickup: s.readyForPickup ?? 0,
            completed: s.completed ?? 0,
          });
        }
        setMemberLevel(
          summaryData?.memberLevel || authData.profile?.member_level || "一般會員"
        );
        setAvatarUrl(summaryData?.avatarUrl ?? authData.profile?.avatar_url ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && !profile && isSupabaseConfigured()) {
    return (
      <DesktopInnerPageLayout
        hero={INNER_PAGE_HEROES.member}
        breadcrumb={[
          { label: "首頁", href: APP_ROUTES.home },
          { label: "會員中心" },
        ]}
        sidebar={{
          title: "會員選單",
          items: MEMBER_SIDEBAR_ITEMS,
          activeKey: activeMemberKey(pathname),
        }}
      >
        <div className="rounded-2xl bg-white p-8 text-center">
          <p className="mb-4 text-[#687386]">請先登入以使用會員中心</p>
          <Link href={`${APP_ROUTES.login}?next=${encodeURIComponent(APP_ROUTES.member)}`}>
            <Button className="min-h-11 bg-[#FFD454] font-bold text-[#153E73] hover:bg-[#FEE169]">
              登入
            </Button>
          </Link>
        </div>
      </DesktopInnerPageLayout>
    );
  }

  const displayName = profile?.full_name?.trim() || "會員";
  const memberNo = profile?.member_number ?? profile?.member_code ?? "—";

  return (
    <>
      <DesktopInnerPageLayout
        hero={INNER_PAGE_HEROES.member}
        breadcrumb={[
          { label: "首頁", href: APP_ROUTES.home },
          { label: "會員中心" },
        ]}
        sidebar={{
          title: "會員選單",
          items: MEMBER_SIDEBAR_ITEMS,
          activeKey: activeMemberKey(pathname),
        }}
        toolbar={{
          title: "會員總覽",
          description: "訂單、會員禮與常用服務",
        }}
      >
        {loading ? (
          <p className="text-[#687386]">載入中…</p>
        ) : (
          <div className="space-y-6">
            <DigitalMemberCard
              fullName={displayName}
              memberNumber={memberNo}
              memberLevel={memberLevel}
              avatarUrl={avatarUrl}
              onOpenQr={() => setQrOpen(true)}
            />
            {orderCounts ? <MemberOrderStatus counts={orderCounts} /> : null}
            <div className="grid gap-3 sm:grid-cols-2">
              {MEMBER_SIDEBAR_ITEMS.map((item) => (
                <Link
                  key={item.key}
                  href={item.href || APP_ROUTES.member}
                  className="rounded-2xl border border-[#E9EDF2] bg-white px-5 py-4 text-sm font-semibold text-[#153E73] transition hover:bg-[#FFF8F0]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <button
              type="button"
              className="text-sm font-semibold text-[#687386] hover:text-[#153E73]"
              onClick={async () => {
                if (isSupabaseConfigured()) await fetch("/api/auth/logout", { method: "POST" });
                router.push(APP_ROUTES.login);
              }}
            >
              登出
            </button>
          </div>
        )}
      </DesktopInnerPageLayout>
      <MemberQrCodeDialog open={qrOpen} onClose={() => setQrOpen(false)} />
    </>
  );
}

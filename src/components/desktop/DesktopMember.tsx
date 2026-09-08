"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DesktopContainer } from "@/components/desktop/DesktopContainer";
import { DigitalMemberCard } from "@/components/member/DigitalMemberCard";
import { MemberOrderStatus, type MemberOrderCounts } from "@/components/member/MemberOrderStatus";
import { MemberQrCodeDialog } from "@/components/member/MemberQrCodeDialog";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/config";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";

const SIDEBAR = [
  { href: APP_ROUTES.memberProfile, label: "會員資料" },
  { href: APP_ROUTES.memberOrders, label: "我的訂單" },
  { href: APP_ROUTES.memberBenefits, label: "會員禮" },
  { href: APP_ROUTES.favorites, label: "收藏" },
  { href: APP_ROUTES.memberStores, label: "門市會員" },
  { href: APP_ROUTES.memberCarrier, label: "發票載具" },
  { href: APP_ROUTES.memberAddresses, label: "地址" },
  { href: APP_ROUTES.support, label: "客服" },
] as const;

type ProfileSummary = {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  member_number?: string | null;
  member_code?: string | null;
  member_level?: string | null;
  avatar_url?: string | null;
};

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
      <div className="bg-[var(--cream,#FFFDF9)] py-16 text-center">
        <DesktopContainer>
          <p className="mb-4 text-[#687386]">請先登入以使用會員中心</p>
          <Link href={`${APP_ROUTES.login}?next=${encodeURIComponent(APP_ROUTES.member)}`}>
            <Button className="min-h-11 bg-[#FFD454] font-bold text-[#153E73] hover:bg-[#FEE169]">
              登入
            </Button>
          </Link>
        </DesktopContainer>
      </div>
    );
  }

  const displayName = profile?.full_name?.trim() || "會員";
  const memberNo = profile?.member_number ?? profile?.member_code ?? "—";

  return (
    <div className="bg-[var(--cream,#FFFDF9)] py-8">
      <DesktopContainer>
        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl bg-white p-4">
            <p className="mb-3 px-2 text-sm font-bold text-[#153E73]">會員中心</p>
            <nav className="space-y-1">
              {SIDEBAR.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                      active
                        ? "bg-[#FFF3C4] text-[#153E73]"
                        : "text-[#5E4035] hover:bg-[#FFF8F0]"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <button
              type="button"
              className="mt-4 w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#9A7B6C] hover:bg-[#FFF8F0]"
              onClick={async () => {
                if (isSupabaseConfigured()) await fetch("/api/auth/logout", { method: "POST" });
                router.push(APP_ROUTES.login);
              }}
            >
              登出
            </button>
          </aside>

          <div className="space-y-6">
            {loading ? (
              <p className="text-[#9A7B6C]">載入中…</p>
            ) : (
              <>
                <DigitalMemberCard
                  fullName={displayName}
                  memberNumber={memberNo}
                  memberLevel={memberLevel}
                  avatarUrl={avatarUrl}
                  onOpenQr={() => setQrOpen(true)}
                />
                {orderCounts ? <MemberOrderStatus counts={orderCounts} /> : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  {SIDEBAR.map((item) => (
                    <Link
                      key={`quick-${item.href}`}
                      href={item.href}
                      className="rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-[#153E73] transition hover:bg-[#FFF8F0]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </DesktopContainer>
      <MemberQrCodeDialog open={qrOpen} onClose={() => setQrOpen(false)} />
    </div>
  );
}

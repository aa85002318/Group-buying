"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmailVerificationNotice } from "@/components/auth/EmailVerificationNotice";
import { Button } from "@/components/ui/button";
import { DigitalMemberCard } from "@/components/member/DigitalMemberCard";
import { MemberBenefitsSection } from "@/components/member/MemberBenefitsSection";
import { MemberOrderStatus, type MemberOrderCounts } from "@/components/member/MemberOrderStatus";
import { MemberPageHeader } from "@/components/member/MemberPageHeader";
import { MemberPageSkeleton } from "@/components/member/MemberPageSkeleton";
import { MemberQrCodeDialog } from "@/components/member/MemberQrCodeDialog";
import { MemberQuickActions } from "@/components/member/MemberQuickActions";
import { MemberServiceList } from "@/components/member/MemberServiceList";
import type { GiftCampaignCardData } from "@/components/member/gifts/GiftCampaignCard";
import { isSupabaseConfigured } from "@/lib/config";
import { getAuthErrorMessage } from "@/lib/auth/error-messages";
import { requestVerificationEmail } from "@/lib/auth/send-verification-client";
import { APP_ROUTES } from "@/lib/site-links";

type ProfileSummary = {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  member_number?: string | null;
  member_code?: string | null;
  member_level?: string | null;
  avatar_url?: string | null;
};

export function MemberCenterClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [orderCounts, setOrderCounts] = useState<MemberOrderCounts | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [memberLevel, setMemberLevel] = useState("一般會員");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [giftCampaigns, setGiftCampaigns] = useState<GiftCampaignCardData[]>([]);
  const [usableGifts, setUsableGifts] = useState(0);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  const loadGifts = () => {
    fetch("/api/member/gifts")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setGiftCampaigns(d.campaigns ?? []);
        setUsableGifts(d.usable_claim_count ?? 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setProfile({
        full_name: "示範會員",
        email: "demo@example.com",
        phone: "0912345678",
        member_number: "CM000001",
        member_level: "一般會員",
      });
      setOrderCounts({
        awaitingPayment: 0,
        awaitingShipment: 0,
        readyForPickup: 0,
        completed: 0,
      });
      setMemberLevel("一般會員");
      setLoading(false);
      loadGifts();
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
        setEmailVerified(Boolean(authData.email_verified));
        if (summaryData?.summary) {
          const s = summaryData.summary;
          setOrderCounts({
            awaitingPayment: s.awaitingPayment ?? 0,
            awaitingShipment: s.awaitingShipment ?? 0,
            readyForPickup: s.readyForPickup ?? 0,
            completed: s.completed ?? 0,
          });
          setUnreadNotifications(s.unreadNotifications ?? 0);
        }
        setMemberLevel(
          summaryData?.memberLevel ||
            authData.profile?.member_level ||
            "一般會員"
        );
        setAvatarUrl(
          summaryData?.avatarUrl ?? authData.profile?.avatar_url ?? null
        );
        loadGifts();
      })
      .finally(() => setLoading(false));
  }, []);

  const claimGift = async (
    campaignId: string,
    opts?: { store_id?: string; gift_item_id?: string }
  ) => {
    setClaimingId(campaignId);
    try {
      const res = await fetch("/api/member/gifts/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          ...(opts?.store_id ? { store_id: opts.store_id } : {}),
          ...(opts?.gift_item_id ? { gift_item_id: opts.gift_item_id } : {}),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "領取失敗");
      loadGifts();
    } catch (e) {
      alert(e instanceof Error ? e.message : "領取失敗");
    } finally {
      setClaimingId(null);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) await fetch("/api/auth/logout", { method: "POST" });
    router.push(APP_ROUTES.login);
  };

  const handleResendVerification = async () => {
    const email = profile?.email?.trim();
    if (!email) return;
    setResending(true);
    try {
      const result = await requestVerificationEmail(email);
      if (!result.ok) throw new Error(result.error ?? "寄送失敗");
      setResendMessage(result.message ?? "驗證信已寄出");
    } catch (err) {
      alert(getAuthErrorMessage(err, "resend"));
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#FFFEFA]">
        <div className="mx-auto max-w-[480px]">
          <MemberPageSkeleton />
        </div>
      </div>
    );
  }

  if (!profile && isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-[480px] space-y-4 bg-[#FFFEFA] px-4 py-12 text-center">
        <p className="text-[#687386]">請先登入以使用會員中心</p>
        <Link href={`${APP_ROUTES.login}?next=${encodeURIComponent(APP_ROUTES.member)}`}>
          <Button className="min-h-11 bg-[#FFD454] font-bold text-[#153E73] hover:bg-[#FEE169]">
            登入
          </Button>
        </Link>
      </div>
    );
  }

  const memberNo = profile?.member_number ?? profile?.member_code ?? "—";
  const displayName = profile?.full_name?.trim() || "會員";

  return (
    <div className="min-h-[100dvh] bg-[#FFFEFA]">
      <div className="mx-auto max-w-[480px] pb-[calc(88px+env(safe-area-inset-bottom))]">
        <MemberPageHeader unreadCount={unreadNotifications} />

        <div className="space-y-5 px-4 pt-1">
          <DigitalMemberCard
            fullName={displayName}
            memberNumber={memberNo}
            memberLevel={memberLevel}
            avatarUrl={avatarUrl}
            onOpenQr={() => setQrOpen(true)}
          />

          {!emailVerified && (
            <div className="rounded-2xl bg-white px-4 py-3">
              <EmailVerificationNotice
                email={profile?.email ?? undefined}
                resending={resending}
                onResend={handleResendVerification}
                compact
                title="Email 尚未驗證"
                description="完成驗證後才能下單。"
                showProfileLink={false}
              />
              {resendMessage ? (
                <p className="mt-2 text-xs text-green-700">{resendMessage}</p>
              ) : null}
            </div>
          )}

          <MemberQuickActions />
          <MemberOrderStatus counts={orderCounts} />
          <MemberBenefitsSection
            campaigns={giftCampaigns}
            claimingId={claimingId}
            onClaim={claimGift}
          />
          <MemberServiceList
            usableGifts={usableGifts}
            unreadNotifications={unreadNotifications}
            onLogout={handleLogout}
          />
        </div>
      </div>

      <MemberQrCodeDialog open={qrOpen} onClose={() => setQrOpen(false)} />
    </div>
  );
}

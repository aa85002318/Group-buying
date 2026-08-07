import { availableQuantity } from "@/lib/gifts/inventory";
import type {
  GiftCampaign,
  GiftMemberUiStatus,
  MemberGiftClaim,
} from "@/lib/gifts/types";

function inWindow(now: Date, start?: string | null, end?: string | null) {
  if (start && now < new Date(start)) return "before" as const;
  if (end && now > new Date(end)) return "after" as const;
  return "in" as const;
}

export function resolveMemberGiftStatus(opts: {
  campaign: GiftCampaign;
  claim?: MemberGiftClaim | null;
  eligible: boolean;
  now?: Date;
}): GiftMemberUiStatus {
  const now = opts.now ?? new Date();
  const { campaign, claim, eligible } = opts;

  if (campaign.status === "draft" || campaign.status === "paused") return "disabled";
  if (campaign.status === "ended") {
    if (claim?.status === "redeemed") return "redeemed";
    if (claim?.status === "available") {
      const exp = claim.expires_at ? new Date(claim.expires_at) : null;
      if (exp && exp < now) return "expired";
      return "redeemable";
    }
    return "expired";
  }

  if (!eligible && !claim) return "ineligible";

  if (claim?.status === "redeemed") return "redeemed";
  if (claim?.status === "cancelled") return "disabled";
  if (claim?.status === "expired") return "expired";

  if (claim?.status === "available") {
    const exp = claim.expires_at ? new Date(claim.expires_at) : null;
    if (exp && exp < now) return "expired";
    const redeemWin = inWindow(now, campaign.redeem_start_at, campaign.redeem_end_at);
    if (redeemWin === "before") return "claimed";
    if (redeemWin === "after") return "expired";
    return "redeemable";
  }

  const displayWin = inWindow(now, campaign.display_start_at ?? campaign.claim_start_at, campaign.claim_end_at);
  if (displayWin === "before") return "not_started";

  if (isExhausted(campaign)) return "exhausted";
  if (availableQuantity(campaign) <= 0) return "sold_out";

  const claimWin = inWindow(now, campaign.claim_start_at, campaign.claim_end_at);
  if (claimWin === "before") return "not_started";
  if (claimWin === "after") return "expired";

  return "claimable";
}

function isExhausted(campaign: GiftCampaign) {
  return (
    Number(campaign.total_quantity) > 0 &&
    Number(campaign.redeemed_quantity) + Number(campaign.reserved_quantity) >=
      Number(campaign.total_quantity) &&
    availableQuantity(campaign) <= 0
  );
}

export function maskMemberName(name: string | null | undefined): string {
  const n = (name ?? "").trim();
  if (!n) return "會員";
  if (n.length === 1) return `${n}＊`;
  return `${n[0]}${"＊".repeat(Math.min(2, n.length - 1))}`;
}

export function memberNumberTail(code: string | null | undefined): string {
  const c = (code ?? "").replace(/\s/g, "");
  if (c.length <= 4) return c || "----";
  return c.slice(-4);
}

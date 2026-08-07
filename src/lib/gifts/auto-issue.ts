import { createAdminClient } from "@/lib/supabase/admin";
import { isMemberEligibleForCampaign } from "@/lib/gifts/eligibility";
import { claimMonthlyGift } from "@/lib/gifts/service";
import type { GiftCampaign } from "@/lib/gifts/types";

type ProfileRow = {
  id: string;
  created_at?: string | null;
  birthday?: string | null;
  member_level?: string | null;
  member_tags?: string[] | null;
  phone?: string | null;
  email?: string | null;
  member_points?: number | null;
};

/**
 * 自動發放生日禮／新會員禮（已發布活動）。
 * 每位活動每輪最多處理 limitPerCampaign 位，避免 Cron 逾時。
 */
export async function autoIssueBirthdayAndNewMemberGifts(
  limitPerCampaign = 40
): Promise<{
  campaigns: number;
  issued: number;
  skipped: number;
  errors: number;
}> {
  const admin = createAdminClient();
  const { data: campaigns } = await admin
    .from("gift_campaigns")
    .select("*")
    .eq("status", "published")
    .in("campaign_type", ["birthday_gift", "new_member_gift"])
    .limit(20);

  let issued = 0;
  let skipped = 0;
  let errors = 0;
  const list = (campaigns ?? []) as GiftCampaign[];

  for (const campaign of list) {
    const now = new Date();
    if (campaign.claim_start_at && now < new Date(campaign.claim_start_at)) {
      skipped += 1;
      continue;
    }
    if (campaign.claim_end_at && now > new Date(campaign.claim_end_at)) {
      skipped += 1;
      continue;
    }
    // Auto-issue cannot choose a store or member-picked item
    if (campaign.require_store_selection) {
      skipped += 1;
      continue;
    }
    if ((campaign.item_selection_mode ?? "single") === "member_pick") {
      skipped += 1;
      continue;
    }

    let candidates: ProfileRow[] = [];

    if (campaign.campaign_type === "birthday_gift") {
      // Birthday in current calendar month (YYYY-MM-DD stored)
      const month = now.getMonth() + 1;
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, created_at, birthday, member_level, member_tags, phone, email, member_points")
        .eq("role", "member")
        .not("birthday", "is", null)
        .limit(500);
      candidates = ((profiles ?? []) as ProfileRow[]).filter((p) => {
        if (!p.birthday) return false;
        const b = new Date(p.birthday);
        return !Number.isNaN(b.getTime()) && b.getMonth() + 1 === month;
      });
    } else {
      // new_member_gift: registered within 30 days
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, created_at, birthday, member_level, member_tags, phone, email, member_points")
        .eq("role", "member")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(300);
      candidates = (profiles ?? []) as ProfileRow[];
    }

    // Exclude members who already have a non-cancelled claim
    const { data: existing } = await admin
      .from("member_gift_claims")
      .select("member_id")
      .eq("campaign_id", campaign.id)
      .neq("status", "cancelled")
      .limit(5000);
    const claimed = new Set((existing ?? []).map((r) => r.member_id as string));

    const queue = candidates
      .filter((p) => !claimed.has(p.id))
      .filter((p) =>
        isMemberEligibleForCampaign(campaign, {
          id: p.id,
          created_at: p.created_at,
          birthday: p.birthday,
          member_level: p.member_level,
          member_tags: p.member_tags,
          phone: p.phone,
          email: p.email,
          member_points: p.member_points,
        })
      )
      .slice(0, limitPerCampaign);

    for (const profile of queue) {
      const result = await claimMonthlyGift({
        campaignId: campaign.id,
        memberId: profile.id,
        profile: {
          id: profile.id,
          created_at: profile.created_at,
          birthday: profile.birthday,
          member_level: profile.member_level,
          member_tags: profile.member_tags,
          phone: profile.phone,
          email: profile.email,
          member_points: profile.member_points,
        },
      });
      if ("error" in result) {
        if (
          result.code === "already_claimed" ||
          result.code === "limit_reached" ||
          result.code === "exhausted" ||
          result.code === "ineligible"
        ) {
          skipped += 1;
        } else {
          errors += 1;
        }
        continue;
      }
      issued += 1;
      await admin.from("gift_redemption_logs").insert({
        claim_id: result.claim.id,
        campaign_id: campaign.id,
        member_id: profile.id,
        action: "auto_issue",
        result: "success",
        meta: { campaign_type: campaign.campaign_type },
      });
    }
  }

  return {
    campaigns: list.length,
    issued,
    skipped,
    errors,
  };
}

import type { GiftCampaign } from "@/lib/gifts/types";

type MemberProfileLite = {
  id: string;
  created_at?: string | null;
  birthday?: string | null;
  member_level?: string | null;
  member_tags?: string[] | null;
  phone?: string | null;
  email?: string | null;
  email_verified?: boolean | null;
  phone_verified?: boolean | null;
  member_points?: number | null;
};

/** Eligibility rules for member gift campaigns. */
export function isMemberEligibleForCampaign(
  campaign: GiftCampaign,
  profile: MemberProfileLite
): boolean {
  if (campaign.require_phone_verified) {
    const phoneOk = Boolean(profile.phone_verified ?? profile.phone);
    if (!phoneOk) return false;
  }
  if (campaign.require_email_verified) {
    const emailOk = Boolean(profile.email_verified ?? profile.email);
    if (!emailOk) return false;
  }

  switch (campaign.eligibility_type) {
    case "all_members":
      return true;
    case "member_list":
      return (campaign.eligible_member_ids ?? []).includes(profile.id);
    case "member_levels": {
      const level = profile.member_level ?? "general";
      const allowed = campaign.eligible_member_levels ?? [];
      return allowed.length === 0 || allowed.includes(level);
    }
    case "birthday_month": {
      if (!profile.birthday) return false;
      const b = new Date(profile.birthday);
      if (Number.isNaN(b.getTime())) return false;
      return b.getMonth() === new Date().getMonth();
    }
    case "new_members": {
      if (!profile.created_at) return true;
      const created = new Date(profile.created_at);
      const days = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
      return days <= 30;
    }
    case "member_tags": {
      const needed = campaign.eligible_member_tags ?? [];
      if (needed.length === 0) return true;
      const have = new Set(profile.member_tags ?? []);
      return needed.some((t) => have.has(t));
    }
    case "registration_date": {
      if (!profile.created_at) return false;
      const created = new Date(profile.created_at).getTime();
      if (campaign.eligibility_registered_from) {
        if (created < new Date(campaign.eligibility_registered_from).getTime()) return false;
      }
      if (campaign.eligibility_registered_to) {
        if (created > new Date(campaign.eligibility_registered_to).getTime()) return false;
      }
      return true;
    }
    case "verified_contact": {
      const phoneOk = Boolean(profile.phone_verified ?? profile.phone);
      const emailOk = Boolean(profile.email_verified ?? profile.email);
      return phoneOk || emailOk;
    }
    case "spend_threshold":
      // Requires order queries — treat as eligible for listing; claim/qualify API rechecks.
      return true;
    case "points_threshold": {
      const min = Number(campaign.eligibility_min_points ?? 0);
      if (min <= 0) return true;
      const pts = Number(profile.member_points ?? 0);
      return pts >= min;
    }
    default:
      return true;
  }
}

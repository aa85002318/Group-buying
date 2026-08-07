import type { GiftCampaign } from "@/lib/gifts/types";

type MemberProfileLite = {
  id: string;
  created_at?: string | null;
  birthday?: string | null;
  member_level?: string | null;
};

/** Basic eligibility for monthly member gifts (MVP rules). */
export function isMemberEligibleForCampaign(
  campaign: GiftCampaign,
  profile: MemberProfileLite
): boolean {
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
    case "spend_threshold":
    case "points_threshold":
      // Requires extra queries — treat as eligible for listing; claim API rechecks.
      return true;
    default:
      return true;
  }
}

import type {
  MonsterGameSettings,
  MonsterProfile,
  MonsterReward,
  ProductShareRecord,
  RewardRule,
} from "@/lib/types/database";

export type MonsterStage = "hungry" | "eating" | "preparing" | "gift";

export const MONSTER_STAGE_LABELS: Record<MonsterStage, string> = {
  hungry: "肚子餓餓的",
  eating: "開心吃麵包中",
  preparing: "準備送禮物",
  gift: "禮物準備好了！",
};

export const SHAREABLE_ORDER_STATUSES = [
  "payment_confirmed",
  "preparing",
  "ready_for_pickup",
  "completed",
] as const;

export function calculateBreadKg(
  reviewText: string,
  hasPhoto: boolean,
  settings?: Pick<MonsterGameSettings, "share_kg" | "bonus_chars" | "bonus_kg" | "photo_kg">
): number {
  const base = settings?.share_kg ?? 0.5;
  const bonusChars = settings?.bonus_chars ?? 30;
  const bonusKg = settings?.bonus_kg ?? 0.5;
  const photoKg = settings?.photo_kg ?? 1;

  let kg = base;
  if (reviewText.trim().length > bonusChars) {
    kg += bonusKg;
  }
  if (hasPhoto) {
    kg += photoKg;
  }
  return kg;
}

export function getMonsterStage(breadKg: number): MonsterStage {
  if (breadKg < 1) return "hungry";
  if (breadKg < 3) return "eating";
  if (breadKg < 5) return "preparing";
  return "gift";
}

export function getNextRewardThreshold(
  breadKg: number,
  rules: Pick<RewardRule, "threshold_kg" | "is_active">[]
): number | null {
  const active = rules
    .filter((r) => r.is_active)
    .map((r) => Number(r.threshold_kg))
    .sort((a, b) => a - b);
  return active.find((t) => t > breadKg) ?? null;
}

export function getUnlockedRewards(
  previousKg: number,
  newKg: number,
  rules: RewardRule[]
): RewardRule[] {
  return rules.filter(
    (r) =>
      r.is_active &&
      Number(r.threshold_kg) > previousKg &&
      Number(r.threshold_kg) <= newKg
  );
}

export function buildLineShareText(
  productName: string,
  reviewText: string,
  shareUrl: string
): string {
  return `🍞 我在門市團購買了「${productName}」！\n\n${reviewText.trim()}\n\n👉 一起來團購：${shareUrl}`;
}

export function buildShareUrl(
  appUrl: string,
  productId: string,
  memberCode: string
): string {
  const base = appUrl.replace(/\/$/, "");
  return `${base}/products/${productId}?ref=${encodeURIComponent(memberCode)}&source=monster_share`;
}

export function todayStartIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function countTodayShares(
  records: Pick<ProductShareRecord, "created_at" | "status">[]
): number {
  const start = todayStartIso();
  return records.filter(
    (r) =>
      r.created_at >= start &&
      (r.status === "pending_review" || r.status === "approved")
  ).length;
}

export function checkDailyLimit(
  records: Pick<ProductShareRecord, "created_at" | "status">[],
  limit = 3
): { allowed: boolean; used: number; remaining: number } {
  const used = countTodayShares(records);
  return {
    allowed: used < limit,
    used,
    remaining: Math.max(0, limit - used),
  };
}

export function checkDuplicateShare(
  records: Pick<ProductShareRecord, "order_id" | "product_id" | "status">[],
  orderId: string,
  productId: string
): boolean {
  return records.some(
    (r) =>
      r.order_id === orderId &&
      r.product_id === productId &&
      r.status !== "rejected"
  );
}

export function onApproveShare(
  profile: MonsterProfile,
  breadKgAwarded: number,
  rules: RewardRule[],
  existingRewards: Pick<MonsterReward, "reward_rule_id">[]
): {
  updatedProfile: MonsterProfile;
  newRewards: Omit<MonsterReward, "id" | "created_at" | "updated_at">[];
} {
  const previousKg = Number(profile.bread_kg);
  const newKg = previousKg + breadKgAwarded;
  const stage = getMonsterStage(newKg);
  const level = Math.max(1, Math.floor(newKg / 5) + 1);

  const unlocked = getUnlockedRewards(previousKg, newKg, rules);
  const existingRuleIds = new Set(existingRewards.map((r) => r.reward_rule_id));

  const newRewards = unlocked
    .filter((rule) => !existingRuleIds.has(rule.id))
    .map((rule) => ({
      user_id: profile.user_id,
      reward_rule_id: rule.id,
      threshold_kg: Number(rule.threshold_kg),
      reward_type: rule.reward_type,
      reward_name: rule.reward_name,
      reward_value: rule.reward_value,
      status: "pending_review" as const,
      issued_at: null,
      used_at: null,
      expires_at: null,
    }));

  return {
    updatedProfile: {
      ...profile,
      bread_kg: newKg,
      current_stage: stage,
      level,
    },
    newRewards,
  };
}

export const REVIEW_TEMPLATES = [
  "這次團購的商品品質很好，門市取貨也很方便，推薦給大家！",
  "新鮮又實惠，已經回購好幾次了，值得分享給朋友～",
  "包裝完整、取貨快速，整體購物體驗很棒！",
];

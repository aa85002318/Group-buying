/** Consumer feature switches — hide, do not delete, group-buy for phase 1. */
export const FEATURES = {
  groupBuying: false,
  aiAssistant: true,
  shop: true,
  recipes: true,
  favorites: true,
  memberBenefits: true,
} as const;

export type FeatureKey = keyof typeof FEATURES;

import type {
  MonsterGameSettings,
  MonsterProfile,
  MonsterReward,
  ProductShareRecord,
  RewardRule,
} from "@/lib/types/database";
import { MOCK_USER_ID } from "@/lib/mock-data";
import { getMonsterStage } from "@/lib/services/monsterService";

export const DEFAULT_REWARD_RULES: RewardRule[] = [
  {
    id: "m7000001-0000-4000-8000-000000000001",
    threshold_kg: 5,
    reward_type: "store_credit",
    reward_name: "儲值金 20 元",
    reward_value: "20",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "m7000001-0000-4000-8000-000000000002",
    threshold_kg: 10,
    reward_type: "coupon",
    reward_name: "折價券 50 元",
    reward_value: "50",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "m7000001-0000-4000-8000-000000000003",
    threshold_kg: 20,
    reward_type: "free_shipping",
    reward_name: "免運券",
    reward_value: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "m7000001-0000-4000-8000-000000000004",
    threshold_kg: 30,
    reward_type: "mystery_gift",
    reward_name: "神秘禮物",
    reward_value: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DEFAULT_GAME_SETTINGS: MonsterGameSettings = {
  id: "settings-1",
  share_kg: 0.5,
  min_chars: 10,
  bonus_chars: 30,
  bonus_kg: 0.5,
  photo_kg: 1,
  daily_limit: 3,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function createDefaultMonsterProfile(userId: string): MonsterProfile {
  return {
    id: `mp-${userId}`,
    user_id: userId,
    monster_name: "麵包小怪獸",
    bread_kg: 0,
    level: 1,
    current_stage: getMonsterStage(0),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export const monsterMockStore = {
  profiles: new Map<string, MonsterProfile>(),
  shareRecords: [] as ProductShareRecord[],
  rewards: [] as MonsterReward[],
  rewardRules: [...DEFAULT_REWARD_RULES],
  gameSettings: { ...DEFAULT_GAME_SETTINGS },
  lineEvents: [] as Array<{
    id: string;
    user_id: string;
    product_id: string | null;
    share_record_id: string | null;
    event_type: string;
    raw_payload: Record<string, unknown>;
    created_at: string;
  }>,
};

export function getOrCreateMockProfile(userId: string): MonsterProfile {
  let profile = monsterMockStore.profiles.get(userId);
  if (!profile) {
    profile = createDefaultMonsterProfile(userId);
    monsterMockStore.profiles.set(userId, profile);
  }
  return profile;
}

// Seed demo profile for mock user
monsterMockStore.profiles.set(MOCK_USER_ID, createDefaultMonsterProfile(MOCK_USER_ID));

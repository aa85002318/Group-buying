export type AIErrorCode =
  | "UNAUTHORIZED"
  | "QUOTA_EXCEEDED"
  | "VALIDATION"
  | "TIMEOUT"
  | "AI_UNAVAILABLE"
  | "NOT_FOUND"
  | "DUPLICATE"
  | "MAINTENANCE"
  | "FORBIDDEN";

export type AIResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: AIErrorCode | string;
    message: string;
    retryable: boolean;
  };
  usage?: {
    used: number;
    remaining: number;
    resetAt: string;
  };
};

export type AIToolId =
  | "recipes"
  | "scale"
  | "oven"
  | "substitute"
  | "failure"
  | "chat";

export const AI_DISCLAIMER =
  "AI提供的烘焙建議僅供參考，實際結果會受到材料品牌、環境、設備及操作方式影響。涉及過敏原、食品安全或特殊飲食需求時，請再次確認商品標示並依專業意見操作。";

export const DEFAULT_AI_SETTINGS = {
  enabled: true,
  maintenance: false,
  guestDailyLimit: 3,
  memberDailyLimit: 20,
  adminDailyLimit: 100,
  maxInputChars: 2000,
  maxImageBytes: 4 * 1024 * 1024,
  conversationRetentionDays: 30,
  replyMaxTokens: 900,
  systemPromptVersion: "v1",
  disclaimer: AI_DISCLAIMER,
  sensitiveRules:
    "禁止保證烘焙一定成功、保證食品不含過敏原、提供醫療或營養處方、推薦已下架商品、自動下單或修改會員資料。",
  saveConversationsDefault: true,
  toolLimits: {
    recipes: 20,
    scale: 20,
    oven: 20,
    substitute: 20,
    failure: 20,
    chat: 20,
  } as Record<AIToolId, number>,
};

export type AISettings = typeof DEFAULT_AI_SETTINGS;

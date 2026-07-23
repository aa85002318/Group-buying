/** Recipe Storybook page types & layouts (separate from recipe_steps). */

export type RecipeStoryPageType =
  | "cover"
  | "toc"
  | "chapter"
  | "introduction"
  | "ingredients"
  | "tools"
  | "preparation"
  | "image_text"
  | "full_image"
  | "full_video"
  | "step_video"
  | "step"
  | "gallery"
  | "comparison"
  | "timer"
  | "temperature"
  | "checkpoint"
  | "ai_help"
  | "ask_teacher"
  | "recommendations"
  | "discussion"
  | "submissions"
  | "challenge"
  | "completion"
  | "related"
  | "storage"
  | "scale";

export type RecipeStoryLayoutType =
  | "full_bleed"
  | "split_image_text"
  | "video_lead"
  | "gallery"
  | "comparison"
  | "checkpoint"
  | "timer"
  | "list"
  | "embed";

export type RecipeStoryAlignment =
  | "top_left"
  | "bottom_left"
  | "center"
  | "bottom_right";

export type StorySplitDirection =
  | "image_left"
  | "image_right"
  | "image_top"
  | "image_bottom";

export type StoryGalleryMode = "swipe" | "grid_2x2" | "row";

export type StoryComparisonOption = {
  id: string;
  label: string;
  caption?: string;
  imageUrl?: string;
  outcome?: string;
  aiPrompt?: string;
};

export type StoryCheckpointItem = {
  id: string;
  text: string;
};

export type StoryContentConfig = {
  splitDirection?: StorySplitDirection;
  galleryMode?: StoryGalleryMode;
  galleryCount?: 2 | 3 | 4;
  frames?: Array<{
    id?: string;
    number?: number;
    title?: string;
    caption?: string;
    imageUrl?: string;
    aiContext?: string;
  }>;
  comparisonPrompt?: string;
  comparisonOptions?: StoryComparisonOption[];
  timerSeconds?: number;
  timerLabel?: string;
  temperatureLabel?: string;
  temperatureValue?: number;
  temperatureUnit?: "C" | "F";
  ctaPrimary?: string;
  ctaSecondary?: string;
  guidedRequired?: boolean;
  skipAllowed?: boolean;
  chapterAccent?: string;
  overlayOpacity?: number;
  startSeconds?: number;
  endSeconds?: number;
  /** V3: per-page caution popup (代替獨立「容易失敗」頁) */
  cautionEnabled?: boolean;
  cautionTitle?: string;
  cautionItems?: string[];
  /** Challenge page copy */
  challengeHours?: number;
  challengeBadgeLabel?: string;
};

export type StoryCompletionConfig = {
  checklist?: StoryCheckpointItem[];
  continueLabel?: string;
  mismatchLabel?: string;
  mismatchAiPrompt?: string;
};

export const STORY_PAGE_TYPE_LABELS: Record<RecipeStoryPageType, string> = {
  cover: "封面",
  toc: "目錄",
  chapter: "章節開場",
  introduction: "介紹",
  ingredients: "材料",
  tools: "器具",
  preparation: "前置作業",
  image_text: "圖文",
  full_image: "全版圖片",
  full_video: "全版影片",
  step_video: "步驟影片",
  step: "製作步驟",
  gallery: "成品分享",
  comparison: "狀態比較",
  timer: "計時",
  temperature: "溫度",
  checkpoint: "完成檢查",
  ai_help: "提問（舊）",
  ask_teacher: "我要提問",
  recommendations: "推薦商品",
  discussion: "問題討論",
  submissions: "作品牆",
  challenge: "食譜挑戰",
  completion: "完成",
  related: "相關食譜",
  storage: "保存方式",
  scale: "配方倍率（已停用）",
};

/** Preferred Story Book V3 page types (admin picker order). */
export const STORY_PAGE_TYPES_V3: RecipeStoryPageType[] = [
  "cover",
  "toc",
  "introduction",
  "ingredients",
  "tools",
  "preparation",
  "full_image",
  "full_video",
  "image_text",
  "step",
  "step_video",
  "storage",
  "recommendations",
  "challenge",
  "gallery",
  "submissions",
  "completion",
  "chapter",
  "comparison",
  "timer",
  "checkpoint",
  "ask_teacher",
];

export const STORY_LAYOUT_LABELS: Record<RecipeStoryLayoutType, string> = {
  full_bleed: "全版視覺",
  split_image_text: "圖文分割",
  video_lead: "影片主導",
  gallery: "多圖分鏡",
  comparison: "狀態比較",
  checkpoint: "任務完成",
  timer: "計時",
  list: "清單",
  embed: "嵌入內容",
};

/** Map wizard intent → default page_type + layout */
export function defaultsForStoryIntent(intent: string): {
  page_type: RecipeStoryPageType;
  layout_type: RecipeStoryLayoutType;
} {
  switch (intent) {
    case "full_image":
      return { page_type: "full_image", layout_type: "full_bleed" };
    case "image_text":
      return { page_type: "image_text", layout_type: "split_image_text" };
    case "video":
      return { page_type: "step_video", layout_type: "video_lead" };
    case "gallery":
      return { page_type: "gallery", layout_type: "gallery" };
    case "comparison":
      return { page_type: "comparison", layout_type: "comparison" };
    case "timer":
      return { page_type: "timer", layout_type: "timer" };
    case "checkpoint":
      return { page_type: "checkpoint", layout_type: "checkpoint" };
    case "ask_teacher":
      return { page_type: "ask_teacher", layout_type: "embed" };
    case "step":
      return { page_type: "step", layout_type: "video_lead" };
    case "cover":
      return { page_type: "cover", layout_type: "full_bleed" };
    case "toc":
      return { page_type: "toc", layout_type: "list" };
    case "challenge":
      return { page_type: "challenge", layout_type: "full_bleed" };
    case "completion":
      return { page_type: "completion", layout_type: "full_bleed" };
    case "product":
    case "recommendations":
      return { page_type: "recommendations", layout_type: "embed" };
    default:
      return { page_type: "introduction", layout_type: "split_image_text" };
  }
}

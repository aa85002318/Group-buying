/** Recipe Storybook page types & layouts (separate from recipe_steps). */

export type RecipeStoryPageType =
  | "cover"
  | "chapter"
  | "introduction"
  | "ingredients"
  | "tools"
  | "preparation"
  | "image_text"
  | "full_image"
  | "full_video"
  | "step_video"
  | "gallery"
  | "comparison"
  | "timer"
  | "temperature"
  | "checkpoint"
  | "ai_help"
  | "recommendations"
  | "discussion"
  | "submissions"
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
};

export type StoryCompletionConfig = {
  checklist?: StoryCheckpointItem[];
  continueLabel?: string;
  mismatchLabel?: string;
  mismatchAiPrompt?: string;
};

export const STORY_PAGE_TYPE_LABELS: Record<RecipeStoryPageType, string> = {
  cover: "封面",
  chapter: "章節開場",
  introduction: "介紹",
  ingredients: "材料",
  tools: "器具",
  preparation: "前置作業",
  image_text: "圖文",
  full_image: "全版圖片",
  full_video: "全版影片",
  step_video: "步驟影片",
  gallery: "多圖分鏡",
  comparison: "狀態比較",
  timer: "計時",
  temperature: "溫度",
  checkpoint: "完成檢查",
  ai_help: "AI 協助",
  recommendations: "商品推薦",
  discussion: "問題討論",
  submissions: "成品分享",
  completion: "完成",
  related: "相關食譜",
  storage: "保存方式",
  scale: "配方倍率",
};

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
    case "ai":
      return { page_type: "ai_help", layout_type: "checkpoint" };
    default:
      return { page_type: "introduction", layout_type: "split_image_text" };
  }
}

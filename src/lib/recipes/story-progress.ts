export type StoryProgressState = {
  pageIndex: number;
  guided: boolean;
  completedPageIds: string[];
  haveIds: string[];
  multiplier: number;
  muted: boolean;
  updatedAt: string;
};

const PREFIX = "sgb_story_progress_";

function key(recipeId: string) {
  return `${PREFIX}${recipeId}`;
}

export function loadStoryProgress(recipeId: string): StoryProgressState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(recipeId));
    if (!raw) return null;
    return JSON.parse(raw) as StoryProgressState;
  } catch {
    return null;
  }
}

export function saveStoryProgress(recipeId: string, state: StoryProgressState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      key(recipeId),
      JSON.stringify({ ...state, updatedAt: new Date().toISOString() })
    );
  } catch {
    /* ignore quota */
  }
}

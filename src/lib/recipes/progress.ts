const PREFIX = "chimei_recipe_progress:";

export type RecipeProgressState = {
  pageIndex: number;
  multiplier: number;
  haveIds: string[];
  cookMode: boolean;
  readingMode: "flip" | "full";
  updatedAt: string;
};

function key(recipeId: string) {
  return `${PREFIX}${recipeId}`;
}

export function loadRecipeProgress(recipeId: string): RecipeProgressState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(recipeId));
    if (!raw) return null;
    return JSON.parse(raw) as RecipeProgressState;
  } catch {
    return null;
  }
}

export function saveRecipeProgress(recipeId: string, state: RecipeProgressState) {
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

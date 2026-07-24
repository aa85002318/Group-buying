/** Recipe Story Book V3 — immersive reader feature flags */

export type RecipeReaderSettings = {
  /** Kindle-like fullscreen (no site chrome) */
  fullscreen: boolean;
  /** Inject / show table of contents */
  showToc: boolean;
  /** Per-step / per-page 我要提問 */
  showAskTeacher: boolean;
  /** Challenge page / section */
  showChallenge: boolean;
  /** Community gallery / my works */
  showGallery: boolean;
  /** Product recommendations page */
  showProducts: boolean;
  /** Caution popup instead of failure pages */
  showCautionPopup: boolean;
  /** Completion badge */
  showCompletionBadge: boolean;
  /** List primary CTA = 查看完整食譜 (?view=full) */
  listPrimaryFull: boolean;
  /** Allow public share on submissions */
  allowPublicShare: boolean;
  /** Allow private portfolio submissions */
  allowPrivateShare: boolean;
  /** Show public gallery wall under share form */
  showPublicWall: boolean;
};

export const DEFAULT_READER_SETTINGS: RecipeReaderSettings = {
  fullscreen: true,
  showToc: true,
  showAskTeacher: true,
  showChallenge: false,
  showGallery: true,
  showProducts: true,
  showCautionPopup: true,
  showCompletionBadge: false,
  listPrimaryFull: true,
  allowPublicShare: true,
  allowPrivateShare: true,
  showPublicWall: true,
};

export function parseReaderSettings(
  raw: unknown
): RecipeReaderSettings {
  const obj =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  return {
    fullscreen: obj.fullscreen !== false,
    showToc: obj.showToc !== false,
    showAskTeacher: obj.showAskTeacher !== false,
    showChallenge: Boolean(obj.showChallenge),
    showGallery: obj.showGallery !== false,
    showProducts: obj.showProducts !== false,
    showCautionPopup: obj.showCautionPopup !== false,
    showCompletionBadge: Boolean(obj.showCompletionBadge),
    listPrimaryFull: obj.listPrimaryFull !== false,
    allowPublicShare: obj.allowPublicShare !== false,
    allowPrivateShare: obj.allowPrivateShare !== false,
    showPublicWall: obj.showPublicWall !== false,
  };
}

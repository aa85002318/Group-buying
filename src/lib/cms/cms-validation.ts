import type { CmsBlock, CmsPage } from "@/types/cms";
import { isBlockAllowedOnPage } from "@/lib/cms/block-registry";

export type CmsValidationIssue = {
  level: "error" | "warning";
  code: string;
  message: string;
  blockId?: string;
};

export function validateCmsPageForPublish(page: CmsPage): CmsValidationIssue[] {
  const issues: CmsValidationIssue[] = [];

  if (!page.blocks.length) {
    issues.push({
      level: "warning",
      code: "empty_page",
      message: "頁面尚未加入任何區塊",
    });
  }

  const enabled = page.blocks.filter((b) => b.enabled);
  if (page.blocks.length > 0 && enabled.length === 0) {
    issues.push({
      level: "error",
      code: "all_hidden",
      message: "所有區塊皆已隱藏，無法發布空白頁面",
    });
  }

  for (const block of page.blocks) {
    const allow = isBlockAllowedOnPage(block.type, page.id);
    if (!allow.ok) {
      issues.push({
        level: "error",
        code: "block_not_allowed",
        message: `區塊「${block.name}」：${allow.reason}`,
        blockId: block.id,
      });
    }
    if (block.type === "hero_banner" || block.type === "promo_banner") {
      const img =
        (block.settings.image_url as string | undefined) ||
        (block.settings.desktop_image as string | undefined);
      if (block.enabled && !img && !block.settings.legacyKey) {
        issues.push({
          level: "warning",
          code: "missing_image",
          message: `區塊「${block.name}」可能缺少圖片`,
          blockId: block.id,
        });
      }
    }
  }

  return issues;
}

export function summarizeValidation(issues: CmsValidationIssue[]) {
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");
  return {
    errors,
    warnings,
    canPublish: errors.length === 0,
  };
}

export function validateBlockPlacement(
  pageId: string,
  block: CmsBlock
): CmsValidationIssue | null {
  const allow = isBlockAllowedOnPage(block.type, pageId);
  if (allow.ok) return null;
  return {
    level: "error",
    code: "block_not_allowed",
    message: allow.reason || "不適用",
    blockId: block.id,
  };
}

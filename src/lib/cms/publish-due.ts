import { publishDueScheduled as publishDueHomeLayout } from "@/lib/home/layout-versions";
import { groupBuyPageVersions } from "@/lib/group-buy/page-settings-versions";
import { shopLayoutVersions } from "@/lib/shop/layout-versions";

export type CmsPublishDueResult = {
  home: boolean;
  groupBuy: boolean;
  shop: boolean;
  errors: string[];
};

/** Apply any due CMS schedules (home + group-buy + shop layout). */
export async function publishAllDueCmsSchedules(): Promise<CmsPublishDueResult> {
  const result: CmsPublishDueResult = {
    home: false,
    groupBuy: false,
    shop: false,
    errors: [],
  };

  try {
    result.home = await publishDueHomeLayout();
  } catch (e) {
    result.errors.push(
      `home: ${e instanceof Error ? e.message : "排程發布失敗"}`
    );
  }

  try {
    result.groupBuy = await groupBuyPageVersions.publishDueScheduled();
  } catch (e) {
    result.errors.push(
      `group_buy: ${e instanceof Error ? e.message : "排程發布失敗"}`
    );
  }

  try {
    result.shop = await shopLayoutVersions.publishDueScheduled();
  } catch (e) {
    result.errors.push(
      `shop: ${e instanceof Error ? e.message : "排程發布失敗"}`
    );
  }

  return result;
}

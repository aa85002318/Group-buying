import {
  mergeShopLayoutSettings,
  type ShopLayoutSettings,
} from "@/lib/shop/layout-settings";
import {
  getShopLayoutSettings,
  saveShopLayoutSettings,
} from "@/lib/shop/layout-store";
import { createSettingsVersionStore } from "@/lib/cms/settings-versions";

export const shopLayoutVersions = createSettingsVersionStore<ShopLayoutSettings>({
  keys: {
    draftKey: "shop_layout_draft",
    historyKey: "shop_layout_history",
    scheduledKey: "shop_layout_scheduled",
  },
  loadLive: () => getShopLayoutSettings(),
  applyLive: async (snapshot, updatedBy) => {
    const result = await saveShopLayoutSettings(
      mergeShopLayoutSettings(snapshot),
      updatedBy
    );
    if (!result.ok) throw new Error(result.error);
  },
  clone: (v) => mergeShopLayoutSettings(v),
});

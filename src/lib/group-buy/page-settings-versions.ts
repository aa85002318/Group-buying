import {
  mergeGroupBuyPageSettings,
  type GroupBuyPageSettings,
} from "@/lib/group-buy/page-settings";
import {
  getGroupBuyPageSettings,
  saveGroupBuyPageSettings,
} from "@/lib/group-buy/settings-store";
import { createSettingsVersionStore } from "@/lib/cms/settings-versions";

export const groupBuyPageVersions = createSettingsVersionStore<GroupBuyPageSettings>({
  keys: {
    draftKey: "group_buy_page_draft",
    historyKey: "group_buy_page_history",
    scheduledKey: "group_buy_page_scheduled",
  },
  loadLive: () => getGroupBuyPageSettings(),
  applyLive: async (snapshot, updatedBy) => {
    const result = await saveGroupBuyPageSettings(
      mergeGroupBuyPageSettings(snapshot),
      updatedBy
    );
    if (!result.ok) throw new Error(result.error);
  },
  clone: (v) => mergeGroupBuyPageSettings(v),
});

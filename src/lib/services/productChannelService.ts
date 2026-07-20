import { createAdminClient } from "@/lib/supabase/admin";

export type ProductChannel = "website" | "group_buy" | "store_only" | "hidden";

export const PRODUCT_CHANNELS: ProductChannel[] = [
  "website",
  "group_buy",
  "store_only",
  "hidden",
];

/** Sync product_channels + publish_* flags from a channel list. Never removes product master. */
export async function syncProductChannels(
  productId: string,
  channels: ProductChannel[],
  enabled = true
) {
  const admin = createAdminClient();
  const unique = Array.from(new Set(channels));

  const publish_website = unique.includes("website");
  const publish_group_buy = unique.includes("group_buy");
  const publish_store = unique.includes("store_only") || publish_website || publish_group_buy;

  await admin
    .from("products")
    .update({ publish_website, publish_group_buy, publish_store })
    .eq("id", productId);

  // Disable all, then upsert enabled set
  await admin.from("product_channels").update({ is_enabled: false }).eq("product_id", productId);

  if (unique.length === 0) {
    await admin.from("product_channels").upsert(
      { product_id: productId, channel: "hidden", is_enabled: true },
      { onConflict: "product_id,channel" }
    );
    return;
  }

  for (const channel of unique) {
    await admin.from("product_channels").upsert(
      { product_id: productId, channel, is_enabled: enabled && channel !== "hidden" },
      { onConflict: "product_id,channel" }
    );
  }
}

export async function getProductIdsForChannel(channel: ProductChannel): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("product_channels")
    .select("product_id")
    .eq("channel", channel)
    .eq("is_enabled", true);
  return (data ?? []).map((r) => r.product_id as string);
}

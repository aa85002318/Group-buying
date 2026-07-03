import type { SupabaseClient } from "@supabase/supabase-js";

export async function fetchProductPickupStoreIds(
  client: SupabaseClient,
  productId: string
): Promise<string[]> {
  const { data } = await client
    .from("product_pickup_stores")
    .select("store_id")
    .eq("product_id", productId);
  return (data ?? []).map((r) => r.store_id as string);
}

export async function syncProductPickupStores(
  client: SupabaseClient,
  productId: string,
  storeIds: string[]
) {
  await client.from("product_pickup_stores").delete().eq("product_id", productId);
  if (storeIds.length === 0) return;

  const rows = storeIds.map((store_id) => ({ product_id: productId, store_id }));
  const { error } = await client.from("product_pickup_stores").insert(rows);
  if (error) throw new Error(error.message);
}

export async function attachPickupStoresToProducts<T extends { id: string }>(
  client: SupabaseClient,
  products: T[]
): Promise<Array<T & { pickup_store_ids: string[] }>> {
  if (products.length === 0) return [];

  const ids = products.map((p) => p.id);
  const { data } = await client
    .from("product_pickup_stores")
    .select("product_id, store_id")
    .in("product_id", ids);

  const map = new Map<string, string[]>();
  for (const row of data ?? []) {
    const list = map.get(row.product_id as string) ?? [];
    list.push(row.store_id as string);
    map.set(row.product_id as string, list);
  }

  return products.map((p) => ({
    ...p,
    pickup_store_ids: map.get(p.id) ?? [],
  }));
}

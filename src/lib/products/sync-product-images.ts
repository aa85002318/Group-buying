import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProductImageItem } from "@/lib/products/product-images";

/**
 * Replace product_images rows for a product. Soft-fails if table/columns missing.
 * Always keep products.image_url / images / content_images as source of truth for older clients.
 */
export async function syncProductImagesTable(
  admin: SupabaseClient,
  productId: string,
  opts: {
    mainUrl: string | null;
    galleryUrls: string[];
    content: ProductImageItem[];
  }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error: delErr } = await admin
      .from("product_images")
      .delete()
      .eq("product_id", productId);
    if (delErr) return { ok: false, error: delErr.message };

    const rows: Record<string, unknown>[] = [];
    if (opts.mainUrl) {
      rows.push({
        product_id: productId,
        image_url: opts.mainUrl,
        image_type: "main",
        alt_text: null,
        caption: null,
        width_mode: "full",
        sort_order: 0,
        is_cover: true,
        is_active: true,
      });
    }
    opts.galleryUrls.forEach((url, i) => {
      if (!url || url === opts.mainUrl) return;
      rows.push({
        product_id: productId,
        image_url: url,
        image_type: "gallery",
        alt_text: null,
        caption: null,
        width_mode: "full",
        sort_order: i,
        is_cover: false,
        is_active: true,
      });
    });
    opts.content.forEach((item, i) => {
      if (!item.url) return;
      rows.push({
        product_id: productId,
        image_url: item.url,
        image_type: "content",
        alt_text: item.alt_text || null,
        caption: item.caption || null,
        width_mode: item.width_mode || "full",
        sort_order: item.sort_order ?? i,
        is_cover: false,
        is_active: true,
      });
    });

    if (rows.length === 0) return { ok: true };

    const { error: insErr } = await admin.from("product_images").insert(rows);
    if (insErr) return { ok: false, error: insErr.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "sync failed" };
  }
}

export async function loadProductImagesRows(admin: SupabaseClient, productId: string) {
  try {
    const { data, error } = await admin
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

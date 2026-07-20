import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ProductBatch,
  ProductVariant,
  ProductVideo,
} from "@/lib/admin/product-form-v2";

export async function attachProductRelations(
  admin: SupabaseClient,
  products: Record<string, unknown>[]
) {
  if (products.length === 0) return products;

  try {
    const ids = products.map((p) => p.id as string);

    const [categoryLinks, videos, variants, batches] = await Promise.all([
      admin.from("product_category_links").select("product_id, category_id").in("product_id", ids),
      admin.from("product_videos").select("*").in("product_id", ids).order("sort_order"),
      admin.from("product_variants").select("*").in("product_id", ids).order("sort_order"),
      admin.from("product_batches").select("*").in("product_id", ids),
    ]);

    const categoriesByProduct = new Map<string, string[]>();
    for (const row of categoryLinks.data ?? []) {
      const list = categoriesByProduct.get(row.product_id) ?? [];
      list.push(row.category_id);
      categoriesByProduct.set(row.product_id, list);
    }

    const groupBy = <T extends { product_id: string }>(rows: T[]) => {
      const map = new Map<string, T[]>();
      for (const row of rows) {
        const list = map.get(row.product_id) ?? [];
        list.push(row);
        map.set(row.product_id, list);
      }
      return map;
    };

    const videosBy = groupBy(videos.data ?? []);
    const variantsBy = groupBy(variants.data ?? []);
    const batchesBy = groupBy(batches.data ?? []);

    return products.map((product) => ({
      ...product,
      category_ids: categoriesByProduct.get(product.id as string) ?? (
        product.category_id ? [product.category_id as string] : []
      ),
      videos: (videosBy.get(product.id as string) ?? []).map((v) => ({
        id: v.id as string,
        title: (v as { title?: string }).title ?? "",
        url: (v as { url: string }).url,
        video_type: (v as { video_type?: "youtube" | "mp4" }).video_type ?? "youtube",
        cover_url: (v as { cover_url?: string }).cover_url ?? "",
        sort_order: (v as { sort_order?: number }).sort_order ?? 0,
      })),
      variants: (variantsBy.get(product.id as string) ?? []).map((v) => ({
        id: v.id as string,
        name: (v as { name: string }).name,
        value: (v as { value: string }).value,
        price_adjustment: String((v as { price_adjustment?: number }).price_adjustment ?? 0),
        stock: (v as { stock?: number | null }).stock != null ? String((v as { stock: number }).stock) : "",
        sort_order: (v as { sort_order?: number }).sort_order ?? 0,
      })),
      batches: (batchesBy.get(product.id as string) ?? []).map((b) => ({
        id: b.id as string,
        batch_number: (b as { batch_number: string }).batch_number,
        expiry_date: (b as { expiry_date?: string }).expiry_date?.slice(0, 10) ?? "",
        arrival_date: (b as { arrival_date?: string }).arrival_date?.slice(0, 10) ?? "",
        supplier_id: (b as { supplier_id?: string }).supplier_id ?? "",
        quantity: String((b as { quantity?: number }).quantity ?? 0),
        note: (b as { note?: string }).note ?? "",
      })),
    }));
  } catch {
    return products.map((product) => ({
      ...product,
      category_ids: product.category_id ? [product.category_id as string] : [],
      videos: [],
      variants: [],
      batches: [],
    }));
  }
}

export async function syncProductCategories(
  admin: SupabaseClient,
  productId: string,
  categoryIds: string[]
) {
  await admin.from("product_category_links").delete().eq("product_id", productId);
  if (categoryIds.length === 0) return;

  await admin.from("product_category_links").insert(
    categoryIds.map((category_id, index) => ({
      product_id: productId,
      category_id,
      sort_order: index,
    }))
  );
}

export async function syncProductVideos(
  admin: SupabaseClient,
  productId: string,
  videos: ProductVideo[]
) {
  await admin.from("product_videos").delete().eq("product_id", productId);
  const rows = videos.filter((v) => v.url.trim());
  if (rows.length === 0) return;

  await admin.from("product_videos").insert(
    rows.map((video, index) => ({
      product_id: productId,
      title: video.title.trim() || null,
      url: video.url.trim(),
      video_type: video.video_type,
      cover_url: video.cover_url.trim() || null,
      sort_order: index,
    }))
  );
}

export async function syncProductVariants(
  admin: SupabaseClient,
  productId: string,
  variants: ProductVariant[]
) {
  await admin.from("product_variants").delete().eq("product_id", productId);
  const rows = variants.filter((v) => v.name.trim() && v.value.trim());
  if (rows.length === 0) return;

  await admin.from("product_variants").insert(
    rows.map((variant, index) => ({
      product_id: productId,
      name: variant.name.trim(),
      value: variant.value.trim(),
      price_adjustment: Number(variant.price_adjustment) || 0,
      stock: variant.stock ? Number(variant.stock) : null,
      sort_order: index,
    }))
  );
}

export async function syncProductBatches(
  admin: SupabaseClient,
  productId: string,
  batches: ProductBatch[]
) {
  await admin.from("product_batches").delete().eq("product_id", productId);
  const rows = batches.filter((b) => b.batch_number.trim());
  if (rows.length === 0) return;

  await admin.from("product_batches").insert(
    rows.map((batch) => ({
      product_id: productId,
      batch_number: batch.batch_number.trim(),
      expiry_date: batch.expiry_date || null,
      arrival_date: batch.arrival_date || null,
      supplier_id: batch.supplier_id || null,
      quantity: Number(batch.quantity) || 0,
      note: batch.note.trim() || null,
    }))
  );
}

export async function syncAllProductRelations(
  admin: SupabaseClient,
  productId: string,
  body: Record<string, unknown>
) {
  const categoryIds = Array.isArray(body.category_ids)
    ? (body.category_ids as string[])
    : body.category_id
      ? [body.category_id as string]
      : [];

  await syncProductCategories(admin, productId, categoryIds);

  if (Array.isArray(body.videos)) {
    await syncProductVideos(admin, productId, body.videos as ProductVideo[]);
  }
  if (Array.isArray(body.variants)) {
    await syncProductVariants(admin, productId, body.variants as ProductVariant[]);
  }
  if (Array.isArray(body.batches)) {
    await syncProductBatches(admin, productId, body.batches as ProductBatch[]);
  }
}

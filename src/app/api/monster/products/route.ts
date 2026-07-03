import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockOrders, mockProducts, mockOrderItems, MOCK_USER_ID } from "@/lib/mock-data";
import { monsterMockStore } from "@/lib/monster-mock";
import { SHAREABLE_ORDER_STATUSES } from "@/lib/services/monsterService";
import { createClient } from "@/lib/supabase/server";
import type { ShareableProduct } from "@/lib/types/database";

function buildShareableFromMock(userId: string): ShareableProduct[] {
  const shareable: ShareableProduct[] = [];
  const orders = mockOrders.filter(
    (o) =>
      o.user_id === userId &&
      SHAREABLE_ORDER_STATUSES.includes(o.status as (typeof SHAREABLE_ORDER_STATUSES)[number])
  );

  for (const order of orders) {
    const items =
      order.order_items ??
      mockOrderItems.filter((i) => i.order_id === order.id);
    for (const item of items) {
      const product = mockProducts.find((p) => p.id === item.product_id);
      const record = monsterMockStore.shareRecords.find(
        (r) =>
          r.user_id === userId &&
          r.order_id === order.id &&
          r.product_id === item.product_id
      );
      shareable.push({
        product_id: item.product_id,
        order_id: order.id,
        order_number: order.order_number,
        product_name: item.product_name,
        image_url: product?.image_url ?? null,
        unit_price: item.unit_price,
        quantity: item.quantity,
        share_status: record?.status ?? "available",
        share_record_id: record?.id,
      });
    }
  }
  return shareable;
}

export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return error;
  const userId = auth!.profile.id;

  if (!isSupabaseConfigured()) {
    const products =
      userId === MOCK_USER_ID ? buildShareableFromMock(userId) : [];
    return NextResponse.json({ products });
  }

  const supabase = await createClient();
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, order_number, status, order_items(product_id, product_name, unit_price, quantity)")
    .eq("user_id", userId)
    .in("status", [...SHAREABLE_ORDER_STATUSES]);

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  const { data: shareRecords } = await supabase
    .from("product_share_records")
    .select("id, order_id, product_id, status")
    .eq("user_id", userId);

  const recordMap = new Map(
    (shareRecords ?? []).map((r) => [`${r.order_id}:${r.product_id}`, r])
  );

  const productIds = new Set<string>();
  for (const order of orders ?? []) {
    for (const item of order.order_items ?? []) {
      productIds.add(item.product_id);
    }
  }

  const { data: productsData } = await supabase
    .from("products")
    .select("id, image_url")
    .in("id", Array.from(productIds));

  const imageMap = new Map((productsData ?? []).map((p) => [p.id, p.image_url]));

  const products: ShareableProduct[] = [];
  for (const order of orders ?? []) {
    for (const item of order.order_items ?? []) {
      const key = `${order.id}:${item.product_id}`;
      const record = recordMap.get(key);
      products.push({
        product_id: item.product_id,
        order_id: order.id,
        order_number: order.order_number,
        product_name: item.product_name,
        image_url: imageMap.get(item.product_id) ?? null,
        unit_price: item.unit_price,
        quantity: item.quantity,
        share_status: record?.status ?? "available",
        share_record_id: record?.id,
      });
    }
  }

  return NextResponse.json({ products });
}

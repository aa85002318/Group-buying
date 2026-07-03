import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import {
  getMockProductById,
  mockStore,
  MOCK_USER_ID,
} from "@/lib/mock-data";
import type { CommissionSourceType, Order, OrderItem, PaymentGateway, ShipmentMethod } from "@/lib/types/database";
import { generateOrderNumber } from "@/lib/utils";
import { createPickupCodeForOrder, generatePickupToken } from "@/lib/services/pickupService";
import { shippingFeeForMethod } from "@/lib/checkout/options";
import { recordInitialPayment } from "@/lib/services/paymentService";

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  groupBuyProductId?: string | null;
  groupBuyEventId?: string | null;
}

export interface CreateOrderInput {
  userId: string;
  storeId?: string | null;
  groupBuyEventId?: string | null;
  items: CreateOrderItemInput[];
  referralCode?: string | null;
  shareSourceType?: CommissionSourceType | null;
  shareSourceId?: string | null;
  livestreamId?: string | null;
  storeCreditUsed?: number;
  discount?: number;
  shippingFee?: number;
  notes?: string | null;
  paymentMethod?: PaymentGateway;
  shipmentMethod?: ShipmentMethod;
  recipientName?: string | null;
  recipientPhone?: string | null;
  customerEmail?: string | null;
  shippingAddress?: string | null;
  cvsStoreId?: string | null;
  couponCode?: string | null;
}

export interface PricedOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  groupBuyProductId?: string | null;
}

export class OrderError extends Error {
  constructor(
    message: string,
    public code: "OUT_OF_STOCK" | "INVALID_ITEM" | "PRICE_ERROR"
  ) {
    super(message);
    this.name = "OrderError";
  }
}

async function resolveUnitPrice(
  productId: string,
  groupBuyProductId?: string | null
): Promise<{ unitPrice: number; productName: string; stock: number }> {
  if (!isSupabaseConfigured()) {
    const product = getMockProductById(productId);
    if (!product) throw new OrderError("商品不存在", "INVALID_ITEM");
    let unitPrice = product.price;
    if (groupBuyProductId) {
      const gbp = mockStore.orders.length >= 0
        ? (await import("@/lib/mock-data")).mockGroupBuyProducts.find(
            (g) => g.id === groupBuyProductId
          )
        : null;
      if (gbp?.special_price) unitPrice = gbp.special_price;
    }
    const stock = mockStore.productStock[productId] ?? product.stock;
    return { unitPrice, productName: product.name, stock };
  }

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("id, name, price, stock, is_active")
    .eq("id", productId)
    .single();

  if (!product || !product.is_active) {
    throw new OrderError("商品不存在或已下架", "INVALID_ITEM");
  }

  let unitPrice = Number(product.price);
  let stock = Number(product.stock);

  if (groupBuyProductId) {
    const { data: gbp } = await admin
      .from("group_buy_products")
      .select("group_price, stock_limit, sold_count")
      .eq("id", groupBuyProductId)
      .single();
    if (gbp) {
      unitPrice = Number(gbp.group_price);
      if (gbp.stock_limit != null) {
        stock = Math.max(0, Number(gbp.stock_limit) - Number(gbp.sold_count));
      }
    }
  }

  return { unitPrice, productName: product.name, stock };
}

export async function priceOrderItems(
  items: CreateOrderItemInput[]
): Promise<PricedOrderItem[]> {
  const priced: PricedOrderItem[] = [];

  for (const item of items) {
    const { unitPrice, productName, stock } = await resolveUnitPrice(
      item.productId,
      item.groupBuyProductId
    );

    if (stock < item.quantity) {
      throw new OrderError(`${productName} 庫存不足（剩餘 ${stock} 件）`, "OUT_OF_STOCK");
    }

    priced.push({
      productId: item.productId,
      productName,
      quantity: item.quantity,
      unitPrice,
      subtotal: unitPrice * item.quantity,
      groupBuyProductId: item.groupBuyProductId,
    });
  }

  return priced;
}

export async function createOrder(input: CreateOrderInput): Promise<Order & { order_items: OrderItem[] }> {
  const pricedItems = await priceOrderItems(input.items);
  const subtotal = pricedItems.reduce((sum, i) => sum + i.subtotal, 0);
  const discount = input.discount ?? 0;
  const storeCreditUsed = input.storeCreditUsed ?? 0;
  const shipmentMethod = input.shipmentMethod ?? "store_pickup";
  const shippingFee = input.shippingFee ?? shippingFeeForMethod(shipmentMethod);
  const totalAmount = Math.max(0, subtotal - discount - storeCreditUsed + shippingFee);
  const orderNumber = generateOrderNumber();
  const pickupToken = generatePickupToken();
  const now = new Date().toISOString();

  const noteParts = [input.notes?.trim()].filter(Boolean);
  if (input.couponCode?.trim()) {
    noteParts.push(`[優惠碼: ${input.couponCode.trim()}]`);
  }
  const combinedNotes = noteParts.length > 0 ? noteParts.join("\n") : null;

  if (!isSupabaseConfigured()) {
    const orderId = `order-${Date.now()}`;
    const orderItems: OrderItem[] = pricedItems.map((item, idx) => ({
      id: `oi-${orderId}-${idx}`,
      order_id: orderId,
      product_id: item.productId,
      product_name: item.productName,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
      created_at: now,
      updated_at: now,
    }));

    for (const item of pricedItems) {
      mockStore.productStock[item.productId] =
        (mockStore.productStock[item.productId] ?? 0) - item.quantity;
    }

    const order: Order & { order_items: OrderItem[] } = {
      id: orderId,
      order_number: orderNumber,
      order_no: orderNumber,
      pickup_token: pickupToken,
      payment_status: "unpaid",
      pickup_status: "pending",
      user_id: input.userId || MOCK_USER_ID,
      store_id: input.storeId ?? null,
      group_buy_event_id: input.groupBuyEventId ?? null,
      status: "awaiting_payment",
      subtotal,
      discount,
      shipping_fee: shippingFee,
      store_credit_used: storeCreditUsed,
      total_amount: totalAmount,
      referral_code: input.referralCode ?? null,
      share_source_type: input.shareSourceType ?? null,
      share_source_id: input.shareSourceId ?? null,
      livestream_id: input.livestreamId ?? null,
      notes: combinedNotes,
      created_at: now,
      updated_at: now,
      order_items: orderItems,
    };

    mockStore.orders.unshift(order);
    mockStore.orderItems.push(...orderItems);
    return order;
  }

  const admin = createAdminClient();

  for (const item of pricedItems) {
    const { data: product } = await admin
      .from("products")
      .select("stock, name")
      .eq("id", item.productId)
      .single();

    if (!product || Number(product.stock) < item.quantity) {
      throw new OrderError(`${product?.name ?? "商品"} 庫存不足`, "OUT_OF_STOCK");
    }
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("referrer_user_id")
    .eq("id", input.userId)
    .single();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      order_no: orderNumber,
      pickup_token: pickupToken,
      payment_status: "unpaid",
      pickup_status: "pending",
      user_id: input.userId,
      store_id: input.storeId ?? null,
      pickup_store_id: input.storeId ?? null,
      group_buy_event_id: input.groupBuyEventId ?? null,
      status: "awaiting_payment",
      subtotal,
      discount_amount: discount,
      store_credit_used: storeCreditUsed,
      shipping_fee: shippingFee,
      total_amount: totalAmount,
      referral_code: input.referralCode ?? null,
      share_source_type: input.shareSourceType ?? null,
      share_source_id: input.shareSourceId ?? null,
      livestream_id: input.livestreamId ?? null,
      referrer_user_id: profile?.referrer_user_id ?? null,
      notes: combinedNotes,
      customer_name: input.recipientName ?? null,
      customer_phone: input.recipientPhone ?? null,
      customer_email: input.customerEmail ?? null,
      payment_method: input.paymentMethod ?? "store_payment",
    })
    .select()
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message ?? "建立訂單失敗");
  }

  const orderItemsPayload = pricedItems.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    group_buy_product_id: item.groupBuyProductId ?? null,
    product_name: item.productName,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    subtotal: item.subtotal,
  }));

  const { data: orderItems, error: itemsError } = await admin
    .from("order_items")
    .insert(orderItemsPayload)
    .select();

  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    throw new Error(itemsError.message);
  }

  await createPickupCodeForOrder(order.id, pickupToken);

  await admin.from("shipments").insert({
    order_id: order.id,
    method: shipmentMethod,
    status: "pending",
    store_id: shipmentMethod === "store_pickup" ? input.storeId ?? null : null,
    recipient_name: input.recipientName ?? null,
    recipient_phone: input.recipientPhone ?? null,
    address: shipmentMethod === "home_delivery" ? input.shippingAddress ?? null : null,
    cvs_store_id: shipmentMethod === "cvs_pickup" ? input.cvsStoreId ?? null : null,
    tracking_no: null,
    carrier: null,
    notes: shipmentMethod !== "store_pickup" ? "物流串接預留" : null,
  });

  await recordInitialPayment({
    orderId: order.id,
    userId: input.userId,
    amount: totalAmount,
    gateway: input.paymentMethod ?? "store_cash",
  });

  for (const item of pricedItems) {
    const { error: rpcError } = await admin.rpc("decrement_product_stock", {
      p_product_id: item.productId,
      p_quantity: item.quantity,
    });
    if (rpcError) {
      const { data: p } = await admin.from("products").select("stock").eq("id", item.productId).single();
      if (p) {
        await admin
          .from("products")
          .update({ stock: Math.max(0, Number(p.stock) - item.quantity) })
          .eq("id", item.productId);
      }
    }

    if (item.groupBuyProductId) {
      const { data: gbp } = await admin
        .from("group_buy_products")
        .select("sold_count")
        .eq("id", item.groupBuyProductId)
        .single();
      if (gbp) {
        await admin
          .from("group_buy_products")
          .update({ sold_count: Number(gbp.sold_count) + item.quantity })
          .eq("id", item.groupBuyProductId);
      }
    }
  }

  return {
    ...order,
    discount: order.discount_amount ?? discount,
    order_items: orderItems ?? [],
  };
}

const ORDER_DETAIL_SELECT =
  "*, order_items(*), pickup_store:stores!orders_pickup_store_id_fkey(name, address, phone), shipments(*, shipment_store:stores!shipments_store_id_fkey(name, address)), payments(*)";

const ORDER_LIST_SELECT =
  "*, order_items(*), pickup_store:stores!orders_pickup_store_id_fkey(name, address), shipments(method, status), payments(gateway, status)";

function normalizeOrderRow<T extends Record<string, unknown>>(row: T) {
  const pickupStore = row.pickup_store as Record<string, unknown> | null | undefined;
  const shipments = Array.isArray(row.shipments)
    ? (row.shipments as Record<string, unknown>[]).map((s) => ({
        ...s,
        stores: (s.shipment_store as Record<string, unknown> | undefined) ?? s.stores ?? null,
      }))
    : row.shipments;

  return {
    ...row,
    shipments,
    stores: pickupStore ?? row.stores ?? null,
    discount: (row.discount_amount as number | undefined) ?? (row.discount as number | undefined) ?? 0,
  };
}

export async function getOrderById(orderId: string, userId?: string) {
  if (!isSupabaseConfigured()) {
    const order = mockStore.orders.find((o) => o.id === orderId);
    if (!order) return null;
    if (userId && order.user_id !== userId) return null;
    return {
      ...order,
      order_items: mockStore.orderItems.filter((i) => i.order_id === orderId),
    };
  }

  const supabase = await createClient();
  let query = supabase.from("orders").select(ORDER_DETAIL_SELECT).eq("id", orderId);

  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query.single();
  if (error || !data) return null;
  return normalizeOrderRow(data);
}

export async function getMyOrders(userId: string) {
  if (!isSupabaseConfigured()) {
    return mockStore.orders.filter((o) => o.user_id === userId);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_LIST_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map((o) => normalizeOrderRow(o));
}

export function generateOrderNo(): string {
  return generateOrderNumber();
}

export { generatePickupToken } from "@/lib/services/pickupService";

export async function getAdminOrders() {
  if (!isSupabaseConfigured()) {
    return mockStore.orders;
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select(
      "*, profiles!orders_user_id_fkey(full_name, email, phone), order_items(*), pickup_store:stores!orders_pickup_store_id_fkey(name, address)"
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((o) => normalizeOrderRow(o));
}

export async function getStaffOrders(staffStoreId: string) {
  if (!isSupabaseConfigured()) {
    return mockStore.orders.filter((o) => o.store_id === staffStoreId || o.pickup_store_id === staffStoreId);
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("*, profiles!orders_user_id_fkey(full_name, phone), order_items(product_name, quantity, subtotal)")
    .or(`pickup_store_id.eq.${staffStoreId},store_id.eq.${staffStoreId}`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateOrderStatus(orderId: string, status: string) {
  if (!isSupabaseConfigured()) {
    const order = mockStore.orders.find((o) => o.id === orderId);
    if (!order) return null;
    order.status = status as Order["status"];
    order.updated_at = new Date().toISOString();
    return order;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select()
    .single();

  if (error) return null;
  return data;
}

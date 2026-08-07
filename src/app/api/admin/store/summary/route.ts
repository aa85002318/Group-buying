import { NextResponse } from "next/server";
import { requireStoreOps } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { daysFromNow, todayISO } from "@/lib/admin/store-ops";

const EMPTY = {
  staffName: "店長",
  metrics: {
    productCount: 0,
    batchCount: 0,
    expiringToday: 0,
    expiring7: 0,
    expiring30: 0,
    expiredOpen: 0,
    disposalMonthLoss: 0,
    openIssues: 0,
    openReturns: 0,
    lowStock: 0,
    outOfStock: 0,
    pendingRestock: 0,
    todayReceive: 0,
    lastBackupAt: null as string | null,
    pendingRequests: 0,
    pendingCustomerOrders: 0,
    pendingPriceInquiries: 0,
    unreadMessages: 0,
    unreadNotifications: 0,
  },
  ordersToday: {
    new: 0,
    paid: 0,
    readyPickup: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
  },
  todos: [] as Array<{ priority: number; label: string; href: string; count?: number }>,
  checklist: [] as Array<{
    id: string;
    label: string;
    href?: string | null;
    is_done?: boolean;
  }>,
  tomorrowChecklist: [] as Array<{
    id: string;
    label: string;
    href?: string | null;
    is_done?: boolean;
  }>,
  requests: [] as Array<Record<string, unknown>>,
  customerRequests: [] as Array<Record<string, unknown>>,
  messages: [] as Array<Record<string, unknown>>,
  workLogs: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  activity: [] as Array<{
    id: string;
    at: string;
    label: string;
    href?: string;
  }>,
};

export async function GET() {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  const staffName =
    (auth?.profile as { full_name?: string | null } | undefined)?.full_name?.trim() || "店長";

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ...EMPTY, staffName });
  }

  const admin = createAdminClient();
  const today = todayISO();
  const in7 = daysFromNow(7);
  const in30 = daysFromNow(30);
  const in3 = daysFromNow(3);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const dayStart = `${today}T00:00:00.000Z`;
  const dayEnd = `${today}T23:59:59.999Z`;

  const [
    products,
    batches,
    expToday,
    exp7,
    exp30,
    expired,
    disposals,
    issues,
    returns,
    lowStockRows,
    backup,
    ordersTodayRows,
    readyPickup,
    todayReceive,
  ] = await Promise.all([
    admin.from("products").select("id", { count: "exact", head: true }).eq("publish_store", true),
    admin.from("store_batches").select("id", { count: "exact", head: true }),
    admin
      .from("store_batches")
      .select("id", { count: "exact", head: true })
      .eq("expiry_date", today)
      .eq("status", "active"),
    admin
      .from("store_batches")
      .select("id", { count: "exact", head: true })
      .gte("expiry_date", today)
      .lte("expiry_date", in7)
      .eq("status", "active"),
    admin
      .from("store_batches")
      .select("id", { count: "exact", head: true })
      .gte("expiry_date", today)
      .lte("expiry_date", in30)
      .eq("status", "active"),
    admin
      .from("store_batches")
      .select("id", { count: "exact", head: true })
      .lt("expiry_date", today)
      .eq("status", "active"),
    admin
      .from("store_disposals")
      .select("total_loss, quantity, unit_cost")
      .gte("created_at", monthStart.toISOString()),
    admin
      .from("store_anomalies")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "processing", "pending", "notified_vendor", "vendor_collected"]),
    admin
      .from("store_returns")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "approved", "pending", "awaiting_vendor"]),
    admin.from("products").select("id, stock, safety_stock").eq("is_active", true).limit(800),
    admin
      .from("store_backup_logs")
      .select("created_at, status, finished_at")
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from("orders").select("id, status").gte("created_at", dayStart).lte("created_at", dayEnd),
    admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "ready_for_pickup"),
    admin
      .from("store_batches")
      .select("id", { count: "exact", head: true })
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd),
  ]);

  const disposalLoss = (disposals.data ?? []).reduce((s, d) => {
    const loss =
      d.total_loss != null
        ? Number(d.total_loss)
        : Number(d.quantity ?? 0) * Number(d.unit_cost ?? 0);
    return s + loss;
  }, 0);

  const stockRows = lowStockRows.data ?? [];
  const outOfStock = stockRows.filter((p) => Number(p.stock ?? 0) <= 0).length;
  const low = stockRows.filter((p) => {
    const safety = Number(p.safety_stock ?? 0);
    const stock = Number(p.stock ?? 0);
    if (stock <= 0) return false;
    return safety > 0 ? stock < safety : stock <= 5;
  }).length;
  const pendingRestock = Math.min(low, Math.max(0, Math.ceil(low * 0.4)));

  const ordersToday = {
    new: 0,
    paid: 0,
    readyPickup: readyPickup.count ?? 0,
    completed: 0,
    cancelled: 0,
    total: (ordersTodayRows.data ?? []).length,
  };
  for (const o of ordersTodayRows.data ?? []) {
    const s = String(o.status ?? "");
    if (s === "pending" || s === "awaiting_payment" || s === "payment_reported") {
      ordersToday.new += 1;
    } else if (s === "payment_confirmed" || s === "preparing") {
      ordersToday.paid += 1;
    } else if (s === "ready_for_pickup") {
      /* counted in readyPickup open queue; also count in today if created today */
      /* already in readyPickup total */
    } else if (s === "completed") {
      ordersToday.completed += 1;
    } else if (s === "cancelled" || s === "refunded") {
      ordersToday.cancelled += 1;
    }
  }

  const todos: Array<{ priority: number; label: string; href: string; count?: number }> = [];
  if ((expired.count ?? 0) > 0) {
    todos.push({
      priority: 1,
      label: "已過期批次尚未處理",
      href: "/admin/store/expiry?range=expired",
      count: expired.count ?? 0,
    });
  }

  const { count: exp3 } = await admin
    .from("store_batches")
    .select("id", { count: "exact", head: true })
    .gte("expiry_date", today)
    .lte("expiry_date", in3)
    .eq("status", "active");

  if ((exp3 ?? 0) > 0) {
    todos.push({
      priority: 2,
      label: "3 天內到期批次",
      href: "/admin/store/expiry?range=3",
      count: exp3 ?? 0,
    });
  }
  if (low > 0) {
    todos.push({
      priority: 3,
      label: "低於安全庫存",
      href: "/admin/store/inventory",
      count: low,
    });
  }
  if ((issues.count ?? 0) > 0) {
    todos.push({
      priority: 4,
      label: "待確認異常",
      href: "/admin/store/issues?status=open",
      count: issues.count ?? 0,
    });
  }
  if ((returns.count ?? 0) > 0) {
    todos.push({
      priority: 5,
      label: "待完成退貨",
      href: "/admin/store/returns?status=open",
      count: returns.count ?? 0,
    });
  }
  if ((readyPickup.count ?? 0) > 0) {
    todos.push({
      priority: 0,
      label: "待取貨訂單",
      href: "/admin/orders?status=ready_for_pickup",
      count: readyPickup.count ?? 0,
    });
  }
  if (!backup.data) {
    todos.push({
      priority: 6,
      label: "Google Drive 尚未備份",
      href: "/admin/store/backups",
    });
  }

  todos.sort((a, b) => a.priority - b.priority);

  const { data: store } = await admin
    .from("stores")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  const storeId = store?.id ?? null;

  let checklist: Array<{
    id: string;
    label: string;
    href?: string | null;
    is_done?: boolean;
  }> = [];
  let tomorrowChecklist: Array<{
    id: string;
    label: string;
    href?: string | null;
    is_done?: boolean;
  }> = [];
  let requests: Array<Record<string, unknown>> = [];
  let customerRequests: Array<Record<string, unknown>> = [];
  let messages: Array<Record<string, unknown>> = [];
  let workLogs: Array<Record<string, unknown>> = [];
  let pendingRequests = 0;
  let pendingCustomerOrders = 0;
  let pendingPriceInquiries = 0;
  let unreadMessages = 0;
  let unreadNotifications = 0;
  let notifications: Array<Record<string, unknown>> = [];
  const activity: Array<{ id: string; at: string; label: string; href?: string }> = [];

  if (storeId) {
    await admin.rpc("ensure_store_daily_todos", { p_store_id: storeId, p_date: today });
    const tomorrow = daysFromNow(1);
    await admin.rpc("ensure_store_daily_todos", { p_store_id: storeId, p_date: tomorrow });

    const userId = auth!.profile.id;
    const {
      getMessageUnreadCount,
      getNotificationUnreadCount,
    } = await import("@/lib/admin/store-notifications");

    const [
      todoRows,
      tomorrowRows,
      reqRows,
      msgRows,
      logRows,
      pendingCount,
      notifRows,
    ] = await Promise.all([
      admin
        .from("store_todos")
        .select("id, label, href, is_done, sort_order")
        .eq("store_id", storeId)
        .eq("todo_date", today)
        .order("sort_order", { ascending: true }),
      admin
        .from("store_todos")
        .select("id, label, href, is_done, sort_order")
        .eq("store_id", storeId)
        .eq("todo_date", tomorrow)
        .order("sort_order", { ascending: true }),
      admin
        .from("store_requests")
        .select("*, products(id, name, sku)")
        .eq("store_id", storeId)
        .in("status", ["pending", "approved"])
        .order("created_at", { ascending: false })
        .limit(10),
      admin
        .from("store_messages")
        .select("*")
        .eq("store_id", storeId)
        .gte("created_at", dayStart)
        .lte("created_at", dayEnd)
        .order("created_at", { ascending: true })
        .limit(40),
      admin
        .from("store_work_logs")
        .select("*")
        .eq("store_id", storeId)
        .eq("log_date", today)
        .order("created_at", { ascending: false })
        .limit(10),
      admin
        .from("store_requests")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId)
        .eq("status", "pending"),
      admin
        .from("store_notifications")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

    void notifRows.error;
    notifications = notifRows.error
      ? []
      : ((notifRows.data ?? []) as Array<Record<string, unknown>>);

    unreadMessages = await getMessageUnreadCount(admin, { storeId, userId });
    unreadNotifications = await getNotificationUnreadCount(admin, storeId);

    // Soft-fail if customer-request tables are not yet available in an environment
    const [openCustomerRows, orderPending, inquiryPending] = await Promise.all([
      admin
        .from("store_customer_requests")
        .select(
          "id, request_type, customer_name, customer_phone, quantity, status, note, inquiry_body, created_at, products(name)"
        )
        .eq("store_id", storeId)
        .in("status", ["pending", "quoted", "notified"])
        .order("created_at", { ascending: false })
        .limit(12),
      admin
        .from("store_customer_requests")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId)
        .eq("request_type", "order")
        .in("status", ["pending", "quoted", "notified"]),
      admin
        .from("store_customer_requests")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId)
        .eq("request_type", "price_inquiry")
        .in("status", ["pending", "quoted", "notified"]),
    ]);

    void openCustomerRows.error;
    void orderPending.error;
    void inquiryPending.error;

    checklist = (todoRows.data ?? []).map((t) => ({
      id: t.id,
      label: t.label,
      href: t.href,
      is_done: Boolean(t.is_done),
    }));
    tomorrowChecklist = (tomorrowRows.data ?? []).map((t) => ({
      id: t.id,
      label: t.label,
      href: t.href,
      is_done: Boolean(t.is_done),
    }));
    requests = (reqRows.data ?? []) as Array<Record<string, unknown>>;
    customerRequests = openCustomerRows.error
      ? []
      : ((openCustomerRows.data ?? []) as Array<Record<string, unknown>>);
    messages = (msgRows.data ?? []) as Array<Record<string, unknown>>;
    workLogs = (logRows.data ?? []) as Array<Record<string, unknown>>;
    pendingRequests = pendingCount.count ?? 0;
    pendingCustomerOrders = orderPending.error ? 0 : (orderPending.count ?? 0);
    pendingPriceInquiries = inquiryPending.error ? 0 : (inquiryPending.count ?? 0);

    for (const row of requests.slice(0, 5)) {
      const productName =
        (row.products as { name?: string } | null)?.name ||
        String(row.product_label ?? "未指定商品");
      activity.push({
        id: `req-${String(row.id)}`,
        at: String(row.created_at ?? ""),
        label: `${String(row.requested_by_name ?? "分店")}提出需求：${productName}`,
        href: "/admin/store/demand",
      });
    }
    for (const row of customerRequests.slice(0, 5)) {
      const typeLabel = row.request_type === "price_inquiry" ? "價格詢問" : "商品訂購";
      activity.push({
        id: `csr-${String(row.id)}`,
        at: String(row.created_at ?? ""),
        label: `${typeLabel}：${String(row.customer_name ?? "客戶")}`,
        href: "/admin/store/pos",
      });
    }
    for (const row of messages.slice(-5)) {
      activity.push({
        id: `msg-${String(row.id)}`,
        at: String(row.created_at ?? ""),
        label: `${String(row.author_name ?? "門市")}留言`,
        href: "/admin/store#messages",
      });
    }
    for (const row of notifications.filter((n) => !n.is_read).slice(0, 5)) {
      activity.push({
        id: `ntf-${String(row.id)}`,
        at: String(row.created_at ?? ""),
        label: String(row.title ?? "跨店通知"),
        href: String(row.href ?? "/admin/store#notifications"),
      });
    }
    activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    if (unreadNotifications > 0) {
      todos.unshift({
        priority: 0,
        label: "跨店未讀通知",
        href: "/admin/store#notifications",
        count: unreadNotifications,
      });
      todos.sort((a, b) => a.priority - b.priority);
    }
    if (pendingRequests > 0) {
      todos.unshift({
        priority: 0,
        label: "待審核叫貨需求",
        href: "/admin/store#requests",
        count: pendingRequests,
      });
      todos.sort((a, b) => a.priority - b.priority);
    }
    if (pendingCustomerOrders + pendingPriceInquiries > 0) {
      todos.unshift({
        priority: 0,
        label: "待處理客戶服務",
        href: "/admin/store/pos",
        count: pendingCustomerOrders + pendingPriceInquiries,
      });
      todos.sort((a, b) => a.priority - b.priority);
    }
  }

  return NextResponse.json({
    staffName,
    metrics: {
      productCount: products.count ?? 0,
      batchCount: batches.count ?? 0,
      expiringToday: expToday.count ?? 0,
      expiring7: exp7.count ?? 0,
      expiring30: exp30.count ?? 0,
      expiredOpen: expired.count ?? 0,
      disposalMonthLoss: disposalLoss,
      openIssues: issues.count ?? 0,
      openReturns: returns.count ?? 0,
      lowStock: low,
      outOfStock,
      pendingRestock: Math.max(pendingRestock, pendingRequests),
      todayReceive: todayReceive.count ?? 0,
      lastBackupAt: backup.data?.finished_at ?? backup.data?.created_at ?? null,
      pendingRequests,
      pendingCustomerOrders,
      pendingPriceInquiries,
      unreadMessages,
      unreadNotifications,
    },
    ordersToday,
    todos,
    checklist,
    tomorrowChecklist,
    requests,
    customerRequests,
    messages,
    workLogs,
    notifications,
    activity: activity.slice(0, 12),
  });
}

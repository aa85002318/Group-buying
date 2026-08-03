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
  checklist: [
    { id: "order", label: "點貨", href: "/admin/store/batches?receive=1" },
    { id: "fridge", label: "清冰箱", href: "/admin/store/expiry" },
    { id: "cream", label: "補奶油", href: "/admin/store/inventory" },
    { id: "returns", label: "清退貨", href: "/admin/store/returns" },
    { id: "labels", label: "更新價格牌", href: "/admin/products/labels" },
  ],
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
      .in("status", ["open", "processing"]),
    admin
      .from("store_returns")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "approved"]),
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
      pendingRestock,
      todayReceive: todayReceive.count ?? 0,
      lastBackupAt: backup.data?.finished_at ?? backup.data?.created_at ?? null,
    },
    ordersToday,
    todos,
    checklist: EMPTY.checklist,
  });
}

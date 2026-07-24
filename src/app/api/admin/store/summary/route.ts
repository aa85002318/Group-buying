import { NextResponse } from "next/server";
import { requireStoreOps } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { daysFromNow, todayISO } from "@/lib/admin/store-ops";

export async function GET() {
  const { error } = await requireStoreOps();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      metrics: {
        productCount: 0,
        batchCount: 0,
        expiring7: 0,
        expiring30: 0,
        expiredOpen: 0,
        disposalMonthLoss: 0,
        openIssues: 0,
        openReturns: 0,
        lowStock: 0,
        lastBackupAt: null,
      },
      todos: [],
    });
  }

  const admin = createAdminClient();
  const today = todayISO();
  const in7 = daysFromNow(7);
  const in30 = daysFromNow(30);
  const in3 = daysFromNow(3);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    products,
    batches,
    exp7,
    exp30,
    expired,
    disposals,
    issues,
    returns,
    lowStock,
    backup,
  ] = await Promise.all([
    admin.from("products").select("id", { count: "exact", head: true }).eq("publish_store", true),
    admin.from("store_batches").select("id", { count: "exact", head: true }),
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
    admin
      .from("products")
      .select("id, stock, safety_stock")
      .eq("is_active", true)
      .limit(500),
    admin
      .from("store_backup_logs")
      .select("created_at, status, finished_at")
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const disposalLoss = (disposals.data ?? []).reduce((s, d) => {
    const loss =
      d.total_loss != null
        ? Number(d.total_loss)
        : Number(d.quantity ?? 0) * Number(d.unit_cost ?? 0);
    return s + loss;
  }, 0);

  const low = (lowStock.data ?? []).filter((p) => {
    const safety = Number(p.safety_stock ?? 0);
    const stock = Number(p.stock ?? 0);
    return safety > 0 ? stock < safety : stock <= 5;
  }).length;

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
      label: "低於安全庫存（彙總）",
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
  if (!backup.data) {
    todos.push({
      priority: 6,
      label: "Google Drive 尚未備份",
      href: "/admin/store/backups",
    });
  }

  todos.sort((a, b) => a.priority - b.priority);

  return NextResponse.json({
    metrics: {
      productCount: products.count ?? 0,
      batchCount: batches.count ?? 0,
      expiring7: exp7.count ?? 0,
      expiring30: exp30.count ?? 0,
      expiredOpen: expired.count ?? 0,
      disposalMonthLoss: disposalLoss,
      openIssues: issues.count ?? 0,
      openReturns: returns.count ?? 0,
      lowStock: low,
      lastBackupAt: backup.data?.finished_at ?? backup.data?.created_at ?? null,
    },
    todos,
  });
}

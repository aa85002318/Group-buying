import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUILTIN_TEMPLATES, type LabelProduct } from "@/lib/admin/product-labels";

const PRODUCT_SELECT =
  "id, name, barcode, sku, unit, specifications, weight_grams, price, sale_price, original_price, msrp, website_price, vip_price, is_active, status, brand_id, supplier_name, created_at, brands(name), product_categories(name)";

function mapProduct(row: Record<string, unknown>): LabelProduct {
  const brands = row.brands as { name?: string } | null;
  const cats = row.product_categories as { name?: string } | null;
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    barcode: (row.barcode as string | null) ?? null,
    sku: (row.sku as string | null) ?? null,
    unit: (row.unit as string | null) ?? null,
    specifications: (row.specifications as string | null) ?? null,
    weight_grams: row.weight_grams != null ? Number(row.weight_grams) : null,
    price: Number(row.price ?? 0),
    sale_price: row.sale_price != null ? Number(row.sale_price) : null,
    original_price: row.original_price != null ? Number(row.original_price) : null,
    msrp: row.msrp != null ? Number(row.msrp) : null,
    website_price: row.website_price != null ? Number(row.website_price) : null,
    vip_price: row.vip_price != null ? Number(row.vip_price) : null,
    is_active: Boolean(row.is_active),
    status: (row.status as string | null) ?? null,
    brand_id: (row.brand_id as string | null) ?? null,
    brand_name: brands?.name ?? null,
    category_name: cats?.name ?? null,
    supplier_name: (row.supplier_name as string | null) ?? null,
    created_at: (row.created_at as string | null) ?? null,
  };
}

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") ?? "search";

  if (!isSupabaseConfigured()) {
    if (mode === "templates") {
      return NextResponse.json({ templates: BUILTIN_TEMPLATES });
    }
    return NextResponse.json({ products: [] });
  }

  const admin = createAdminClient();

  if (mode === "templates") {
    const { data, error: tplErr } = await admin
      .from("label_templates")
      .select("*")
      .order("sort_order", { ascending: true });
    if (tplErr) {
      // Table may not exist yet — fall back to builtins
      return NextResponse.json({ templates: BUILTIN_TEMPLATES, warning: tplErr.message });
    }
    if (!data?.length) {
      return NextResponse.json({ templates: BUILTIN_TEMPLATES });
    }
    return NextResponse.json({ templates: data });
  }

  const search = (searchParams.get("search") ?? "").trim();
  const brandId = searchParams.get("brand_id");
  const categoryId = searchParams.get("category_id");
  const supplier = (searchParams.get("supplier") ?? "").trim();
  const activeOnly = searchParams.get("active") === "1";
  const recentDays = Number(searchParams.get("recent_days") ?? 0);
  const idsParam = searchParams.get("ids");
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 40)));

  let query = admin
    .from("products")
    .select(PRODUCT_SELECT)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (idsParam) {
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length) query = query.in("id", ids);
  }

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,barcode.ilike.%${search}%,sku.ilike.%${search}%`
    );
  }
  if (brandId) query = query.eq("brand_id", brandId);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (supplier) query = query.ilike("supplier_name", `%${supplier}%`);
  if (activeOnly) query = query.eq("is_active", true);
  if (recentDays > 0) {
    const since = new Date();
    since.setDate(since.getDate() - recentDays);
    query = query.gte("created_at", since.toISOString());
  }

  const { data, error: fetchError } = await query;
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  return NextResponse.json({
    products: (data ?? []).map((row) => mapProduct(row as Record<string, unknown>)),
  });
}

export async function POST(request: Request) {
  const { error: authError, auth } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json();
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) {
    return NextResponse.json({ error: "列印清單為空" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      job: {
        id: `job-${Date.now()}`,
        total_labels: items.reduce(
          (s: number, it: { copies?: number }) => s + Math.max(1, Number(it.copies ?? 1)),
          0
        ),
        status: "completed",
      },
    });
  }

  const admin = createAdminClient();
  const total = items.reduce(
    (s: number, it: { copies?: number }) => s + Math.max(1, Number(it.copies ?? 1)),
    0
  );

  const { data: job, error: jobErr } = await admin
    .from("print_jobs")
    .insert({
      template_id: body.template_id ?? null,
      printer_name: body.printer_name ?? null,
      print_mode: body.print_mode ?? "browser",
      status: "completed",
      printed_by: auth!.profile.id,
      printed_at: new Date().toISOString(),
      total_labels: total,
      width_mm: body.width_mm ?? null,
      height_mm: body.height_mm ?? null,
      paper_mode: body.paper_mode ?? "label",
      settings: body.settings ?? {},
    })
    .select("*")
    .single();

  if (jobErr) {
    // Soft-fail if migration not applied yet — still allow client print
    return NextResponse.json({
      job: null,
      warning: jobErr.message,
      total_labels: total,
    });
  }

  const rows = items.map(
    (it: {
      product_id: string;
      copies?: number;
      price_used?: number;
      compare_price?: number | null;
      price_source?: string;
    }) => ({
      job_id: job.id,
      product_id: it.product_id,
      quantity: 1,
      copies: Math.max(1, Number(it.copies ?? 1)),
      price_used: it.price_used ?? null,
      compare_price: it.compare_price ?? null,
      price_source: it.price_source ?? null,
    })
  );

  const { error: itemsErr } = await admin.from("print_job_items").insert(rows);
  if (itemsErr) {
    return NextResponse.json({ job, warning: itemsErr.message });
  }

  await logAudit(
    auth!.profile.id,
    "create",
    "print_job",
    job.id,
    null,
    { total_labels: total, item_count: items.length },
    request as never
  );

  return NextResponse.json({ job });
}

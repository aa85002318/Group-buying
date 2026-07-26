import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { getMockGroupBuyEventsWithProducts } from "@/lib/mock-data";
import { getGroupBuyPageSettings } from "@/lib/group-buy/settings-store";
import {
  computeGroupBuyRuntimeStatus,
  type GroupBuyRuntimeStatus,
  type GroupBuySort,
  type GroupBuyTab,
} from "@/lib/group-buy/page-settings";
import {
  getGroupBuyEventStatsMap,
  pickDisplayStat,
} from "@/lib/group-buy/stats";

export const dynamic = "force-dynamic";

type CampaignRow = Record<string, unknown> & {
  id: string;
  title: string;
  status: string;
  start_at: string;
  end_at: string;
  group_buy_products?: Array<{
    special_price?: number | null;
    sold_count?: number | null;
    products?: {
      name?: string | null;
      sku?: string | null;
      barcode?: string | null;
      brand_id?: string | null;
      price?: number | null;
      sale_price?: number | null;
      image_url?: string | null;
      specifications?: string | null;
    } | null;
  }> | null;
};

function firstProduct(row: CampaignRow) {
  return row.group_buy_products?.[0]?.products ?? null;
}

function resolvePrices(row: CampaignRow) {
  const gbp = row.group_buy_products?.[0];
  const product = gbp?.products;
  const groupPrice = Number(
    row.group_price ?? gbp?.special_price ?? product?.sale_price ?? product?.price ?? 0
  );
  const originalPrice = Number(row.original_price ?? product?.price ?? 0);
  return { groupPrice, originalPrice };
}

function matchesSearch(row: CampaignRow, q: string, fields: Record<string, boolean>) {
  if (!q) return true;
  const needle = q.toLowerCase();
  const product = firstProduct(row);
  const hay: string[] = [];
  if (fields.name !== false) {
    hay.push(row.title ?? "", product?.name ?? "");
  }
  if (fields.subtitle) hay.push(String(row.short_title ?? ""), String(row.description ?? ""));
  if (fields.keyword) hay.push(String(row.description ?? ""), String(row.category_label ?? ""));
  if (fields.sku) hay.push(product?.sku ?? "", product?.barcode ?? "");
  if (fields.brand) hay.push(String(row.category_label ?? ""));
  return hay.some((h) => h.toLowerCase().includes(needle));
}

function sortCampaigns(
  rows: Array<CampaignRow & { runtime_status: GroupBuyRuntimeStatus; groupPrice: number }>,
  sort: GroupBuySort
) {
  const copy = [...rows];
  switch (sort) {
    case "ending_soon":
      return copy.sort(
        (a, b) => new Date(a.end_at).getTime() - new Date(b.end_at).getTime()
      );
    case "newest":
      return copy.sort(
        (a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime()
      );
    case "popular":
      return copy.sort((a, b) => {
        const sa = (a.group_buy_products ?? []).reduce(
          (s, p) => s + Number(p.sold_count ?? 0),
          0
        );
        const sb = (b.group_buy_products ?? []).reduce(
          (s, p) => s + Number(p.sold_count ?? 0),
          0
        );
        return sb - sa;
      });
    case "price_asc":
      return copy.sort((a, b) => a.groupPrice - b.groupPrice);
    case "price_desc":
      return copy.sort((a, b) => b.groupPrice - a.groupPrice);
    case "recommended":
    default:
      return copy.sort((a, b) => {
        const fa = a.is_featured ? 1 : 0;
        const fb = b.is_featured ? 1 : 0;
        if (fb !== fa) return fb - fa;
        const so = Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0);
        if (so !== 0) return so;
        return new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime();
      });
  }
}

function tabMatch(status: GroupBuyRuntimeStatus, tab: GroupBuyTab) {
  if (tab === "all") return ["active", "ending_soon", "upcoming", "ended", "sold_out"].includes(status);
  if (tab === "active") return status === "active" || status === "ending_soon";
  return status === tab;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const settings = await getGroupBuyPageSettings();
  const statusParam = (searchParams.get("status") ?? settings.defaultTab) as GroupBuyTab;
  const sort = (searchParams.get("sort") ?? settings.defaultSort) as GroupBuySort;
  const search = (searchParams.get("search") ?? "").trim();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    48,
    Math.max(1, Number(searchParams.get("pageSize") ?? settings.pageSizeDesktop))
  );
  const section = searchParams.get("section"); // ending_soon | upcoming | list
  const category = (searchParams.get("category") ?? "").trim();
  const fulfillment = (searchParams.get("fulfillment") ?? "").trim();

  // Block disabled tabs from URL forcing
  const effectiveStatus: GroupBuyTab =
    settings.enabledTabs.includes(statusParam) ? statusParam : settings.defaultTab;

  let raw: CampaignRow[] = [];

  if (!isSupabaseConfigured()) {
    raw = getMockGroupBuyEventsWithProducts() as unknown as CampaignRow[];
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("group_buy_events")
      .select("*, group_buy_products(*, products(*)), stores(name, address)")
      .in("status", ["active", "ended", "draft"])
      .order("start_at", { ascending: false });

    if (error) {
      // Soft fallback without optional columns
      const fallback = await supabase
        .from("group_buy_events")
        .select("*, group_buy_products(*, products(*)), stores(name, address)")
        .eq("status", "active")
        .order("start_at", { ascending: false });
      if (fallback.error) {
        return NextResponse.json({ error: fallback.error.message }, { status: 500 });
      }
      raw = (fallback.data ?? []) as CampaignRow[];
    } else {
      raw = (data ?? []) as CampaignRow[];
    }
  }

  const now = new Date();
  const eventIds = raw
    .filter((row) => row.status !== "draft" && row.status !== "cancelled")
    .map((row) => row.id);
  const statsMap = await getGroupBuyEventStatsMap(eventIds);

  const annotated = raw
    .filter((row) => row.status !== "draft" && row.status !== "cancelled")
    .filter((row) => {
      if (category && settings.enabledFilters.category) {
        if (String(row.category_label ?? "") !== category) return false;
      }
      if (fulfillment && settings.enabledFilters.fulfillment) {
        const opts = Array.isArray(row.fulfillment_options)
          ? (row.fulfillment_options as string[])
          : [];
        if (!opts.includes(fulfillment)) return false;
      }
      return true;
    })
    .map((row) => {
      const runtime_status = computeGroupBuyRuntimeStatus({
        status: row.status,
        start_at: row.start_at,
        end_at: row.end_at,
        endingSoonHours: settings.endingSoonHours,
        now,
      });
      const { groupPrice, originalPrice } = resolvePrices(row);
      const soldFallback = (row.group_buy_products ?? []).reduce(
        (s, p) => s + Number(p.sold_count ?? 0),
        0
      );
      const display = pickDisplayStat(
        statsMap.get(row.id),
        String(row.stats_mode ?? "orders"),
        soldFallback,
        {
          virtualSoldQty: Number(row.virtual_sold_qty ?? 0),
          showVirtualSalesLabel: row.show_virtual_sales_label !== false,
        }
      );
      const product = firstProduct(row);
      return {
        ...row,
        runtime_status,
        groupPrice,
        originalPrice,
        savings:
          originalPrice > groupPrice ? Math.round(originalPrice - groupPrice) : null,
        soldQuantity: display.hide ? 0 : display.soldQuantity,
        realSoldQuantity: display.hide ? 0 : display.realSoldQuantity,
        virtualSoldQuantity: display.hide ? 0 : display.virtualSoldQuantity,
        showVirtualLabel: display.showVirtualLabel,
        participantCount: display.hide ? 0 : display.participantCount,
        statsHidden: display.hide,
        productName: product?.name ?? row.title,
        productImage: product?.image_url ?? row.banner_url ?? null,
        productSpec: product?.specifications ?? null,
      };
    })
    .filter((row) => matchesSearch(row, search, settings.enabledSearchFields));

  const categories = Array.from(
    new Set(
      raw
        .map((r) => String(r.category_label ?? "").trim())
        .filter(Boolean)
    )
  ).sort();

  const activeCount = annotated.filter(
    (r) => r.runtime_status === "active" || r.runtime_status === "ending_soon"
  ).length;
  const endingSoonCount = annotated.filter((r) => r.runtime_status === "ending_soon").length;

  type Annotated = (typeof annotated)[number];
  let list: Annotated[] = annotated;

  if (section === "ending_soon") {
    list = annotated
      .filter((r) => r.runtime_status === "ending_soon")
      .sort((a, b) => new Date(a.end_at).getTime() - new Date(b.end_at).getTime())
      .slice(0, settings.endingSoonLimit);
  } else if (section === "upcoming") {
    const until = now.getTime() + settings.upcomingDays * 86400000;
    list = annotated
      .filter((r) => {
        if (r.runtime_status !== "upcoming") return false;
        const start = new Date(r.start_at).getTime();
        return start > now.getTime() && start <= until;
      })
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      .slice(0, settings.upcomingLimit);
  } else {
    list = sortCampaigns(
      annotated.filter((r) => tabMatch(r.runtime_status, effectiveStatus)),
      settings.enabledSorts.includes(sort) ? sort : settings.defaultSort
    ) as Annotated[];
  }

  const total = list.length;
  const startIdx = (page - 1) * pageSize;
  const pageItems = section ? list : list.slice(startIdx, startIdx + pageSize);

  return NextResponse.json({
    campaigns: pageItems,
    events: pageItems, // backward compatible
    meta: {
      total,
      page,
      pageSize,
      activeCount,
      endingSoonCount,
      status: effectiveStatus,
      sort,
      categories,
    },
  });
}

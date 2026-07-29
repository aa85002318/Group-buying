import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_BOTTOM = [
  { id: "b1", label: "首頁", iconKey: "home", href: "/", sortOrder: 10 },
  { id: "b2", label: "商城", iconKey: "products", href: "/products", sortOrder: 20 },
  { id: "b3", label: "團購", iconKey: "groupBuy", href: "/group-buy", sortOrder: 30 },
  { id: "b4", label: "AI", iconKey: "knowledge", href: "/ai", sortOrder: 40 },
  { id: "b5", label: "我的", iconKey: "account", href: "/profile", sortOrder: 50 },
];

export async function GET(
  _request: Request,
  context: { params: Promise<{ type: string }> }
) {
  const { type } = await context.params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      items: type === "bottom" ? DEFAULT_BOTTOM : [],
      source: "fallback",
    });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("brand_navigation_items")
      .select("*")
      .eq("navigation_type", type)
      .eq("enabled", true)
      .order("sort_order");

    if (error) throw error;

    const items = (data ?? []).map((row) => ({
      id: row.id,
      label: row.label,
      href: row.href,
      iconKey: row.icon_key,
      requiresAuth: row.requires_auth,
      mobileVisible: row.mobile_visible,
      desktopVisible: row.desktop_visible,
      enabled: row.enabled,
      sortOrder: row.sort_order,
    }));

    if (!items.length && type === "bottom") {
      return NextResponse.json({ items: DEFAULT_BOTTOM, source: "fallback" });
    }

    return NextResponse.json({ items, source: "cms" });
  } catch {
    return NextResponse.json({
      items: type === "bottom" ? DEFAULT_BOTTOM : [],
      source: "fallback",
    });
  }
}

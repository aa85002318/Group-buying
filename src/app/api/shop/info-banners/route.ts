import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_SHOP_INFO_BANNERS,
  mapCmsToInfoBanner,
  SHOP_CORPORATE_PLACEMENT,
  SHOP_ORDER_GUIDE_PLACEMENT,
  type ShopInfoBannerSlot,
} from "@/lib/shop/info-banners";

export const dynamic = "force-dynamic";

/** GET /api/shop/info-banners — order guide + corporate 5:2 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      order_guide: DEFAULT_SHOP_INFO_BANNERS.order_guide,
      corporate: DEFAULT_SHOP_INFO_BANNERS.corporate,
    });
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("cms_banners")
      .select("*")
      .in("placement", [SHOP_ORDER_GUIDE_PLACEMENT, SHOP_CORPORATE_PLACEMENT])
      .eq("is_active", true);

    const bySlot: Record<ShopInfoBannerSlot, ReturnType<typeof mapCmsToInfoBanner>> = {
      order_guide: DEFAULT_SHOP_INFO_BANNERS.order_guide,
      corporate: DEFAULT_SHOP_INFO_BANNERS.corporate,
    };

    for (const row of data ?? []) {
      const placement = String(row.placement ?? "");
      if (placement === SHOP_ORDER_GUIDE_PLACEMENT) {
        bySlot.order_guide = mapCmsToInfoBanner(row as Record<string, unknown>, "order_guide");
      }
      if (placement === SHOP_CORPORATE_PLACEMENT) {
        bySlot.corporate = mapCmsToInfoBanner(row as Record<string, unknown>, "corporate");
      }
    }

    return NextResponse.json(bySlot);
  } catch {
    return NextResponse.json({
      order_guide: DEFAULT_SHOP_INFO_BANNERS.order_guide,
      corporate: DEFAULT_SHOP_INFO_BANNERS.corporate,
    });
  }
}

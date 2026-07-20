import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPersonalizedRecommendations,
  getRecentlyViewed,
} from "@/lib/services/recommendationService";
import { mockProducts } from "@/lib/mock-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "for_you";
  const auth = await getAuthUser();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ products: mockProducts.slice(0, 8) });
  }

  const admin = createAdminClient();
  if (type === "recent" && auth) {
    const products = await getRecentlyViewed(admin, auth.profile.id, 8);
    return NextResponse.json({ products });
  }

  const products = await getPersonalizedRecommendations(admin, auth?.profile.id ?? null, 8);
  return NextResponse.json({ products });
}

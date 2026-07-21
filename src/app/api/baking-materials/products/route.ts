import { NextResponse } from "next/server";
import { parseBakingFiltersFromSearchParams, searchBakingProducts } from "@/lib/baking-materials/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseBakingFiltersFromSearchParams(searchParams);
  const categorySlug = searchParams.get("categorySlug")?.trim();
  if (categorySlug) filters.categorySlug = categorySlug;

  const result = await searchBakingProducts(filters);
  return NextResponse.json(result);
}

import { NextResponse } from "next/server";
import { INSPIRATION_WALL_CATEGORIES } from "@/lib/shop/inspiration-wall";

/** GET /api/shop/inspiration/categories */
export async function GET() {
  return NextResponse.json({ categories: INSPIRATION_WALL_CATEGORIES });
}

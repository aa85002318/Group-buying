import { NextResponse } from "next/server";
import { getBrandsForCatalog } from "@/lib/baking-materials/queries";

export async function GET() {
  const brands = await getBrandsForCatalog();
  return NextResponse.json({ brands });
}

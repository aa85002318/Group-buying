import { NextResponse } from "next/server";
import {
  getBakingMaterialCategories,
  getBakingMaterialRoot,
  getCategoryTree,
} from "@/lib/baking-materials/queries";

export async function GET() {
  const [root, categories] = await Promise.all([
    getBakingMaterialRoot(),
    getBakingMaterialCategories(),
  ]);

  return NextResponse.json({
    root,
    categories,
    tree: getCategoryTree(categories),
  });
}

import { NextResponse } from "next/server";
import { requireStoreOps } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { salesModeColumnExists } from "@/lib/products/sales-mode";

export const dynamic = "force-dynamic";

/**
 * 這個環境的商品功能支援度。
 *
 * 目前只回報一件事：資料庫有沒有 sales_mode 欄位（也就是詢價 migration 跑了沒）。
 * 後台用它決定要不要顯示「銷售方式」切換——沒跑 migration 的環境顯示出來
 * 也存不進去，不如直接說明白。
 */
export async function GET() {
  const { error } = await requireStoreOps();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ sales_mode: true });
  }

  return NextResponse.json({ sales_mode: await salesModeColumnExists() });
}

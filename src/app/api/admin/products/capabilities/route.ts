import { NextResponse } from "next/server";
import { requireStoreOps } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { quoteFileColumnsExist, salesModeColumnExists } from "@/lib/products/sales-mode";

export const dynamic = "force-dynamic";

/**
 * 這個環境支援哪些詢價相關功能（＝哪些 migration 跑過了）。
 *
 * 後台用它決定要不要顯示對應的控制項。沒跑 migration 的環境顯示出來也存不進去，
 * 讓人按了以為有用、結果看到資料庫錯誤，比直接說明白糟得多。
 */
export async function GET() {
  const { error } = await requireStoreOps();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ sales_mode: true, quote_file: true });
  }

  const [salesMode, quoteFile] = await Promise.all([
    salesModeColumnExists(),
    quoteFileColumnsExist(),
  ]);

  return NextResponse.json({ sales_mode: salesMode, quote_file: quoteFile });
}

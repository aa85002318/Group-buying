import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 「這個資料庫有沒有某個後加的欄位」的偵測。
 *
 * 為什麼需要：詢價功能加了幾個欄位和一張表，但不是每個環境都跑過 migration。
 * 最要命的是商品儲存——它會把整列寫回去，在沒有 sales_mode 欄位的資料庫寫這個
 * 欄位，整筆儲存會以 `column "sales_mode" of relation "products" does not exist`
 * 失敗，也就是後台連改商品名稱都不行。所以寫入前先問過這裡。
 *
 * 快取規則刻意不對稱：
 *   - 確認「有欄位」→ 永久記住（欄位不會自己消失）
 *   - 確認「沒欄位」→ 只在錯誤碼明確是 42703（undefined_column）時才記住
 *   - 其他錯誤（連線中斷、逾時…）→ 不記住，下次重新探
 *
 * 不這樣分的話，一次網路抽風就會讓這個程序之後都當作「沒有欄位」，
 * 於是在已經 migrate 的環境悄悄不再儲存銷售方式——那是會讓人找很久的 bug。
 */

/**
 * 「這個東西確定不存在」的錯誤碼。
 * 42703 = undefined_column、42P01 = undefined_table（PostgreSQL），
 * PGRST205 = PostgREST 在 schema cache 裡找不到這張表。
 * 只有這幾種才記住「沒有」，其餘（連線、逾時）不記住。
 */
const DEFINITELY_MISSING = new Set(["42703", "42P01", "PGRST205"]);

const cache = new Map<string, boolean>();

async function columnExists(table: string, column: string): Promise<boolean> {
  const key = `${table}.${column}`;
  const known = cache.get(key);
  if (known !== undefined) return known;

  try {
    const admin = createAdminClient();
    const probe = await admin.from(table).select(column).limit(1);

    if (!probe.error) {
      cache.set(key, true);
      return true;
    }
    if (DEFINITELY_MISSING.has(String(probe.error.code))) {
      cache.set(key, false);
      return false;
    }
    // 不確定是什麼問題，當作沒有（這次不寫），但不要記住。
    return false;
  } catch {
    return false;
  }
}

/** products.sales_mode 存在嗎（＝詢價 migration 跑了沒）。 */
export function salesModeColumnExists(): Promise<boolean> {
  return columnExists("products", "sales_mode");
}

/** quotations.quote_file_url 存在嗎（＝可否上傳自製報價單檔案）。 */
export function quoteFileColumnsExist(): Promise<boolean> {
  return columnExists("quotations", "quote_file_url");
}

/** corporate_inquiry_items 這張表存在嗎（＝前台能否送出詢價單）。 */
export function inquiryItemsTableExists(): Promise<boolean> {
  return columnExists("corporate_inquiry_items", "id");
}

/**
 * 環境不支援 sales_mode 時，把它從要寫入的資料列移除。
 * 支援的話原封不動回傳。
 */
export async function omitSalesModeIfUnsupported<T extends Record<string, unknown>>(
  row: T
): Promise<T> {
  if (!("sales_mode" in row)) return row;
  if (await salesModeColumnExists()) return row;
  const rest = { ...row };
  delete rest.sales_mode;
  return rest;
}

/** 測試用：清掉快取。 */
export function resetColumnCache() {
  cache.clear();
}

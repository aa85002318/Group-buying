import { createAdminClient } from "@/lib/supabase/admin";

/**
 * products.sales_mode 這個欄位的存在偵測。
 *
 * 為什麼需要：sales_mode 是後加的欄位，而商品儲存（新增／編輯）會把整列寫回去。
 * 在還沒跑 migration 的環境寫這個欄位，整筆儲存會以
 * `column "sales_mode" of relation "products" does not exist` 失敗——
 * 也就是後台連改商品名稱都不行。所以寫入前先問過這裡。
 *
 * 快取規則刻意不對稱：
 *   - 確認「有欄位」→ 永久記住（欄位不會自己消失）
 *   - 確認「沒欄位」→ 只在錯誤碼明確是 42703（undefined_column）時才記住
 *   - 其他錯誤（連線中斷、逾時…）→ 不記住，下次重新探
 *
 * 不這樣分的話，一次網路抽風就會讓這個程序之後都當作「沒有欄位」，
 * 於是在已經 migrate 的環境悄悄不再儲存銷售方式——那是會讓人找很久的 bug。
 */
let cached: boolean | null = null;

/** PostgreSQL 的 undefined_column。 */
const UNDEFINED_COLUMN = "42703";

export async function salesModeColumnExists(): Promise<boolean> {
  if (cached !== null) return cached;

  try {
    const admin = createAdminClient();
    const probe = await admin.from("products").select("sales_mode").limit(1);

    if (!probe.error) {
      cached = true;
      return true;
    }
    if (probe.error.code === UNDEFINED_COLUMN) {
      cached = false;
      return false;
    }
    // 不確定是什麼問題，當作沒有（這次不寫），但不要記住。
    return false;
  } catch {
    return false;
  }
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
export function resetSalesModeColumnCache() {
  cached = null;
}

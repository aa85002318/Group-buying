import { redirect } from "next/navigation";

/** 庫存頁改為分店商品需求／缺貨通知 */
export default function StoreInventoryRedirectPage() {
  redirect("/admin/store/demand");
}

import { redirect } from "next/navigation";

/** 退貨已併入異常／退貨統一入口 */
export default function StoreReturnsPage() {
  redirect("/admin/store/entry?type=issue_return");
}

import { redirect } from "next/navigation";

/** 團購活動改以文章管理（最新團購）呈現 */
export default function AdminGroupBuyRedirectPage() {
  redirect("/admin/articles?category=latest-group-buy");
}

import { redirect } from "next/navigation";

/** Placeholder — 商城頁面 CMS 下一階段；目前導向商城 Banner 管理. */
export default function AdminShopCmsPlaceholder() {
  redirect("/admin/banners?placement=shop_hero");
}

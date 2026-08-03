import { redirect } from "next/navigation";

/** Legacy catalog index — merged into /shop hub. */
export default function ShopCategoriesRedirectPage() {
  redirect("/shop");
}

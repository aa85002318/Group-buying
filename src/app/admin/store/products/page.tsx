import { redirect } from "next/navigation";

/** Store Ops V2: product catalog lives only in Product Master. */
export default function StoreProductsRedirectPage() {
  redirect("/admin/products");
}

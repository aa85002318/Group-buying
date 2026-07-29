import { redirect } from "next/navigation";

export default function AdminHomeFeaturedProductsPage() {
  redirect("/admin/home?section=popular_baking_products");
}

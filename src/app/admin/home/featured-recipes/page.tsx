import { redirect } from "next/navigation";

export default function AdminHomeFeaturedRecipesAlias() {
  redirect("/admin/home#latest_recipes");
}

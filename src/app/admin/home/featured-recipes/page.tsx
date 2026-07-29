import { redirect } from "next/navigation";

export default function AdminHomeFeaturedRecipesAlias() {
  redirect("/admin/home?section=latest_recipes");
}

import { redirect } from "next/navigation";

export default function AdminHomeFeaturedRecipesRedirect() {
  redirect("/admin/home?section=latest_recipes");
}

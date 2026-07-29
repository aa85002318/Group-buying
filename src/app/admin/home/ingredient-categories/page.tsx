import { redirect } from "next/navigation";

export default function AdminHomeIngredientCategoriesPage() {
  redirect("/admin/home?section=popular_categories");
}

import { redirect } from "next/navigation";

export default function StoreCategoriesRedirectPage() {
  redirect("/admin/categories");
}

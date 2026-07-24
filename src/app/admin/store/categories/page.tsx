import { redirect } from "next/navigation";

/** Categories managed under product master / categories — not a second store catalog. */
export default function StoreCategoriesRedirectPage() {
  redirect("/admin/categories");
}

import { redirect } from "next/navigation";

export default function AdminProductTagsPage() {
  redirect("/admin/categories?catalog=baking-materials");
}

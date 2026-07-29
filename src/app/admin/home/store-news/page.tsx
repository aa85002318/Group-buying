import { redirect } from "next/navigation";

export default function AdminHomeStoreNewsPage() {
  redirect("/admin/home?section=store_news");
}

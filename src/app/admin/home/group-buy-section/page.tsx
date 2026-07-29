import { redirect } from "next/navigation";

export default function AdminHomeGroupBuySectionPage() {
  redirect("/admin/home?section=closing_group_buys");
}

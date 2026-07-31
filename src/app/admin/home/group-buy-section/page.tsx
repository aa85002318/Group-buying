import { redirect } from "next/navigation";

export default function AdminHomeGroupBuySectionRedirect() {
  redirect("/admin/home?section=weekly_group_buys");
}

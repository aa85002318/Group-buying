import { redirect } from "next/navigation";

export default function AdminHomeServiceShortcutsPage() {
  redirect("/admin/home?section=service_shortcuts");
}

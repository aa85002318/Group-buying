import { redirect } from "next/navigation";

/** 已併入 /admin/home（首頁／CMS 管理） */
export default function AdminCmsRedirectPage() {
  redirect("/admin/home");
}

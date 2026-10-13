import { redirect } from "next/navigation";

/** 舊的網頁版版面設定 → 現在只有一份設定的前台內容編輯器 */
export default function AdminDesktopLayoutIndexRedirect() {
  redirect("/admin/page-builder");
}

import { redirect } from "next/navigation";

/** 麵包小怪獸後台已下線 */
export default function AdminMonsterPage() {
  redirect("/admin");
}

"use client";

import { useParams } from "next/navigation";
import { QuotationEditor } from "@/components/admin/quotations/QuotationEditor";

/**
 * 原本寫成 `const { id } = use(params)`，但這個專案是 Next 14.2——
 * client component 拿到的 params 是普通物件，不是 Promise。對普通物件呼叫
 * React 的 use() 會直接丟 error #438，整頁變成白畫面的 Application error，
 * 也就是任何一張已存在的報價單都打不開。
 *
 * 改用 useParams()，跟這個專案其他 [id] 頁面一致（orders、members、news…）。
 */
export default function AdminQuotationEditPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  return <QuotationEditor mode="edit" quotationId={id} />;
}

"use client";

import { use } from "react";
import { QuotationEditor } from "@/components/admin/quotations/QuotationEditor";

export default function AdminQuotationEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <QuotationEditor mode="edit" quotationId={id} />;
}

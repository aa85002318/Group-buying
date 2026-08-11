"use client";

import { useParams } from "next/navigation";
import OrderDetailPage from "@/app/(main)/orders/[id]/page";

export default function MemberOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  return <OrderDetailPage params={{ id: orderId }} />;
}

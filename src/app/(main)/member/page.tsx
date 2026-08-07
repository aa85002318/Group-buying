import type { Metadata } from "next";
import { MemberCenterClient } from "@/components/member/MemberCenterClient";

export const metadata: Metadata = {
  title: "CHIMEIDIY 我的",
  description: "數位會員卡、訂單狀態、本月會員好康與會員服務",
};

export default function MemberPage() {
  return <MemberCenterClient />;
}

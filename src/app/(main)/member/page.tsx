import type { Metadata } from "next";
import { MemberCenterClient } from "@/components/member/MemberCenterClient";

export const metadata: Metadata = {
  title: "CHIMEIDIY 會員中心",
  description: "會員條碼、發票載具、我的 App 訂單與會員日常服務",
};

export default function MemberPage() {
  return <MemberCenterClient />;
}

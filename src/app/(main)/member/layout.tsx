import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CHIMEIDIY 門市會員中心",
  description: "會員條碼、發票載具、訂單與收藏。線上與門市會員資料不自動合併。",
};

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return children;
}

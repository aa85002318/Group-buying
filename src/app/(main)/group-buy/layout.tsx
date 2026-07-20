import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CHIMEIDIY 團購｜限時開團與熱門商品",
  description: "今日開團、即將收單與熱門團購專區。",
};

export default function GroupBuyLayout({ children }: { children: React.ReactNode }) {
  return children;
}

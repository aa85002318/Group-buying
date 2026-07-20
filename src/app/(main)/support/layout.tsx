import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CHIMEIDIY 客服中心",
  description: "LINE、社群、電話、FAQ 與訂單問題協助。",
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}

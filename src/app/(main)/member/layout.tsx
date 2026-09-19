import type { Metadata } from "next";
import { MemberDesktopFrame } from "@/components/member/MemberDesktopFrame";

export const metadata: Metadata = {
  title: "CHIMEIDIY 我的",
  description: "數位會員卡、訂單、會員禮與會員日常服務",
};

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#FFFEFA]">
      <MemberDesktopFrame>{children}</MemberDesktopFrame>
    </div>
  );
}

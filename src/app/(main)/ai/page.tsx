import type { Metadata } from "next";
import { AiPageClient } from "./AiPageClient";

export const metadata: Metadata = {
  title: "AI 烘焙助手｜CHIMEIDIY",
  description: "材料推薦、份量換算與烘焙問題協助",
};

export default function AiPage() {
  return <AiPageClient />;
}

import type { Metadata } from "next";
import { AiToolsClient } from "./AiToolsClient";

export const metadata: Metadata = {
  title: "CHIMEIDIY AI 烘焙助手",
  description: "選產品、找食譜、用現有材料做甜點。規則引擎預覽，可串接 AI API。",
};

export default function AiToolsPage() {
  return <AiToolsClient />;
}

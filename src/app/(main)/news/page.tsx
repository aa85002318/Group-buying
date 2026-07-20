import type { Metadata } from "next";
import { NewsHubClient } from "./NewsHubClient";

export const metadata: Metadata = {
  title: "CHIMEIDIY 最新資訊",
  description: "新品、活動、門市公告、課程與系統公告。",
};

export default function NewsPage() {
  return <NewsHubClient />;
}

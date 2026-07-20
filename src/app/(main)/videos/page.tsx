import type { Metadata } from "next";
import VideosPageClient from "./VideosPageClient";

export const metadata: Metadata = {
  title: "CHIMEIDIY 烘焙影音｜短影音與完整教學",
  description: "一分鐘教你做、完整教學、直播回放與烘焙技巧。",
};

export default function VideosPage() {
  return <VideosPageClient />;
}

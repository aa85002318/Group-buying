import type { Metadata } from "next";
import { ChallengesHubClient } from "@/components/challenges/ChallengesHubClient";

export const metadata: Metadata = {
  title: "烘焙挑戰｜CHIMEIDIY",
  description: "參加每月烘焙挑戰，分享你的作品與靈感。",
};

export default function ChallengesPage() {
  return <ChallengesHubClient />;
}

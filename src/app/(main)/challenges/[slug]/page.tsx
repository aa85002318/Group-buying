import type { Metadata } from "next";
import { ChallengeDetailClient } from "@/components/challenges/ChallengeDetailClient";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "烘焙挑戰｜CHIMEIDIY",
    description: `查看烘焙挑戰 ${slug}`,
  };
}

export default async function ChallengeDetailPage({ params }: Props) {
  const { slug } = await params;
  return <ChallengeDetailClient slug={slug} />;
}

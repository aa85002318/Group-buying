import type { Metadata } from "next";
import { NewsDetailClient } from "@/components/news/NewsDetailClient";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "最新資訊｜CHIMEIDIY",
    description: `CHIMEIDIY 最新資訊：${slug}`,
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  return <NewsDetailClient slug={slug} />;
}

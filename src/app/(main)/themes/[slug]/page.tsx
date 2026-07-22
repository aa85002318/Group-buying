import type { Metadata } from "next";
import { ThemeDetailClient } from "@/components/themes/ThemeDetailClient";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "季節主題｜CHIMEIDIY",
    description: `查看季節主題 ${slug}`,
  };
}

export default async function ThemeDetailPage({ params }: Props) {
  const { slug } = await params;
  return <ThemeDetailClient slug={slug} />;
}

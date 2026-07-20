import type { Metadata } from "next";

export function buildPageMetadata(input: {
  title: string;
  description?: string;
  path?: string;
  image?: string | null;
  noindex?: boolean;
}): Metadata {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://shop.chimeidiygroupbuying.com";
  const title = input.title.includes("CHIMEIDIY") ? input.title : `${input.title}｜CHIMEIDIY 棋美點心屋`;
  const description = input.description ?? "CHIMEIDIY 棋美點心屋 — 團購、烘焙課程、直播與生活分享";
  const url = input.path ? `${site}${input.path}` : site;

  return {
    title,
    description,
    alternates: input.path ? { canonical: url } : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: "CHIMEIDIY",
      type: "website",
      images: input.image ? [{ url: input.image }] : undefined,
    },
    robots: input.noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

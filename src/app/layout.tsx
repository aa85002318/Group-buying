import type { Metadata, Viewport } from "next";
import { CapacitorShell } from "@/components/capacitor/CapacitorShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "CHIMEIDIY 團購",
  description: "CHIMEIDIY 棋美點心屋 — 團購、直播、烘焙課程與生活分享",
  applicationName: "CHIMEIDIY",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CHIMEIDIY",
  },
  icons: {
    icon: [{ url: "/images/logo-mark.png", type: "image/png" }],
    apple: [{ url: "/images/logo-mark.png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#E9285C" },
    { media: "(prefers-color-scheme: dark)", color: "#E9285C" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className="overflow-x-hidden">
      <body className="min-h-screen overflow-x-hidden bg-background font-sans text-coffee antialiased">
        <CapacitorShell />
        {children}
      </body>
    </html>
  );
}

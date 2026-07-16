import type { Metadata, Viewport } from "next";
import { CapacitorShell } from "@/components/capacitor/CapacitorShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "CHIMEIDIY 團購",
  description: "CHIMEIDIY 團購 · 棋美點心屋 — 團購、直播、分潤一站式服務",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#D92D2D",
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

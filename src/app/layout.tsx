import type { Metadata, Viewport } from "next";
import { CapacitorShell } from "@/components/capacitor/CapacitorShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "CHIMEIDIY 烘焙生活平台",
  description: "CHIMEIDIY 烘焙生活 App — 材料、食譜、會員、團購與門市服務",
  applicationName: "CHIMEIDIY",
  appleWebApp: {
    capable: true,
    /* Translucent so homepage/shop yellow can run under the status bar */
    statusBarStyle: "black-translucent",
    title: "CHIMEIDIY",
  },
  icons: {
    icon: [{ url: "/branding/chimeidiy-app-icon.png", type: "image/png" }],
    apple: [{ url: "/branding/chimeidiy-app-icon.png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /** Allow pinch / browser zoom on phone, tablet, and desktop. */
  minimumScale: 0.5,
  maximumScale: 10,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FF6B6B" },
    { media: "(prefers-color-scheme: dark)", color: "#FF6B6B" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className="h-full">
      <body className="min-h-dvh w-full bg-background font-sans text-foreground antialiased">
        <CapacitorShell />
        {children}
      </body>
    </html>
  );
}

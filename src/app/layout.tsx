import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "chimeidiy 團購",
  description: "chimeidiy 團購 - 團購、直播、分潤一站式服務",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className="overflow-x-hidden">
      <body className="min-h-screen overflow-x-hidden bg-background font-sans text-coffee antialiased">
        {children}
      </body>
    </html>
  );
}

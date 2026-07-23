import type { Metadata } from "next";

export default function ImmersiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-[#1a100c] text-white antialiased">
      {children}
    </div>
  );
}

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

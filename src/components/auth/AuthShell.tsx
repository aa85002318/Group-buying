"use client";

import type { ReactNode } from "react";
import { BadgePercent, Gift, PackageCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { DesktopBrandLogo } from "@/components/desktop/DesktopBrandLogo";
import { DesktopContainer } from "@/components/desktop/DesktopContainer";
import { DesktopFooter } from "@/components/desktop/DesktopFooter";
import { DesktopHeader } from "@/components/desktop/DesktopHeader";
import { useClearDesktopBootFlag } from "@/hooks/useClearDesktopBootFlag";
import { useDesktopV2Active } from "@/hooks/useDesktopV2Active";
import { DESKTOP_COLORS } from "@/lib/desktop/brand-assets";

const PERKS = [
  { icon: BadgePercent, text: "限時團購與會員專屬優惠" },
  { icon: Gift, text: "門市會員禮、滿額贈一次掌握" },
  { icon: PackageCheck, text: "訂單、付款與取貨進度隨時查" },
] as const;

/**
 * Auth pages (/auth/*) sit outside the (main) AppShell.
 * Desktop V2: desktop header/footer + brand panel beside the form.
 * Otherwise: the original mobile Header layout, unchanged.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const desktopV2 = useDesktopV2Active();
  useClearDesktopBootFlag();

  if (desktopV2) {
    return (
      <div
        className="desktop-v2-shell flex min-h-dvh w-full flex-col overflow-x-clip"
        style={{ background: DESKTOP_COLORS.warmWhite }}
        data-desktop-v2="true"
      >
        <DesktopHeader />
        <main className="flex-1 py-10 xl:py-14">
          <DesktopContainer className="max-w-[1100px]">
            <div className="grid min-h-[560px] overflow-hidden rounded-[28px] bg-white shadow-[0_12px_40px_rgba(21,62,115,0.08)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <aside
                className="flex flex-col justify-between gap-10 p-10 xl:p-12"
                style={{ background: DESKTOP_COLORS.yellow }}
              >
                <DesktopBrandLogo height={56} />
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h1 className="text-[32px] font-black leading-tight text-[#153E73]">
                      烘焙生活，
                      <br />
                      一個帳號搞定
                    </h1>
                    <p className="text-[15px] leading-relaxed text-[#153E73]/80">
                      材料、食譜、團購與門市服務，登入後同步你的購物車、收藏與會員禮。
                    </p>
                  </div>
                  <ul className="space-y-3">
                    {PERKS.map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-center gap-3 text-[15px] font-semibold text-[#153E73]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70">
                          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                        </span>
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-[#153E73]/60">© CHIMEIDIY 烘焙生活平台</p>
              </aside>
              {/* Auth pages carry their own mobile min-height; neutralise it here. */}
              <div className="flex min-w-0 items-center justify-center p-8 xl:p-10 [&>*]:!min-h-0 [&>*]:w-full [&>*]:!bg-transparent">
                {children}
              </div>
            </div>
          </DesktopContainer>
        </main>
        <DesktopFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-app-shell="mobile">
      <Header />
      <div className="pt-[calc(var(--header-height)+var(--header-content-gap))]">{children}</div>
    </div>
  );
}

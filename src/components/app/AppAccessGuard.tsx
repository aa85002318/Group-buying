"use client";

import { useEffect, useState } from "react";
import { ChimeidiyLogo } from "@/components/branding/ChimeidiyLogo";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "chimeidiy-desktop-prompt-dismissed";

/**
 * Soft UX only — never a security gate.
 *
 * App 尚未上架：預設開放網頁瀏覽（所有裝置）。
 * 日後上架後可設 NEXT_PUBLIC_REQUIRE_APP=true 顯示桌機安裝提示。
 * NEXT_PUBLIC_ALLOW_DESKTOP=true 可永遠關閉提示。
 */
export function AppAccessGuard({ children }: { children: React.ReactNode }) {
  const requireApp = process.env.NEXT_PUBLIC_REQUIRE_APP === "true";
  const allowDesktop = process.env.NEXT_PUBLIC_ALLOW_DESKTOP === "true";

  if (!requireApp || allowDesktop || process.env.NODE_ENV === "development") {
    return <>{children}</>;
  }

  return <DesktopInstallPrompt>{children}</DesktopInstallPrompt>;
}

function DesktopInstallPrompt({ children }: { children: React.ReactNode }) {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    const sync = () => setShowPrompt(window.innerWidth >= 1024);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setShowPrompt(false);
  };

  return (
    <>
      {showPrompt && (
        <div
          className="relative z-[60] border-b border-border bg-caramel-soft px-4 py-6"
          role="region"
          aria-label="桌機使用提示"
        >
          <div className="mx-auto flex max-w-lg flex-col items-center gap-4 text-center">
            <ChimeidiyLogo variant="compact" href={null} />
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-caramel">建議使用手機開啟</h2>
              <p className="text-sm leading-relaxed text-foreground-secondary">
                CHIMEIDIY App 即將上架。目前可先以手機瀏覽器或加入主畫面（PWA）使用。
              </p>
            </div>
            <Button type="button" variant="outline" onClick={dismiss}>
              繼續使用網頁版
            </Button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ChimeidiyLogo } from "@/components/branding/ChimeidiyLogo";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "chimeidiy-desktop-prompt-dismissed";

function isDevBypass() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ALLOW_DESKTOP === "true"
  );
}

/**
 * Soft UX prompt for large screens — not a security mechanism.
 * Dev / ALLOW_DESKTOP never blocks. Production ≥1024 shows a dismissible panel.
 */
export function AppAccessGuard({ children }: { children: React.ReactNode }) {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (isDevBypass()) return;

    try {
      if (window.sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    const sync = () => {
      setShowPrompt(window.innerWidth >= 1024);
    };

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
              <h2 className="text-lg font-bold text-caramel">
                請使用 CHIMEIDIY App 開啟
              </h2>
              <p className="text-sm leading-relaxed text-foreground-secondary">
                為提供完整的會員、購物、通知與門市服務體驗，請使用手機開啟或安裝
                CHIMEIDIY App（PWA／App Store／Google Play）。
              </p>
            </div>

            {/* Placeholders — Phase 1 skeleton */}
            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="flex aspect-square flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface p-3">
                <div className="mb-2 h-16 w-16 rounded-lg bg-surface-soft" aria-hidden />
                <span className="text-xs text-foreground-secondary">QR Code</span>
              </div>
              <div className="flex aspect-square flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface p-3">
                <div className="mb-2 h-8 w-20 rounded-md bg-surface-soft" aria-hidden />
                <span className="text-xs text-foreground-secondary">App Store</span>
              </div>
              <div className="flex aspect-square flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface p-3">
                <div className="mb-2 h-8 w-20 rounded-md bg-surface-soft" aria-hidden />
                <span className="text-xs text-foreground-secondary">Google Play</span>
              </div>
              <div className="flex aspect-square flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface p-3">
                <div className="mb-2 h-8 w-20 rounded-md bg-surface-soft" aria-hidden />
                <span className="text-xs text-foreground-secondary">官方網站</span>
              </div>
            </div>

            <Button type="button" variant="outline" onClick={dismiss}>
              繼續瀏覽
            </Button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { AppSideMenu } from "@/components/navigation/side-menu/AppSideMenu";
import { OPEN_SIDE_MENU_EVENT } from "@/lib/side-menu-events";
import { cn } from "@/lib/utils";

/** Consumer Hub hamburger — opens shared C6 sliding side menu. */
export function AppHamburgerMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_SIDE_MENU_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_SIDE_MENU_EVENT, onOpen);
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-11 w-11 min-h-touch min-w-touch items-center justify-center rounded-xl text-caramel transition hover:bg-caramel-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          className
        )}
        aria-label="開啟選單"
        aria-expanded={open}
        aria-controls="app-side-menu"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>
      <div id="app-side-menu">
        <AppSideMenu open={open} onOpenChange={setOpen} triggerRef={triggerRef} />
      </div>
    </>
  );
}

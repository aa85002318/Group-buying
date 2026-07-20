"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function NetworkStatusBanner() {
  const [online, setOnline] = useState(true);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOnline = () => {
      setOnline(true);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 3000);
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (online && !showRestored) return null;

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-[80] px-4 py-2 text-center text-sm text-white md:hidden ${
        online ? "bg-success" : "bg-caramel"
      }`}
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      {!online ? (
        <span className="inline-flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          目前為離線狀態，部分功能可能無法使用。
        </span>
      ) : (
        "網路已恢復。"
      )}
    </div>
  );
}

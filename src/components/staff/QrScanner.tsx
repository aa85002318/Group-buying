"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { parsePickupToken } from "@/lib/staff/pickup-token";

interface QrScannerProps {
  onScan: (token: string) => void;
  disabled?: boolean;
}

export function QrScanner({ onScan, disabled }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const stopCamera = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  };

  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    setError(null);
    stopCamera();

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("此裝置不支援相機掃碼，請改用手動輸入取貨碼");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);

      const Detector = (window as Window & { BarcodeDetector?: new (opts: { formats: string[] }) => { detect: (src: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
      if (!Detector) {
        setError("瀏覽器不支援 QR 自動辨識，請對準後改用手動輸入或 Chrome / Safari 最新版");
        return;
      }

      const detector = new Detector({ formats: ["qr_code"] });
      timerRef.current = window.setInterval(async () => {
        if (!videoRef.current || disabled) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const raw = codes[0]?.rawValue;
          if (!raw) return;
          const token = parsePickupToken(raw);
          if (!token) return;
          stopCamera();
          onScan(token);
        } catch {
          // ignore frame errors
        }
      }, 500);
    } catch {
      setError("無法開啟相機，請確認已允許相機權限");
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-coffee">掃描 QR Code</p>
        {active ? (
          <Button type="button" size="sm" variant="outline" onClick={stopCamera}>
            關閉相機
          </Button>
        ) : (
          <Button type="button" size="sm" variant="promo" onClick={startCamera} disabled={disabled}>
            開啟相機
          </Button>
        )}
      </div>

      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        {!active && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            點擊「開啟相機」掃描客戶取貨 QR
          </div>
        )}
      </div>

      {error && <p className="text-xs text-amber-700">{error}</p>}
    </div>
  );
}

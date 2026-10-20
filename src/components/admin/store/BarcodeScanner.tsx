"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Keyboard } from "lucide-react";

/**
 * 一維條碼掃描。
 *
 * 三種輸入方式，門市用哪種都行：
 *
 * 1. 相機自動辨識 —— 走瀏覽器原生的 BarcodeDetector。
 *    Android Chrome 支援；iOS Safari 到 2026 年仍然預設關閉，所以 iPhone 會
 *    自動落到下面兩種。
 * 2. 手持掃描槍 —— 藍牙／USB 掃描槍對系統來說就是鍵盤，掃完會自動送出。
 *    這個頁面隨時在聽，不用先點輸入框。
 * 3. 手動輸入 —— 條碼糊掉、包裝破損時的退路。
 *
 * 重複掃同一個條碼會被忽略（1.5 秒內），不然對著商品不放會連掃好幾次。
 */

const DUPLICATE_WINDOW_MS = 1500;

// EAN/UPC 為主，順便收 code_128 和 code_39（店內自印標籤常用這兩種）。
const BARCODE_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "itf",
  "codabar",
];

type DetectorLike = {
  detect: (src: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
};

type Props = {
  onScan: (barcode: string) => void;
  /** 父層在處理上一筆時暫停辨識，避免連續觸發 */
  paused?: boolean;
};

export function BarcodeScanner({ onScan, paused = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastScanRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const wedgeRef = useRef<string>("");
  const wedgeTimerRef = useRef<number | null>(null);
  const pausedRef = useRef(paused);

  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraSupported, setCameraSupported] = useState<boolean | null>(null);
  const [manual, setManual] = useState("");

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  /** 同一顆條碼短時間內只算一次。 */
  const emit = useCallback(
    (raw: string) => {
      const code = raw.trim();
      if (!code) return;
      const now = Date.now();
      if (lastScanRef.current.code === code && now - lastScanRef.current.at < DUPLICATE_WINDOW_MS) {
        return;
      }
      lastScanRef.current = { code, at: now };
      // 掃到了給一點回饋，門市環境很吵，震動比聲音可靠。
      try {
        navigator.vibrate?.(60);
      } catch {
        /* 不支援就算了 */
      }
      onScan(code);
    },
    [onScan]
  );

  const stopCamera = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    stopCamera();

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraSupported(false);
      setError("這個瀏覽器不能開相機，請用掃描槍或手動輸入。");
      return;
    }

    const Detector = (
      window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => DetectorLike }
    ).BarcodeDetector;

    if (!Detector) {
      setCameraSupported(false);
      setError(
        "這支手機的瀏覽器不支援相機條碼辨識（iPhone 目前都是如此）。請改用藍牙掃描槍，或在下方手動輸入條碼。"
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraSupported(true);
      setActive(true);

      const detector = new Detector({ formats: BARCODE_FORMATS });
      timerRef.current = window.setInterval(async () => {
        if (!videoRef.current || pausedRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const raw = codes[0]?.rawValue;
          if (raw) emit(raw);
        } catch {
          /* 單張影格失敗很正常，忽略 */
        }
      }, 300);
    } catch {
      setCameraSupported(false);
      setError("無法開啟相機，請確認瀏覽器有相機權限（網址列旁的鎖頭圖示）。");
    }
  }, [emit, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  /**
   * 掃描槍支援：它會很快地「打字」出條碼再按 Enter。
   * 用打字間隔判斷是機器還是人——人類打不到 30ms 一個字。
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // 使用者正在自己打字的欄位就不要攔截。
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      if (e.key === "Enter") {
        if (wedgeRef.current.length >= 6) emit(wedgeRef.current);
        wedgeRef.current = "";
        return;
      }
      if (e.key.length === 1) {
        wedgeRef.current += e.key;
        if (wedgeTimerRef.current) window.clearTimeout(wedgeTimerRef.current);
        // 停頓超過 200ms 就當作不是掃描槍，清掉重來。
        wedgeTimerRef.current = window.setTimeout(() => {
          wedgeRef.current = "";
        }, 200);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [emit]);

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manual.trim();
    if (!code) return;
    // 手動輸入是刻意的動作，不套用重複過濾。
    lastScanRef.current = { code: "", at: 0 };
    emit(code);
    setManual("");
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className={active ? "h-56 w-full object-cover" : "hidden"}
        />
        {!active ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 text-white/70">
            <CameraOff className="h-8 w-8" />
            <p className="text-sm">相機尚未開啟</p>
          </div>
        ) : (
          // 對準框：中間這條線對準條碼就好，不用整顆對齊。
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-[78%] rounded-lg border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
              <div className="mt-[38px] h-0.5 w-full bg-red-500/80" />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={active ? stopCamera : startCamera}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#153E73] px-4 font-bold text-white"
        >
          <Camera className="h-4 w-4" />
          {active ? "關閉相機" : "開啟相機掃描"}
        </button>
      </div>

      {error ? (
        <p className="rounded-xl bg-error-soft px-3 py-2 text-[13px] text-error">{error}</p>
      ) : null}

      <form onSubmit={submitManual} className="flex gap-2">
        <div className="relative flex-1">
          <Keyboard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A94A6]" />
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            placeholder="條碼掃不到？直接輸入數字"
            className="input-field h-11 w-full pl-9"
          />
        </div>
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-white px-4 font-bold text-[#153E73] ring-1 ring-[#153E73]/30"
        >
          查詢
        </button>
      </form>

      {cameraSupported === false ? (
        <p className="text-[12px] text-[#8A94A6]">
          提示：藍牙或 USB 掃描槍可以直接用，不用點任何欄位，掃了就會自動帶入。
        </p>
      ) : null}
    </div>
  );
}

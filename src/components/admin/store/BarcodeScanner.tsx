"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Keyboard } from "lucide-react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType, NotFoundException } from "@zxing/library";

/**
 * 一維條碼掃描。
 *
 * 輸入方式：
 * 1. 相機自動辨識
 *    - 優先：瀏覽器原生 BarcodeDetector（Android Chrome 等）
 *    - Fallback：ZXing WASM/JS（iPhone Safari / 不支援 BarcodeDetector 時）
 * 2. 手持掃描槍（鍵盤楔入）
 * 3. 手動輸入
 *
 * 重複掃同一個條碼會被忽略（1.5 秒內）。
 */

const DUPLICATE_WINDOW_MS = 1500;

const NATIVE_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "itf",
  "codabar",
];

const ZXING_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.ITF,
  BarcodeFormat.CODABAR,
];

type DetectorLike = {
  detect: (src: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
};

type Props = {
  onScan: (barcode: string) => void;
  /** 父層在處理上一筆時暫停辨識，避免連續觸發 */
  paused?: boolean;
};

function getNativeDetector(): (new (o: { formats: string[] }) => DetectorLike) | null {
  const Detector = (
    window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => DetectorLike }
  ).BarcodeDetector;
  return Detector ?? null;
}

export function BarcodeScanner({ onScan, paused = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const lastScanRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const wedgeRef = useRef<string>("");
  const wedgeTimerRef = useRef<number | null>(null);
  const pausedRef = useRef(paused);
  const startingRef = useRef(false);

  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<"native" | "zxing" | null>(null);
  const [manual, setManual] = useState("");

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const emit = useCallback(
    (raw: string) => {
      const code = raw.trim();
      if (!code) return;
      const now = Date.now();
      if (
        lastScanRef.current.code === code &&
        now - lastScanRef.current.at < DUPLICATE_WINDOW_MS
      ) {
        return;
      }
      lastScanRef.current = { code, at: now };
      try {
        navigator.vibrate?.(60);
      } catch {
        /* ignore */
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
    try {
      zxingControlsRef.current?.stop();
    } catch {
      /* ignore */
    }
    zxingControlsRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActive(false);
    setEngine(null);
  }, []);

  const startNativeLoop = useCallback(
    (Detector: new (o: { formats: string[] }) => DetectorLike) => {
      const detector = new Detector({ formats: NATIVE_FORMATS });
      timerRef.current = window.setInterval(async () => {
        if (!videoRef.current || pausedRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const raw = codes[0]?.rawValue;
          if (raw) emit(raw);
        } catch {
          /* 單張影格失敗很正常 */
        }
      }, 300);
      setEngine("native");
    },
    [emit]
  );

  const startZxingLoop = useCallback(
    async (stream: MediaStream) => {
      if (!videoRef.current) {
        throw new Error("找不到相機預覽元件");
      }

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, ZXING_FORMATS);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new BrowserMultiFormatReader(hints, {
        delayBetweenScanAttempts: 250,
        delayBetweenScanSuccess: DUPLICATE_WINDOW_MS,
      });

      const controls = await reader.decodeFromStream(
        stream,
        videoRef.current,
        (result, err) => {
          if (pausedRef.current) return;
          if (result) {
            emit(result.getText());
            return;
          }
          // 每幀找不到條碼是正常的，不要當成錯誤顯示。
          if (err && !(err instanceof NotFoundException)) {
            /* ignore transient decode errors */
          }
        }
      );

      zxingControlsRef.current = controls;
      setEngine("zxing");
    },
    [emit]
  );

  const startCamera = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    setError(null);
    stopCamera();

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("這個瀏覽器不能開相機，請用掃描槍或手動輸入。");
      startingRef.current = false;
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // iOS 必須 playsInline + 明確 play()
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("webkit-playsinline", "true");
        await videoRef.current.play();
      }

      setActive(true);

      const Detector = getNativeDetector();
      if (Detector) {
        startNativeLoop(Detector);
      } else {
        await startZxingLoop(stream);
      }
    } catch (err) {
      stopCamera();
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError("無法開啟相機：請到 iPhone「設定 → Safari／瀏覽器」允許相機權限後重試。");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("找不到可用相機，請改用掃描槍或手動輸入。");
      } else {
        setError("無法開啟相機，請確認使用 HTTPS 並允許相機權限，或改用掃描槍／手動輸入。");
      }
    } finally {
      startingRef.current = false;
    }
  }, [startNativeLoop, startZxingLoop, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  /**
   * 掃描槍支援：它會很快地「打字」出條碼再按 Enter。
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      if (e.key === "Enter") {
        if (wedgeRef.current.length >= 6) emit(wedgeRef.current);
        wedgeRef.current = "";
        return;
      }
      if (e.key.length === 1) {
        wedgeRef.current += e.key;
        if (wedgeTimerRef.current) window.clearTimeout(wedgeTimerRef.current);
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
          autoPlay
          className={active ? "h-56 w-full object-cover" : "hidden"}
        />
        {!active ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 text-white/70">
            <CameraOff className="h-8 w-8" />
            <p className="text-sm">相機尚未開啟</p>
            <p className="px-6 text-center text-[11px] text-white/50">
              iPhone／Android 都可使用相機掃碼；也支援掃描槍與手動輸入
            </p>
          </div>
        ) : (
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

      {active && engine ? (
        <p className="text-[12px] text-[#8A94A6]">
          {engine === "native"
            ? "使用系統條碼辨識中，請將條碼對準紅線。"
            : "使用相容模式掃碼中（適合 iPhone），請將條碼對準紅線、保持 Steady。"}
        </p>
      ) : null}

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

      <p className="text-[12px] text-[#8A94A6]">
        提示：藍牙或 USB 掃描槍可以直接用，不用點任何欄位，掃了就會自動帶入。
      </p>
    </div>
  );
}

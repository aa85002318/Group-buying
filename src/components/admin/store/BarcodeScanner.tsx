"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, ScanBarcode } from "lucide-react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

/**
 * 一維條碼掃描。
 *
 * 輸入方式：
 * 1. 相機自動辨識（原生 BarcodeDetector → ZXing fallback，含 iPhone）
 * 2. 外接手持條碼槍（藍牙／USB 鍵盤楔入）→ 專用輸入欄自動接收數字並送出
 * 3. 同一欄位也可手動輸入後按 Enter／查詢
 *
 * 手機重點：iOS／Android 外接掃描槍必須有「聚焦中的 input」才收得到字元，
 * 因此提供常駐掃描槍欄位，掃完自動清空並重新聚焦，方便連續掃。
 */

const DUPLICATE_WINDOW_MS = 1500;
/** 掃描槍打字極快；停頓超過此時間且長度足夠 → 自動送出（無 Enter 後綴的槍也適用） */
const SCANNER_IDLE_SUBMIT_MS = 120;
const MIN_BARCODE_LEN = 6;

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

function normalizeBarcode(raw: string) {
  // 掃描槍偶發前後空白／換行；只保留條碼常見字元
  return raw.replace(/[\r\n\t]/g, "").trim();
}

function isQtyEditing() {
  const ae = document.activeElement as HTMLElement | null;
  return Boolean(ae?.closest("[data-stocktake-qty]"));
}

export function BarcodeScanner({ onScan, paused = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const lastScanRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const idleSubmitRef = useRef<number | null>(null);
  const pausedRef = useRef(paused);
  const startingRef = useRef(false);

  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<"native" | "zxing" | null>(null);
  const [buffer, setBuffer] = useState("");
  const [lastAccepted, setLastAccepted] = useState<string | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const focusScannerField = useCallback(() => {
    if (isQtyEditing()) return;
    const el = scannerInputRef.current;
    if (!el) return;
    // preventScroll 避免手機盤點列表被捲動跳動
    try {
      el.focus({ preventScroll: true });
    } catch {
      el.focus();
    }
  }, []);

  const emit = useCallback(
    (raw: string) => {
      const code = normalizeBarcode(raw);
      if (!code || code.length < MIN_BARCODE_LEN) return false;
      const now = Date.now();
      if (
        lastScanRef.current.code === code &&
        now - lastScanRef.current.at < DUPLICATE_WINDOW_MS
      ) {
        return false;
      }
      lastScanRef.current = { code, at: now };
      try {
        navigator.vibrate?.(60);
      } catch {
        /* ignore */
      }
      onScan(code);
      setLastAccepted(code);
      setBuffer("");
      // 下一輪掃碼：清完再聚焦
      window.setTimeout(() => focusScannerField(), 0);
      return true;
    },
    [focusScannerField, onScan]
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
          /* ignore */
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
        (result) => {
          if (pausedRef.current) return;
          if (result) emit(result.getText());
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
        setError("無法開啟相機：請到手機設定允許相機權限後重試。");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("找不到可用相機，請改用外接掃描槍或手動輸入。");
      } else {
        setError("無法開啟相機，請確認使用 HTTPS 並允許相機權限，或改用掃描槍／手動輸入。");
      }
    } finally {
      startingRef.current = false;
      focusScannerField();
    }
  }, [focusScannerField, startNativeLoop, startZxingLoop, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // 進入頁面先聚焦掃描槍欄，外接槍才能立刻輸入
  useEffect(() => {
    const t = window.setTimeout(() => focusScannerField(), 200);
    return () => window.clearTimeout(t);
  }, [focusScannerField]);

  // 編輯數量結束後，自動回到掃描槍欄，方便繼續掃
  useEffect(() => {
    const onFocusOut = () => {
      window.setTimeout(() => {
        if (!isQtyEditing()) focusScannerField();
      }, 50);
    };
    document.addEventListener("focusout", onFocusOut);
    return () => document.removeEventListener("focusout", onFocusOut);
  }, [focusScannerField]);

  useEffect(() => {
    return () => {
      if (idleSubmitRef.current) window.clearTimeout(idleSubmitRef.current);
    };
  }, []);

  const scheduleIdleSubmit = useCallback(
    (value: string) => {
      if (idleSubmitRef.current) window.clearTimeout(idleSubmitRef.current);
      idleSubmitRef.current = window.setTimeout(() => {
        const code = normalizeBarcode(value);
        if (code.length >= MIN_BARCODE_LEN && !pausedRef.current) {
          emit(code);
        }
      }, SCANNER_IDLE_SUBMIT_MS);
    },
    [emit]
  );

  const onScannerChange = (value: string) => {
    // 多數掃描槍是數字；也允許 Code128 英數
    const cleaned = value.replace(/[^\w\-./]/g, "");
    setBuffer(cleaned);
    if (!paused) scheduleIdleSubmit(cleaned);
  };

  const onScannerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (idleSubmitRef.current) window.clearTimeout(idleSubmitRef.current);
    if (paused) return;
    emit(buffer);
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (idleSubmitRef.current) window.clearTimeout(idleSubmitRef.current);
    if (paused) return;
    // 手動按查詢：略過短時間重複過濾
    lastScanRef.current = { code: "", at: 0 };
    emit(buffer);
  };

  return (
    <div className="space-y-3">
      {/* 外接掃描槍主輸入：必須可聚焦，手機才收得到 HID 鍵盤字元 */}
      <form
        onSubmit={submitManual}
        className="rounded-2xl border border-[#153E73]/20 bg-[#F5F8FC] p-3 space-y-2"
      >
        <div className="flex items-center gap-2 text-[#153E73]">
          <ScanBarcode className="h-4 w-4 shrink-0" aria-hidden />
          <p className="text-sm font-bold">外接掃描槍／條碼輸入</p>
        </div>
        <p className="text-[12px] leading-relaxed text-[#8A94A6]">
          藍牙或 USB 手持條碼槍連上手機後，直接掃商品即可自動帶入數字，無需再按鍵。
          請保持此欄位為選取狀態（編輯數量時除外）。
        </p>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="stocktake-scanner-input">
            條碼掃描槍輸入
          </label>
          <input
            id="stocktake-scanner-input"
            ref={scannerInputRef}
            data-scanner-input="true"
            value={buffer}
            onChange={(e) => onScannerChange(e.target.value)}
            onKeyDown={onScannerKeyDown}
            onFocus={() => setError(null)}
            inputMode="numeric"
            enterKeyHint="done"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="掃描槍掃入，或手動輸入條碼數字"
            className="input-field h-12 min-h-touch flex-1 font-mono text-base tracking-wide"
            disabled={paused}
          />
          <button
            type="submit"
            disabled={paused || normalizeBarcode(buffer).length < MIN_BARCODE_LEN}
            className="min-h-12 rounded-xl bg-[#153E73] px-4 font-bold text-white disabled:opacity-50"
          >
            查詢
          </button>
        </div>
        {lastAccepted ? (
          <p className="text-[12px] text-[#1B6B3A]">已帶入：{lastAccepted}</p>
        ) : null}
      </form>

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
            <p className="text-sm">相機尚未開啟（可選）</p>
            <p className="px-6 text-center text-[11px] text-white/50">
              已接掃描槍時可不開相機；也可用手機鏡頭掃碼
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
            : "使用相容模式掃碼中（適合 iPhone），請將條碼對準紅線。"}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-error-soft px-3 py-2 text-[13px] text-error">{error}</p>
      ) : null}
    </div>
  );
}

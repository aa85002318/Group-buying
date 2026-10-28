"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, ScanBarcode } from "lucide-react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

/**
 * 一維條碼掃描。
 *
 * 1. 相機（BarcodeDetector → ZXing）
 * 2. 外接掃描槍（快速鍵入 → 自動送出）
 * 3. 手動輸入（只在按 Enter／查詢時送出，避免邊打邊送）
 *
 * 同一條碼短時間重複偵測會靜默忽略，不需重新輸入。
 */

/** 相機／掃描槍：同一條碼冷卻，避免一直跳同一筆 */
const DUPLICATE_COOLDOWN_MS = 5000;
/** 掃成功後相機暫停辨識，方便輸入數量 */
const CAMERA_PAUSE_AFTER_SCAN_MS = 2500;
/** 掃描槍字元間隔通常 < 40ms；超過則視為手動輸入 */
const WEDGE_MAX_CHAR_GAP_MS = 40;
/** 掃描槍停頓後自動送出（僅快速鍵入模式） */
const WEDGE_IDLE_SUBMIT_MS = 140;
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

type ScanSource = "camera" | "wedge" | "manual";

type Props = {
  onScan: (barcode: string) => void;
  paused?: boolean;
};

function getNativeDetector(): (new (o: { formats: string[] }) => DetectorLike) | null {
  const Detector = (
    window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => DetectorLike }
  ).BarcodeDetector;
  return Detector ?? null;
}

function normalizeBarcode(raw: string) {
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
  const cameraPauseUntilRef = useRef(0);
  const idleSubmitRef = useRef<number | null>(null);
  const lastCharAtRef = useRef(0);
  const wedgeModeRef = useRef(false);
  const pausedRef = useRef(paused);
  const startingRef = useRef(false);
  const bufferRef = useRef("");

  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<"native" | "zxing" | null>(null);
  const [buffer, setBuffer] = useState("");
  const [lastAccepted, setLastAccepted] = useState<string | null>(null);
  const [dupHint, setDupHint] = useState<string | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    bufferRef.current = buffer;
  }, [buffer]);

  const focusScannerField = useCallback(() => {
    if (isQtyEditing()) return;
    const el = scannerInputRef.current;
    if (!el) return;
    try {
      el.focus({ preventScroll: true });
    } catch {
      el.focus();
    }
  }, []);

  const emit = useCallback(
    (raw: string, source: ScanSource) => {
      const code = normalizeBarcode(raw);
      if (!code || code.length < MIN_BARCODE_LEN) return false;

      const now = Date.now();
      const isDup =
        lastScanRef.current.code === code &&
        now - lastScanRef.current.at < DUPLICATE_COOLDOWN_MS;

      // 手動按查詢：允許重查；相機／掃描槍重複 → 靜默忽略，清掉欄位即可
      if (isDup && source !== "manual") {
        setBuffer("");
        bufferRef.current = "";
        wedgeModeRef.current = false;
        setDupHint(`條碼 ${code} 剛掃過，已略過（可直接改數量）`);
        window.setTimeout(() => setDupHint(null), 2500);
        window.setTimeout(() => focusScannerField(), 0);
        return false;
      }

      lastScanRef.current = { code, at: now };
      if (source === "camera") {
        cameraPauseUntilRef.current = now + CAMERA_PAUSE_AFTER_SCAN_MS;
      }

      try {
        navigator.vibrate?.(40);
      } catch {
        /* ignore */
      }

      onScan(code);
      setLastAccepted(code);
      setDupHint(null);
      setBuffer("");
      bufferRef.current = "";
      wedgeModeRef.current = false;
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
        if (Date.now() < cameraPauseUntilRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const raw = codes[0]?.rawValue;
          if (raw) emit(raw, "camera");
        } catch {
          /* ignore */
        }
      }, 400);
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
      // 不要 TRY_HARDER：手機上太敏感、誤掃／重複掃變多
      const reader = new BrowserMultiFormatReader(hints, {
        delayBetweenScanAttempts: 350,
        delayBetweenScanSuccess: DUPLICATE_COOLDOWN_MS,
      });

      const controls = await reader.decodeFromStream(
        stream,
        videoRef.current,
        (result) => {
          if (pausedRef.current) return;
          if (Date.now() < cameraPauseUntilRef.current) return;
          if (result) emit(result.getText(), "camera");
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

  useEffect(() => {
    const t = window.setTimeout(() => focusScannerField(), 200);
    return () => window.clearTimeout(t);
  }, [focusScannerField]);

  useEffect(() => {
    const onFocusOut = () => {
      window.setTimeout(() => {
        if (!isQtyEditing()) focusScannerField();
      }, 80);
    };
    document.addEventListener("focusout", onFocusOut);
    return () => document.removeEventListener("focusout", onFocusOut);
  }, [focusScannerField]);

  useEffect(() => {
    return () => {
      if (idleSubmitRef.current) window.clearTimeout(idleSubmitRef.current);
    };
  }, []);

  const scheduleWedgeSubmit = useCallback(
    (value: string) => {
      if (idleSubmitRef.current) window.clearTimeout(idleSubmitRef.current);
      idleSubmitRef.current = window.setTimeout(() => {
        if (!wedgeModeRef.current || pausedRef.current) return;
        const code = normalizeBarcode(value);
        if (code.length >= MIN_BARCODE_LEN) {
          emit(code, "wedge");
        }
      }, WEDGE_IDLE_SUBMIT_MS);
    },
    [emit]
  );

  const onScannerChange = (value: string) => {
    const cleaned = value.replace(/[^\w\-./]/g, "");
    const now = Date.now();
    const gap = now - lastCharAtRef.current;
    lastCharAtRef.current = now;

    // 快速連續鍵入 = 掃描槍；慢速 = 手動（不自動送出）
    if (cleaned.length > 0 && (cleaned.length === 1 || gap <= WEDGE_MAX_CHAR_GAP_MS)) {
      if (cleaned.length >= 2 && gap <= WEDGE_MAX_CHAR_GAP_MS) {
        wedgeModeRef.current = true;
      }
    } else if (gap > WEDGE_MAX_CHAR_GAP_MS * 3) {
      wedgeModeRef.current = false;
      if (idleSubmitRef.current) {
        window.clearTimeout(idleSubmitRef.current);
        idleSubmitRef.current = null;
      }
    }

    setBuffer(cleaned);
    bufferRef.current = cleaned;

    if (!paused && wedgeModeRef.current) {
      scheduleWedgeSubmit(cleaned);
    }
  };

  const onScannerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (idleSubmitRef.current) window.clearTimeout(idleSubmitRef.current);
    if (paused) return;
    // Enter：掃描槍後綴，或手動確認
    const source: ScanSource = wedgeModeRef.current ? "wedge" : "manual";
    emit(bufferRef.current || buffer, source);
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (idleSubmitRef.current) window.clearTimeout(idleSubmitRef.current);
    if (paused) return;
    wedgeModeRef.current = false;
    emit(bufferRef.current || buffer, "manual");
  };

  return (
    <div className="space-y-3">
      <form
        onSubmit={submitManual}
        className="space-y-2 rounded-2xl border border-[#153E73]/20 bg-[#F5F8FC] p-3"
      >
        <div className="flex items-center gap-2 text-[#153E73]">
          <ScanBarcode className="h-4 w-4 shrink-0" aria-hidden />
          <p className="text-sm font-bold">外接掃描槍／手動輸入</p>
        </div>
        <p className="text-[12px] leading-relaxed text-[#8A94A6]">
          掃描槍：直接掃即可自動帶入。手動輸入：打完數字後按「查詢」或鍵盤 Enter。
          同一條碼短時間重複掃會自動略過，不用重打。
        </p>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="stocktake-scanner-input">
            條碼輸入
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
            placeholder="輸入條碼後按查詢，或用掃描槍掃入"
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
        {dupHint ? (
          <p className="text-[12px] text-[#8A6A00]">{dupHint}</p>
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
              手動輸入或掃描槍可不開相機
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
          相機掃碼已開啟；同一條碼 5 秒內重複會自動略過。
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-error-soft px-3 py-2 text-[13px] text-error">{error}</p>
      ) : null}
    </div>
  );
}

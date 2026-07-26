"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import {
  POPUP_SESSION_SHOWN_KEY,
  popupDismissStorageKey,
  resolvePopupHref,
  type HomepagePopup,
  type HomepagePopupEventType,
} from "@/lib/popups/types";

function getOrCreateSessionId(): string {
  try {
    const key = "chimeidiy_popup_session_id";
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const id = `s_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    return "anon";
  }
}

function wasDismissedToday(popupId: string): boolean {
  try {
    return localStorage.getItem(popupDismissStorageKey(popupId)) === "1";
  } catch {
    return false;
  }
}

function markDismissedToday(popupId: string) {
  try {
    localStorage.setItem(popupDismissStorageKey(popupId), "1");
  } catch {
    /* ignore */
  }
}

function sessionAlreadyShown(): boolean {
  try {
    return Boolean(sessionStorage.getItem(POPUP_SESSION_SHOWN_KEY));
  } catch {
    return false;
  }
}

function markSessionShown(popupId: string) {
  try {
    sessionStorage.setItem(POPUP_SESSION_SHOWN_KEY, popupId);
  } catch {
    /* ignore */
  }
}

/** Fire-and-forget analytics — never block UI close / navigation. */
function track(popupId: string, eventType: HomepagePopupEventType) {
  const payload = JSON.stringify({
    event_type: eventType,
    session_id: getOrCreateSessionId(),
  });
  const url = `/api/popups/${popupId}/events`;

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon(url, blob)) return;
    }
  } catch {
    /* fall through to fetch */
  }

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

/**
 * 首頁彈跳公告 — 載入後顯示；每工作階段最多一則。
 * 關閉／CTA 立即回應，追蹤在背景送出。
 */
export function HomepagePopupDialog() {
  const [popup, setPopup] = useState<HomepagePopup | null>(null);
  const [open, setOpen] = useState(false);
  const [dismissToday, setDismissToday] = useState(false);
  const [preferDesktopImage, setPreferDesktopImage] = useState(false);
  const viewedRef = useRef(false);
  const closingRef = useRef(false);
  const dismissTodayRef = useRef(false);

  useEffect(() => {
    dismissTodayRef.current = dismissToday;
  }, [dismissToday]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setPreferDesktopImage(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionAlreadyShown()) return;

    let cancelled = false;
    const controller = new AbortController();

    const show = (p: HomepagePopup) => {
      if (cancelled || !p?.id) return;
      if (wasDismissedToday(p.id)) return;
      if (sessionAlreadyShown()) return;
      setPopup(p);
      setOpen(true);
      markSessionShown(p.id);
    };

    // Fetch immediately; tiny delay only so first paint isn't blocked by the overlay.
    const timer = window.setTimeout(() => {
      fetch("/api/popups/active", { signal: controller.signal })
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          show(d.popup as HomepagePopup);
        })
        .catch(() => {});
    }, 180);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!open || !popup || viewedRef.current) return;
    viewedRef.current = true;
    track(popup.id, "view");
  }, [open, popup]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const closeNow = useCallback(
    (reason: "close" | "dismiss_today") => {
      if (!popup || closingRef.current) return;
      closingRef.current = true;
      setOpen(false);

      const shouldDismissToday = reason === "dismiss_today" || dismissTodayRef.current;
      if (shouldDismissToday) {
        markDismissedToday(popup.id);
        track(popup.id, "dismiss_today");
      } else {
        track(popup.id, "close");
      }
    },
    [popup]
  );

  const onCta = useCallback(() => {
    if (!popup || closingRef.current) return;
    closingRef.current = true;
    setOpen(false);

    track(popup.id, "click");
    if (popup.dismiss_after_click || dismissTodayRef.current) {
      markDismissedToday(popup.id);
      if (dismissTodayRef.current) track(popup.id, "dismiss_today");
    }
  }, [popup]);

  if (!open || !popup) return null;

  const href = resolvePopupHref(popup);
  const image = preferDesktopImage
    ? popup.desktop_image_url || popup.mobile_image_url
    : popup.mobile_image_url || popup.desktop_image_url;

  const isExternal = Boolean(href && /^https?:\/\//i.test(href));

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4"
      style={{
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={popup.title || "活動公告"}
      onClick={() => {
        if (popup.allow_close_on_backdrop && popup.allow_close) {
          closeNow(dismissTodayRef.current ? "dismiss_today" : "close");
        }
      }}
    >
      <div
        className="relative w-[90%] max-w-md overflow-hidden rounded-[22px] bg-white shadow-[0_10px_40px_rgba(74,49,36,0.18)] md:w-[420px]"
        onClick={(e) => e.stopPropagation()}
      >
        {popup.allow_close && (
          <button
            type="button"
            className="absolute right-3 top-3 z-10 flex h-11 w-11 touch-manipulation items-center justify-center rounded-full bg-white/90 text-caramel shadow-sm active:scale-95"
            aria-label="關閉"
            onClick={(e) => {
              e.stopPropagation();
              closeNow(dismissTodayRef.current ? "dismiss_today" : "close");
            }}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        )}

        <div className="aspect-square w-full bg-peach-soft/40">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={popup.title || "活動圖片"}
              className="h-full w-full object-cover"
              decoding="async"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-foreground-secondary">
              活動公告
            </div>
          )}
        </div>

        <div className="space-y-3 px-5 pb-5 pt-4 text-center">
          {popup.title && (
            <h2 className="text-xl font-bold text-caramel md:text-2xl">{popup.title}</h2>
          )}
          {popup.description && (
            <p className="text-sm text-foreground-secondary md:text-base">{popup.description}</p>
          )}

          {href ? (
            isExternal ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-full touch-manipulation items-center justify-center rounded-[14px] bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover active:scale-[0.98]"
                onClick={onCta}
              >
                {popup.button_text || "立即查看"}
              </a>
            ) : (
              <Link
                href={href}
                className="inline-flex min-h-11 w-full touch-manipulation items-center justify-center rounded-[14px] bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover active:scale-[0.98]"
                onClick={onCta}
              >
                {popup.button_text || "立即查看"}
              </Link>
            )
          ) : (
            <button
              type="button"
              className="inline-flex min-h-11 w-full touch-manipulation items-center justify-center rounded-[14px] bg-primary px-4 text-sm font-semibold text-white active:scale-[0.98]"
              onClick={() => closeNow(dismissTodayRef.current ? "dismiss_today" : "close")}
            >
              {popup.button_text || "知道了"}
            </button>
          )}

          {popup.allow_dismiss_today && (
            <label className="flex min-h-11 cursor-pointer touch-manipulation items-center justify-center gap-2 text-sm text-foreground-secondary">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[var(--primary)]"
                checked={dismissToday}
                onChange={(e) => setDismissToday(e.target.checked)}
              />
              今天不再顯示
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

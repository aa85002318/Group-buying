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

async function track(popupId: string, eventType: HomepagePopupEventType) {
  try {
    await fetch(`/api/popups/${popupId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: eventType,
        session_id: getOrCreateSessionId(),
      }),
    });
  } catch {
    /* ignore analytics errors */
  }
}

/**
 * 首頁彈跳公告 — 載入完成後延遲顯示；每工作階段最多一則。
 */
export function HomepagePopupDialog() {
  const [popup, setPopup] = useState<HomepagePopup | null>(null);
  const [open, setOpen] = useState(false);
  const [dismissToday, setDismissToday] = useState(false);
  const viewedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionAlreadyShown()) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      fetch("/api/popups/active")
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          const p = d.popup as HomepagePopup | null;
          if (!p?.id) return;
          if (wasDismissedToday(p.id)) return;
          if (sessionAlreadyShown()) return;
          setPopup(p);
          setOpen(true);
          markSessionShown(p.id);
        })
        .catch(() => {});
    }, 700);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!open || !popup || viewedRef.current) return;
    viewedRef.current = true;
    track(popup.id, "view");
  }, [open, popup]);

  const close = useCallback(
    async (reason: "close" | "dismiss_today") => {
      if (!popup) return;
      if (reason === "dismiss_today" || dismissToday) {
        markDismissedToday(popup.id);
        await track(popup.id, "dismiss_today");
      } else {
        await track(popup.id, "close");
      }
      setOpen(false);
    },
    [popup, dismissToday]
  );

  const onCta = useCallback(async () => {
    if (!popup) return;
    await track(popup.id, "click");
    if (popup.dismiss_after_click || dismissToday) {
      markDismissedToday(popup.id);
      if (dismissToday) await track(popup.id, "dismiss_today");
    }
    setOpen(false);
  }, [popup, dismissToday]);

  if (!open || !popup) return null;

  const href = resolvePopupHref(popup);
  const image =
    typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
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
          void close(dismissToday ? "dismiss_today" : "close");
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
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-caramel shadow-sm"
            aria-label="關閉"
            onClick={() => void close(dismissToday ? "dismiss_today" : "close")}
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="aspect-square w-full bg-peach-soft/40">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={popup.title || "活動圖片"} className="h-full w-full object-cover" />
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
                className="inline-flex min-h-11 w-full items-center justify-center rounded-[14px] bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
                onClick={() => void onCta()}
              >
                {popup.button_text || "立即查看"}
              </a>
            ) : (
              <Link
                href={href}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-[14px] bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
                onClick={() => void onCta()}
              >
                {popup.button_text || "立即查看"}
              </Link>
            )
          ) : (
            <button
              type="button"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[14px] bg-primary px-4 text-sm font-semibold text-white"
              onClick={() => void close(dismissToday ? "dismiss_today" : "close")}
            >
              {popup.button_text || "知道了"}
            </button>
          )}

          {popup.allow_dismiss_today && (
            <label className="flex cursor-pointer items-center justify-center gap-2 text-sm text-foreground-secondary">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--primary)]"
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

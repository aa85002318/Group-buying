"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * 詢價單（跟購物車分開）。
 *
 * 只在瀏覽器端暫存客戶勾了哪些商品，真正送出時才打 /api/inquiries，
 * 品名與規格由伺服器自己查，所以這裡存的名稱只是給客戶自己看的。
 */

export type InquiryLine = {
  productId: string;
  name: string;
  imageUrl?: string | null;
  spec?: string | null;
  quantity: number;
  note?: string | null;
};

const KEY = "sgb_inquiry";
/** 同一個分頁內多個元件要同步，localStorage 的 storage 事件不會發給自己。 */
const EVENT = "sgb-inquiry-change";
const MAX_ITEMS = 50;

function read(): InquiryLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as InquiryLine[]) : [];
  } catch {
    return [];
  }
}

function write(next: InquiryLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 隱私模式等情況寫不進去，畫面上還是看得到，就不擋使用者。 */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useInquiryCart() {
  const [items, setItems] = useState<InquiryLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(read());
    setReady(true);
    const sync = () => setItems(read());
    window.addEventListener(EVENT, sync);
    // 其他分頁改動時也跟著更新。
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const addItem = useCallback((line: Omit<InquiryLine, "quantity"> & { quantity?: number }) => {
    const current = read();
    const qty = Math.max(1, Number(line.quantity) || 1);
    const existing = current.find((i) => i.productId === line.productId);
    if (existing) {
      write(
        current.map((i) =>
          i.productId === line.productId ? { ...i, quantity: i.quantity + qty } : i
        )
      );
      return { ok: true as const, duplicated: true as const };
    }
    if (current.length >= MAX_ITEMS) {
      return { ok: false as const, reason: `一次最多詢價 ${MAX_ITEMS} 項，請先送出目前的詢價單。` };
    }
    write([...current, { ...line, quantity: qty }]);
    return { ok: true as const, duplicated: false as const };
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const current = read();
    if (quantity <= 0) {
      write(current.filter((i) => i.productId !== productId));
      return;
    }
    write(current.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  }, []);

  const setNote = useCallback((productId: string, note: string) => {
    write(read().map((i) => (i.productId === productId ? { ...i, note } : i)));
  }, []);

  const removeItem = useCallback((productId: string) => {
    write(read().filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => write([]), []);

  const has = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items]
  );

  return {
    items,
    ready,
    count: items.length,
    addItem,
    setQuantity,
    setNote,
    removeItem,
    clear,
    has,
    maxItems: MAX_ITEMS,
  };
}

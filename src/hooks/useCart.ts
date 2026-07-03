"use client";

import { useEffect, useState } from "react";

export interface CartLine {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  groupBuyEventId?: string | null;
  groupBuyProductId?: string | null;
}

const CART_KEY = "sgb_cart";

export function useCart() {
  const [items, setItems] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      setItems([]);
    }
  }, []);

  const persist = (next: CartLine[]) => {
    setItems(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  };

  const addItem = async (item: Omit<CartLine, "quantity"> & { quantity?: number }) => {
    const qty = item.quantity ?? 1;

    try {
      const res = await fetch(`/api/products/${item.productId}`);
      const data = await res.json();
      const product = data.product;
      if (!res.ok || !product) {
        throw new Error("商品不存在");
      }
      if (product.is_active === false || (product.status && product.status !== "active")) {
        throw new Error("此商品已下架");
      }
      if (Number(product.stock) <= 0) {
        throw new Error("此商品已售完");
      }
      const maxQty = Number(product.stock);
      const existing = items.find(
        (i) => i.productId === item.productId && i.groupBuyProductId === item.groupBuyProductId
      );
      const nextQty = (existing?.quantity ?? 0) + qty;
      if (nextQty > maxQty) {
        throw new Error(`庫存不足，最多可購買 ${maxQty} 件`);
      }
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error("無法加入購物車");
    }

    const existing = items.find(
      (i) => i.productId === item.productId && i.groupBuyProductId === item.groupBuyProductId
    );
    if (existing) {
      persist(
        items.map((i) =>
          i.productId === item.productId && i.groupBuyProductId === item.groupBuyProductId
            ? { ...i, quantity: i.quantity + qty }
            : i
        )
      );
    } else {
      persist([...items, { ...item, quantity: qty }]);
    }
  };

  const updateQuantity = (productId: string, quantity: number, groupBuyProductId?: string | null) => {
    if (quantity <= 0) {
      persist(items.filter((i) => !(i.productId === productId && i.groupBuyProductId === groupBuyProductId)));
      return;
    }
    persist(
      items.map((i) =>
        i.productId === productId && i.groupBuyProductId === groupBuyProductId ? { ...i, quantity } : i
      )
    );
  };

  const clear = () => {
    persist([]);
  };

  const removeItem = (productId: string, groupBuyProductId?: string | null) => {
    persist(items.filter((i) => !(i.productId === productId && i.groupBuyProductId === groupBuyProductId)));
  };

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return { items, addItem, updateQuantity, removeItem, clear, total, itemCount };
}

"use client";

import { useRef, type ReactNode } from "react";

type ProductHorizontalScrollerProps = {
  children: ReactNode;
};

/** Horizontal product rail with touch + mouse drag scroll. */
export function ProductHorizontalScroller({ children }: ProductHorizontalScrollerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    drag.current = { active: true, startX: e.clientX, scrollLeft: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    el.scrollLeft = drag.current.scrollLeft - dx;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current.active = false;
    ref.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      ref={ref}
      className="ingredient-shop-scroll -mx-1 flex gap-4 overflow-x-auto px-1 pb-1 pt-1"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    >
      {children}
    </div>
  );
}

"use client";

import { useRef, type ReactNode } from "react";

type ProductHorizontalScrollerProps = {
  children: ReactNode;
};

const DRAG_THRESHOLD_PX = 8;

/**
 * Horizontal product rail with optional mouse drag scroll.
 * Clicks on product cards still navigate — drag only engages after a small movement.
 */
export function ProductHorizontalScroller({ children }: ProductHorizontalScrollerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({
    tracking: false,
    dragging: false,
    suppressClick: false,
    startX: 0,
    scrollLeft: 0,
    pointerId: -1,
  });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = ref.current;
    if (!el) return;
    drag.current = {
      tracking: true,
      dragging: false,
      suppressClick: false,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      pointerId: e.pointerId,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    const state = drag.current;
    if (!el || !state.tracking) return;
    const dx = e.clientX - state.startX;
    if (!state.dragging) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
      state.dragging = true;
      try {
        el.setPointerCapture(state.pointerId);
      } catch {
        /* ignore */
      }
    }
    e.preventDefault();
    el.scrollLeft = state.scrollLeft - dx;
  };

  const endDrag = () => {
    const el = ref.current;
    const state = drag.current;
    if (!state.tracking) return;
    if (state.dragging) {
      state.suppressClick = true;
      if (el) {
        try {
          el.releasePointerCapture(state.pointerId);
        } catch {
          /* ignore */
        }
      }
    }
    state.tracking = false;
    state.dragging = false;
  };

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!drag.current.suppressClick) return;
    e.preventDefault();
    e.stopPropagation();
    drag.current.suppressClick = false;
  };

  return (
    <div
      ref={ref}
      className="ingredient-shop-scroll -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-2 pt-0.5 md:gap-3"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
      onClickCapture={onClickCapture}
    >
      {children}
    </div>
  );
}

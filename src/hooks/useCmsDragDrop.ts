"use client";

import { useCallback, useState, type DragEvent } from "react";

/** Lightweight drag index helper for canvas reordering (no DB writes). */
export function useCmsDragDrop(onReorder: (from: number, to: number) => void) {
  const [draggingFrom, setDraggingFrom] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const onDragStart = useCallback((index: number) => {
    setDraggingFrom(index);
  }, []);

  const onDragOver = useCallback((index: number, e: DragEvent) => {
    e.preventDefault();
    setOverIndex(index);
  }, []);

  const onDrop = useCallback(
    (index: number) => {
      if (draggingFrom != null && draggingFrom !== index) {
        onReorder(draggingFrom, index);
      }
      setDraggingFrom(null);
      setOverIndex(null);
    },
    [draggingFrom, onReorder]
  );

  const onDragEnd = useCallback(() => {
    setDraggingFrom(null);
    setOverIndex(null);
  }, []);

  return {
    draggingFrom,
    overIndex,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
  };
}

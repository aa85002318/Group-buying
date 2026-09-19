"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders the storefront in an iframe at its real viewport width (so a
 * 1440px preview really gets the desktop layout) and scales it down to fit
 * the preview column. The old preview clamped the iframe to the column
 * width (~500px), which made every "desktop" preview render the mobile UI.
 */
export function CmsScaledPreview({
  src,
  width,
  reloadKey,
}: {
  src: string;
  width: number;
  reloadKey?: number | string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setBox({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = box.width > 0 ? Math.min(1, box.width / width) : 1;
  const frameHeight = box.height > 0 ? Math.round(box.height / scale) : 800;

  return (
    <div ref={boxRef} className="relative h-[min(72vh,820px)] w-full overflow-hidden">
      <div
        className="absolute left-1/2 top-0 origin-top overflow-hidden rounded-[10px] border border-[#E9EDF2] bg-white"
        style={{
          width,
          height: frameHeight,
          transform: `translateX(-50%) scale(${scale})`,
        }}
      >
        <iframe
          key={reloadKey}
          title="前台預覽"
          src={src}
          className="h-full w-full border-0 bg-white"
          style={{ width, height: frameHeight }}
        />
      </div>
    </div>
  );
}

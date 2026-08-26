"use client";

import Image from "next/image";

export function RecipeCover({ src, alt }: { src: string | null | undefined; alt: string }) {
  if (!src) return null;
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#FFF5CC] sm:aspect-[16/10]">
      <Image
        src={src}
        alt={alt}
        fill
        priority
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 820px"
      />
    </div>
  );
}

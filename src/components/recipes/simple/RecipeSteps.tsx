"use client";

import Image from "next/image";
import type { RecipeStep } from "@/lib/types/database";

export function RecipeStepItem({ step, index }: { step: RecipeStep; index: number }) {
  const n = String(index + 1).padStart(2, "0");
  return (
    <article className="space-y-4">
      <p className="text-xs font-semibold tracking-[0.2em] text-[#F16458]">STEP {n}</p>
      {step.image_url ? (
        <div className="relative mx-auto aspect-[4/3] w-full max-w-[820px] overflow-hidden rounded-2xl bg-[#FFF5CC]">
          <Image
            src={step.image_url}
            alt={step.title || `步驟 ${n}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 820px"
          />
        </div>
      ) : null}
      {step.title ? <h3 className="text-lg font-semibold text-[#153E73]">{step.title}</h3> : null}
      <p className="whitespace-pre-wrap text-base leading-relaxed text-[#153E73]/90">{step.description}</p>
      {step.note ? <p className="text-sm text-[#8A94A6]">{step.note}</p> : null}
    </article>
  );
}

export function RecipeSteps({ steps }: { steps: RecipeStep[] }) {
  if (!steps.length) return null;
  const ordered = [...steps].sort(
    (a, b) => (a.step_number || a.sort_order) - (b.step_number || b.sort_order)
  );
  return (
    <section className="mt-12 space-y-12">
      <h2 className="text-xl font-semibold text-[#153E73]">製作步驟</h2>
      {ordered.map((step, index) => (
        <div key={step.id}>
          <RecipeStepItem step={step} index={index} />
          {index < ordered.length - 1 ? <hr className="mt-12 border-[#E8E1D7]" /> : null}
        </div>
      ))}
    </section>
  );
}

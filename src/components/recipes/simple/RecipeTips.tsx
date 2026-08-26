"use client";

export function RecipeTips({ tips }: { tips: string | null | undefined }) {
  if (!tips?.trim()) return null;
  return (
    <section className="mt-12 rounded-2xl border border-[#FFE149]/60 bg-[#FFF5CC] px-5 py-4">
      <h2 className="text-base font-semibold text-[#153E73]">小提醒</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#153E73]/90">{tips}</p>
    </section>
  );
}

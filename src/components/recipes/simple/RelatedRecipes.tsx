"use client";

import Link from "next/link";
import Image from "next/image";

type RelatedRecipeCard = {
  id: string;
  title: string;
  slug?: string | null;
  cover_image?: string | null;
};

export function RelatedRecipes({ recipes }: { recipes: RelatedRecipeCard[] }) {
  if (!recipes.length) return null;
  return (
    <section className="mt-14">
      <h2 className="text-xl font-semibold text-[#153E73]">相關食譜</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((r) => (
          <Link
            key={r.id}
            href={`/recipes/${r.slug || r.id}`}
            className="overflow-hidden rounded-2xl border border-[#E8E1D7] bg-white transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="relative aspect-[4/3] bg-[#FFF5CC]">
              {r.cover_image ? (
                <Image src={r.cover_image} alt={r.title} fill className="object-cover" sizes="280px" />
              ) : null}
            </div>
            <p className="px-3 py-3 text-sm font-medium text-[#153E73]">{r.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

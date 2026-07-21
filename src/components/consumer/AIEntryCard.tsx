import Link from "next/link";
import { Sparkles } from "lucide-react";

export function AIEntryCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-[20px] border border-border bg-ai-gradient p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary text-white shadow-brand">
        <Sparkles className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <h3 className="font-bold text-brand-caramel">{title}</h3>
        <p className="mt-1 text-sm text-foreground-secondary">{description}</p>
      </div>
      <span className="text-sm font-bold text-brand-primary">開始使用 →</span>
    </Link>
  );
}

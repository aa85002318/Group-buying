import Link from "next/link";
import { HOME_QUICK_ENTRIES } from "@/lib/navigation";

export function HomeQuickEntry() {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {HOME_QUICK_ENTRIES.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex flex-col gap-1 rounded-xl border border-border bg-white p-4 shadow-card transition-shadow hover:shadow-md"
        >
          <span className="text-2xl" aria-hidden>
            {item.emoji}
          </span>
          <span className="font-medium text-coffee">{item.label}</span>
          <span className="text-xs text-muted-foreground">{item.description}</span>
        </Link>
      ))}
    </section>
  );
}

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="card-surface flex flex-col gap-3 bg-primary-soft p-5">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-primary shadow-sm">
        <Sparkles className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <h3 className="font-black text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-foreground-secondary">{description}</p>
      </div>
      <Link href={href}>
        <Button className="w-full">開始使用</Button>
      </Link>
    </div>
  );
}

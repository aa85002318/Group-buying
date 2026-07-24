import Link from "next/link";
import { cn } from "@/lib/utils";

type AdminMetricCardProps = {
  label: string;
  value: string | number;
  href?: string;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "success" | "info";
};

const TONE: Record<NonNullable<AdminMetricCardProps["tone"]>, string> = {
  default: "border-[#E9DED4] bg-white",
  warning: "border-amber-200 bg-amber-50",
  danger: "border-red-200 bg-red-50",
  success: "border-emerald-200 bg-emerald-50",
  info: "border-sky-200 bg-sky-50",
};

export function AdminMetricCard({
  label,
  value,
  href,
  hint,
  tone = "default",
}: AdminMetricCardProps) {
  const body = (
    <div
      className={cn(
        "rounded-[16px] border p-4 shadow-sm transition",
        TONE[tone],
        href && "hover:border-[#6F4E37]/40 hover:shadow-md"
      )}
    >
      <p className="text-xs font-medium text-[#756B64]">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-[#2F2925]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[#756B64]">{hint}</p> : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {body}
      </Link>
    );
  }
  return body;
}

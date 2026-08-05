import Link from "next/link";
import { ShoppingBasket } from "lucide-react";

export function GroupBuyEmptyState({
  onClearAll,
}: {
  onClearAll: () => void;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl bg-white px-6 py-10 text-center shadow-[0_6px_20px_rgba(21,62,115,0.08)]">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF8FC] text-[#153E73]">
        <ShoppingBasket className="h-7 w-7" strokeWidth={1.5} aria-hidden />
      </span>
      <h3 className="text-base font-bold text-[#153E73]">目前沒有符合條件的團購</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#687386]">
        換個分類看看，或到商城逛逛其他烘焙好物。
      </p>
      <div className="mt-6 flex w-full max-w-xs flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-[#F16458] text-sm font-bold text-white"
          aria-label="查看全部團購"
        >
          查看全部團購
        </button>
        <Link
          href="/shop"
          className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-[#E9EDF2] bg-white text-sm font-semibold text-[#153E73]"
          aria-label="前往商城"
        >
          前往商城
        </Link>
      </div>
    </div>
  );
}

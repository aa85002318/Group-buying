"use client";

type DesktopSidebarFilterProps = {
  categories: string[];
  brands: string[];
  category: string;
  brand: string;
  inStockOnly: boolean;
  sort: "default" | "hot" | "new";
  priceMin: string;
  priceMax: string;
  onCategoryChange: (v: string) => void;
  onBrandChange: (v: string) => void;
  onInStockOnlyChange: (v: boolean) => void;
  onSortChange: (v: "default" | "hot" | "new") => void;
  onPriceMinChange: (v: string) => void;
  onPriceMaxChange: (v: string) => void;
};

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 border-b border-[#EDE6DC] pb-4">
      <p className="text-sm font-bold text-[#153E73]">{title}</p>
      {children}
    </div>
  );
}

export function DesktopSidebarFilter({
  categories,
  brands,
  category,
  brand,
  inStockOnly,
  sort,
  priceMin,
  priceMax,
  onCategoryChange,
  onBrandChange,
  onInStockOnlyChange,
  onSortChange,
  onPriceMinChange,
  onPriceMaxChange,
}: DesktopSidebarFilterProps) {
  return (
    <aside className="sticky top-[92px] h-fit space-y-4 rounded-2xl bg-white p-4">
      <FilterBlock title="分類">
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full rounded-lg border border-[#E5D9C8] bg-[#FFFDF9] px-3 py-2 text-sm"
        >
          <option value="all">全部分類</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FilterBlock>

      <FilterBlock title="品牌">
        <select
          value={brand}
          onChange={(e) => onBrandChange(e.target.value)}
          className="w-full rounded-lg border border-[#E5D9C8] bg-[#FFFDF9] px-3 py-2 text-sm"
        >
          <option value="all">全部品牌</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </FilterBlock>

      <FilterBlock title="價格">
        <div className="flex items-center gap-2">
          <input
            inputMode="numeric"
            placeholder="最低"
            value={priceMin}
            onChange={(e) => onPriceMinChange(e.target.value)}
            className="w-full rounded-lg border border-[#E5D9C8] px-2 py-2 text-sm"
          />
          <span className="text-[#9A7B6C]">–</span>
          <input
            inputMode="numeric"
            placeholder="最高"
            value={priceMax}
            onChange={(e) => onPriceMaxChange(e.target.value)}
            className="w-full rounded-lg border border-[#E5D9C8] px-2 py-2 text-sm"
          />
        </div>
      </FilterBlock>

      <FilterBlock title="庫存">
        <label className="flex items-center gap-2 text-sm text-[#5E4035]">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onInStockOnlyChange(e.target.checked)}
          />
          僅顯示有庫存
        </label>
      </FilterBlock>

      <FilterBlock title="熱門／新品">
        <div className="flex flex-col gap-2 text-sm text-[#5E4035]">
          {(
            [
              ["default", "全部"],
              ["hot", "熱門"],
              ["new", "新品"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2">
              <input
                type="radio"
                name="desktop-shop-sort"
                checked={sort === value}
                onChange={() => onSortChange(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </FilterBlock>
    </aside>
  );
}

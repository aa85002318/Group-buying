"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  AdminProductFormV2,
  ProductVariant,
} from "@/lib/admin/product-form-v2";
import {
  MAX_OPTION_GROUPS,
  MAX_OPTIONS_PER_GROUP,
  MAX_VARIANT_COMBINATIONS,
  countCombinations,
  createEmptyOptionGroup,
  createEmptyOptionValue,
  generateSequentialSkus,
  rebuildVariantsFromGroups,
  type ProductOptionGroup,
  type ProductVariantRow,
} from "@/lib/admin/product-variant-matrix";
import { cn } from "@/lib/utils";

const BRAND = "#FFE149";
const NAVY = "#153E73";
const PAGE = 50;

type Props = {
  form: AdminProductFormV2;
  onChange: (patch: Partial<AdminProductFormV2>) => void;
};

function toRow(v: ProductVariant): ProductVariantRow {
  return {
    id: v.id,
    combination_key: v.combination_key || "",
    option_values: v.option_values || {},
    name: v.name,
    value: v.value,
    sku: v.sku || "",
    barcode: v.barcode || "",
    price: v.price || "",
    sale_price: v.sale_price || "",
    cost_price: v.cost_price || "",
    price_adjustment: v.price_adjustment || "0",
    stock: v.stock || "",
    weight_grams: v.weight_grams || "",
    image_url: v.image_url || "",
    is_active: v.is_active !== false,
    is_default: Boolean(v.is_default),
    sort_order: v.sort_order,
  };
}

function fromRow(v: ProductVariantRow): ProductVariant {
  return {
    id: v.id,
    name: v.name,
    value: v.value,
    price_adjustment: v.price_adjustment,
    stock: v.stock,
    sort_order: v.sort_order,
    combination_key: v.combination_key,
    option_values: v.option_values,
    sku: v.sku,
    barcode: v.barcode,
    price: v.price,
    sale_price: v.sale_price,
    cost_price: v.cost_price,
    weight_grams: v.weight_grams,
    image_url: v.image_url,
    is_active: v.is_active,
    is_default: v.is_default,
  };
}

function SortableRow({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-[#E7EAF0] bg-white px-2 py-2",
        isDragging && "z-10 shadow-md opacity-95",
        className
      )}
    >
      <button
        type="button"
        className="touch-none text-slate-400 hover:text-slate-600"
        aria-label="拖曳排序"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function labelForOption(
  groups: ProductOptionGroup[],
  optionValues: Record<string, string> | undefined,
  groupId: string
): string {
  if (!optionValues) return "—";
  const valueId = optionValues[groupId];
  if (!valueId) return "—";
  const group = groups.find((g) => g.id === groupId);
  return group?.values.find((v) => v.id === valueId)?.label || "—";
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-slate-600">{children}</label>;
}

export function ProductSpecBuilder({ form, onChange }: Props) {
  const groups = form.option_groups ?? [];
  const variants = form.variants ?? [];
  const comboCount = countCombinations(groups);

  const [notice, setNotice] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [addingGroup, setAddingGroup] = useState(false);
  const [editingValue, setEditingValue] = useState<{
    groupId: string;
    valueId: string;
    label: string;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState({
    stock: "",
    price: "",
    cost_price: "",
    weight_kg: "",
    is_active: true as boolean | null,
  });
  const [drawerVariantId, setDrawerVariantId] = useState<string | null>(null);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 2800);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const applyGroups = (nextGroups: ProductOptionGroup[]) => {
    const result = rebuildVariantsFromGroups(
      nextGroups,
      variants.map(toRow),
      {
        price: form.price,
        sale_price: form.price,
        cost_price: form.cost_price,
        stock: form.stock,
        weight_grams: form.weight_grams,
        skuPrefix: form.sku || form.name || "SKU",
      }
    );
    if (result.truncated) {
      flash(
        `目前規格將產生 ${result.estimated} 個 SKU，超過系統上限 ${MAX_VARIANT_COMBINATIONS} 個，請減少規格選項。`
      );
      onChange({ option_groups: nextGroups });
      return;
    }
    onChange({
      option_groups: nextGroups,
      variants: result.variants.map(fromRow),
    });
  };

  const overLimit = comboCount > MAX_VARIANT_COMBINATIONS;

  const filteredVariants = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return variants;
    return variants.filter((v) => {
      const optionLabels = groups
        .map((g) => labelForOption(groups, v.option_values, g.id))
        .join(" ");
      const hay = [v.sku, v.barcode, v.name, v.value, optionLabels]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [variants, search, groups]);

  const pageCount = Math.max(1, Math.ceil(filteredVariants.length / PAGE));
  const pageVariants = filteredVariants.slice(page * PAGE, page * PAGE + PAGE);

  const updateVariant = (id: string, patch: Partial<ProductVariant>) => {
    onChange({
      variants: variants.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    });
  };

  const applyBatchTo = (ids: string[]) => {
    if (ids.length === 0) {
      flash("請先勾選 SKU");
      return;
    }
    const patch: Partial<ProductVariant> = {};
    if (batch.stock !== "") patch.stock = String(Number(batch.stock) || 0);
    if (batch.price !== "") {
      const p = String(Number(batch.price) || 0);
      patch.price = p;
      patch.sale_price = p;
      patch.price_adjustment = String((Number(batch.price) || 0) - (Number(form.price) || 0));
    }
    if (batch.cost_price !== "") patch.cost_price = String(Number(batch.cost_price) || 0);
    if (batch.weight_kg !== "") {
      patch.weight_grams = String(Math.round(Number(batch.weight_kg) * 1000));
    }
    if (batch.is_active !== null) patch.is_active = batch.is_active;

    onChange({
      variants: variants.map((v) => (ids.includes(v.id) ? { ...v, ...patch } : v)),
    });
    flash(`已套用至 ${ids.length} 筆 SKU`);
  };

  const autoGenerateSkus = () => {
    const skus = generateSequentialSkus(form.sku || form.name || "SKU", variants.length);
    onChange({
      variants: variants.map((v, i) => ({ ...v, sku: skus[i] || v.sku })),
    });
    flash("已自動產生 SKU");
  };

  const skuDupes = useMemo(() => {
    const seen = new Map<string, number>();
    for (const v of variants) {
      const s = (v.sku || "").trim().toLowerCase();
      if (!s) continue;
      seen.set(s, (seen.get(s) || 0) + 1);
    }
    const dupes = new Set<string>();
    seen.forEach((n, s) => {
      if (n > 1) dupes.add(s);
    });
    return dupes;
  }, [variants]);

  const drawerVariant = variants.find((v) => v.id === drawerVariantId) || null;

  const onGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = groups.findIndex((g) => g.id === active.id);
    const newIndex = groups.findIndex((g) => g.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    applyGroups(
      arrayMove(groups, oldIndex, newIndex).map((g, i) => ({ ...g, sort_order: i }))
    );
  };

  const onValueDragEnd = (groupId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const next = groups.map((g) => {
      if (g.id !== groupId) return g;
      const oldIndex = g.values.findIndex((v) => v.id === active.id);
      const newIndex = g.values.findIndex((v) => v.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return g;
      return {
        ...g,
        values: arrayMove(g.values, oldIndex, newIndex).map((v, i) => ({
          ...v,
          sort_order: i,
        })),
      };
    });
    applyGroups(next);
  };

  const removeGroup = (groupId: string) => {
    const next = groups.filter((g) => g.id !== groupId);
    const before = countCombinations(groups);
    const after = countCombinations(next);
    const removed = Math.max(0, before - after);
    setConfirmDelete({
      title: "刪除商品樣式",
      message:
        removed > 0
          ? `刪除此規格後，將移除約 ${removed} 個 SKU 組合。是否繼續？`
          : "確定刪除此樣式？",
      onConfirm: () => {
        applyGroups(next.map((g, i) => ({ ...g, sort_order: i })));
        setConfirmDelete(null);
      },
    });
  };

  const removeValue = (groupId: string, valueId: string) => {
    const next = groups.map((g) =>
      g.id === groupId
        ? {
            ...g,
            values: g.values
              .filter((v) => v.id !== valueId)
              .map((v, i) => ({ ...v, sort_order: i })),
          }
        : g
    );
    const before = countCombinations(groups);
    const after = countCombinations(next);
    const removed = Math.max(0, before - after);
    setConfirmDelete({
      title: "刪除規格項目",
      message:
        removed > 0
          ? `刪除此規格後，將移除約 ${removed} 個 SKU 組合。是否繼續？`
          : "確定刪除此項目？",
      onConfirm: () => {
        applyGroups(next);
        setConfirmDelete(null);
      },
    });
  };

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((ids) => (checked ? [...ids, id] : ids.filter((x) => x !== id)));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-5">
        {notice ? (
          <p className="rounded-lg border border-[#E7EAF0] bg-[#F7F8FA] px-3 py-2 text-sm" style={{ color: NAVY }}>
            {notice}
          </p>
        ) : null}

        <div className="rounded-[14px] border border-[#E7EAF0] bg-white p-4 sm:p-5">
          <h3 className="text-base font-semibold" style={{ color: NAVY }}>
            商品樣式／規格設定
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            可建立多種商品規格，例如：規格、重量、口味、包裝、尺寸、顏色等。系統會依各規格項目自動產生
            SKU 組合。
          </p>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onGroupDragEnd}>
            <SortableContext items={groups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
              <div className="mt-4 space-y-3">
                {groups.map((group, gi) => (
                  <SortableRow key={group.id} id={group.id} className="!items-stretch !flex-col !p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400">樣式{gi + 1}</span>
                      <Input
                        value={group.name}
                        maxLength={60}
                        onChange={(e) => {
                          const name = e.target.value.slice(0, 60);
                          applyGroups(
                            groups.map((g) => (g.id === group.id ? { ...g, name } : g))
                          );
                        }}
                        className="h-[42px] max-w-[220px] rounded-lg"
                        placeholder="規格名稱"
                      />
                      <button
                        type="button"
                        className="ml-auto text-slate-400 hover:text-red-500"
                        onClick={() => removeGroup(group.id)}
                        aria-label="刪除樣式"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={onValueDragEnd(group.id)}
                    >
                      <SortableContext
                        items={group.values.map((v) => v.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2 pl-1">
                          {group.values.map((val) => (
                            <SortableRow key={val.id} id={val.id}>
                              <span className="truncate text-sm text-slate-800">{val.label}</span>
                              <div className="ml-auto flex shrink-0 items-center gap-1">
                                <button
                                  type="button"
                                  className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                  onClick={() =>
                                    setEditingValue({
                                      groupId: group.id,
                                      valueId: val.id,
                                      label: val.label,
                                    })
                                  }
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                                  onClick={() => removeValue(group.id, val.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </SortableRow>
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>

                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-2 h-10 justify-start text-[#32B7D0]"
                      disabled={group.values.length >= MAX_OPTIONS_PER_GROUP}
                      onClick={() => {
                        const label = window.prompt("規格項目名稱");
                        if (!label?.trim()) return;
                        applyGroups(
                          groups.map((g) =>
                            g.id === group.id
                              ? {
                                  ...g,
                                  values: [
                                    ...g.values,
                                    createEmptyOptionValue(label.trim(), g.values.length),
                                  ],
                                }
                              : g
                          )
                        );
                      }}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      新增規格項目
                    </Button>
                  </SortableRow>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {addingGroup ? (
            <div className="mt-3 flex flex-wrap items-end gap-2 rounded-[14px] border border-dashed border-[#E7EAF0] bg-[#F7F8FA] p-3">
              <div className="min-w-[200px] flex-1 space-y-1">
                <FieldLabel>樣式名稱</FieldLabel>
                <Input
                  value={newGroupName}
                  maxLength={60}
                  placeholder="例如：規格、包裝、重量、口味、尺寸"
                  className="h-[42px] rounded-lg"
                  onChange={(e) => setNewGroupName(e.target.value.slice(0, 60))}
                />
              </div>
              <Button
                type="button"
                className="h-10"
                style={{ backgroundColor: BRAND, color: NAVY }}
                onClick={() => {
                  if (!newGroupName.trim()) {
                    flash("請輸入樣式名稱");
                    return;
                  }
                  if (groups.length >= MAX_OPTION_GROUPS) {
                    flash(`最多 ${MAX_OPTION_GROUPS} 個樣式群組`);
                    return;
                  }
                  applyGroups([
                    ...groups,
                    createEmptyOptionGroup(newGroupName.trim(), groups.length),
                  ]);
                  setNewGroupName("");
                  setAddingGroup(false);
                }}
              >
                <Check className="mr-1 h-4 w-4" />
                新增
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={() => {
                  setAddingGroup(false);
                  setNewGroupName("");
                }}
              >
                取消
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="mt-3 h-10 border-dashed"
              disabled={groups.length >= MAX_OPTION_GROUPS}
              onClick={() => setAddingGroup(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              新增商品樣式
            </Button>
          )}

          {overLimit && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              目前規格將產生 {comboCount} 個 SKU，超過系統上限 {MAX_VARIANT_COMBINATIONS}{" "}
              個，請減少規格選項。
            </div>
          )}
        </div>

        <div className="rounded-[14px] border border-[#E7EAF0] bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold" style={{ color: NAVY }}>
              批次設定庫存／價格
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="h-10" onClick={autoGenerateSkus}>
                <Wand2 className="mr-1 h-4 w-4" />
                自動產生 SKU
              </Button>
              <Button
                type="button"
                className="h-10"
                style={{ backgroundColor: BRAND, color: NAVY }}
                onClick={() => applyBatchTo(variants.map((v) => v.id))}
              >
                全部套用
              </Button>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {(
              [
                ["stock", "庫存"],
                ["price", "售價"],
                ["cost_price", "成本價"],
                ["weight_kg", "重量 kg"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <FieldLabel>{label}</FieldLabel>
                <Input
                  type="number"
                  className="h-[42px] rounded-lg"
                  value={batch[key]}
                  onChange={(e) => setBatch((b) => ({ ...b, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="space-y-1">
              <FieldLabel>上架狀態</FieldLabel>
              <button
                type="button"
                className="flex h-[42px] w-full items-center justify-between rounded-lg border border-[#E7EAF0] px-3 text-sm"
                onClick={() =>
                  setBatch((b) => ({ ...b, is_active: b.is_active === false ? true : false }))
                }
              >
                <span>{batch.is_active !== false ? "上架" : "下架"}</span>
                <span
                  className={cn(
                    "h-5 w-9 rounded-full p-0.5 transition",
                    batch.is_active !== false ? "bg-[#35B979]" : "bg-slate-300"
                  )}
                >
                  <span
                    className={cn(
                      "block h-4 w-4 rounded-full bg-white transition",
                      batch.is_active !== false && "translate-x-4"
                    )}
                  />
                </span>
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            官網庫存為 variant.stock；門市庫存仍依既有 inventory 邏輯，不在此合併。
          </p>
        </div>

        <div className="rounded-[14px] border border-[#E7EAF0] bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold" style={{ color: NAVY }}>
              規格列表
              <span className="ml-2 text-sm font-normal text-slate-500">
                共 {variants.length} 個組合
              </span>
            </h3>
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="搜尋 SKU / 條碼 / 規格"
              className="h-[42px] max-w-xs rounded-lg"
            />
          </div>

          {selectedIds.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#E7EAF0] bg-[#F7F8FA] px-3 py-2 text-sm">
              <span>已選 {selectedIds.length} 筆</span>
              <Button
                type="button"
                size="sm"
                className="h-8"
                style={{ backgroundColor: BRAND, color: NAVY }}
                onClick={() => applyBatchTo(selectedIds)}
              >
                批次編輯套用
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() =>
                  onChange({
                    variants: variants.map((v) =>
                      selectedIds.includes(v.id) ? { ...v, is_active: true } : v
                    ),
                  })
                }
              >
                上架
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() =>
                  onChange({
                    variants: variants.map((v) =>
                      selectedIds.includes(v.id) ? { ...v, is_active: false } : v
                    ),
                  })
                }
              >
                下架
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="h-8"
                onClick={() => {
                  setConfirmDelete({
                    title: "刪除 SKU",
                    message: `將刪除已選 ${selectedIds.length} 筆 SKU 組合。是否繼續？`,
                    onConfirm: () => {
                      onChange({
                        variants: variants.filter((v) => !selectedIds.includes(v.id)),
                      });
                      setSelectedIds([]);
                      setConfirmDelete(null);
                    },
                  });
                }}
              >
                刪除
              </Button>
            </div>
          )}

          <div className="mt-3 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E7EAF0] text-slate-500">
                  <th className="w-10 py-2">
                    <input
                      type="checkbox"
                      checked={
                        pageVariants.length > 0 &&
                        pageVariants.every((v) => selectedIds.includes(v.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds((ids) =>
                            Array.from(new Set([...ids, ...pageVariants.map((v) => v.id)]))
                          );
                        } else {
                          const drop = new Set(pageVariants.map((v) => v.id));
                          setSelectedIds((ids) => ids.filter((id) => !drop.has(id)));
                        }
                      }}
                    />
                  </th>
                  <th className="py-2 pr-2">圖片</th>
                  <th className="py-2 pr-2">SKU *</th>
                  {groups.map((g) => (
                    <th key={g.id} className="py-2 pr-2">
                      {g.name || "規格"}
                    </th>
                  ))}
                  {groups.length === 0 && <th className="py-2 pr-2">規格</th>}
                  <th className="py-2 pr-2">官網庫存</th>
                  <th className="py-2 pr-2">售價</th>
                  <th className="py-2 pr-2">成本價</th>
                  <th className="py-2 pr-2">重量 kg</th>
                  <th className="py-2 pr-2">條碼</th>
                  <th className="py-2 pr-2">狀態</th>
                  <th className="py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {pageVariants.map((v) => {
                  const skuKey = (v.sku || "").trim().toLowerCase();
                  const isDup = Boolean(skuKey && skuDupes.has(skuKey));
                  return (
                    <tr key={v.id} className="border-b border-[#E7EAF0]/50">
                      <td className="py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(v.id)}
                          onChange={(e) => toggleSelected(v.id, e.target.checked)}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        {v.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={v.image_url}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100 text-[10px] text-slate-400">
                            主圖
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          value={v.sku || ""}
                          className={cn(
                            "h-9 w-32 rounded-lg",
                            isDup && "border-red-400 focus-visible:ring-red-400"
                          )}
                          onChange={(e) => updateVariant(v.id, { sku: e.target.value })}
                        />
                        {isDup && (
                          <p className="mt-0.5 text-[11px] text-red-500">此 SKU 已存在。</p>
                        )}
                      </td>
                      {groups.length > 0 ? (
                        groups.map((g) => (
                          <td key={g.id} className="py-2 pr-2 text-slate-700">
                            {labelForOption(groups, v.option_values, g.id)}
                          </td>
                        ))
                      ) : (
                        <td className="py-2 pr-2">{v.value || v.name || "—"}</td>
                      )}
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          className="h-9 w-20 rounded-lg"
                          value={v.stock}
                          onChange={(e) => updateVariant(v.id, { stock: e.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          className="h-9 w-20 rounded-lg"
                          value={v.sale_price || v.price || ""}
                          onChange={(e) => {
                            const price = e.target.value;
                            updateVariant(v.id, {
                              price,
                              sale_price: price,
                              price_adjustment: String(
                                (Number(price) || 0) - (Number(form.price) || 0)
                              ),
                            });
                          }}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          className="h-9 w-20 rounded-lg"
                          value={v.cost_price || ""}
                          onChange={(e) => updateVariant(v.id, { cost_price: e.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          step="0.001"
                          className="h-9 w-20 rounded-lg"
                          value={v.weight_grams ? String(Number(v.weight_grams) / 1000) : ""}
                          onChange={(e) =>
                            updateVariant(v.id, {
                              weight_grams:
                                e.target.value === ""
                                  ? ""
                                  : String(Math.round(Number(e.target.value) * 1000)),
                            })
                          }
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          className="h-9 w-28 rounded-lg"
                          value={v.barcode || ""}
                          onChange={(e) => updateVariant(v.id, { barcode: e.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <button
                          type="button"
                          className="text-xs font-medium"
                          style={{ color: v.is_active !== false ? "#35B979" : "#8A94A6" }}
                          onClick={() =>
                            updateVariant(v.id, { is_active: v.is_active === false })
                          }
                        >
                          {v.is_active !== false ? "上架" : "下架"}
                        </button>
                      </td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                            onClick={() => setDrawerVariantId(v.id)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-500"
                            onClick={() => {
                              setConfirmDelete({
                                title: "刪除 SKU",
                                message: "確定刪除此 SKU 組合？",
                                onConfirm: () => {
                                  onChange({
                                    variants: variants.filter((x) => x.id !== v.id),
                                  });
                                  setConfirmDelete(null);
                                },
                              });
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 space-y-3 md:hidden">
            {pageVariants.map((v) => (
              <div
                key={v.id}
                className="rounded-[14px] border border-[#E7EAF0] bg-[#F7F8FA] p-3"
              >
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selectedIds.includes(v.id)}
                    onChange={(e) => toggleSelected(v.id, e.target.checked)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{v.value || v.name}</p>
                    <p className="mt-1 text-sm text-slate-500">SKU {v.sku || "—"}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm">
                      <span>庫存 {v.stock || 0}</span>
                      <span>售價 ${v.sale_price || v.price || 0}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2 h-10"
                      onClick={() => setDrawerVariantId(v.id)}
                    >
                      編輯
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pageCount > 1 && (
            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
              <span>
                第 {page + 1} / {pageCount} 頁（每頁 {PAGE} 筆）
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  上一頁
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9"
                  disabled={page >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                >
                  下一頁
                </Button>
              </div>
            </div>
          )}

          {variants.length === 0 && (
            <p className="mt-4 text-center text-sm text-slate-500">
              請先新增樣式與規格項目，系統會自動產生 SKU 組合。
            </p>
          )}
        </div>
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-24 space-y-4 rounded-[14px] border border-[#E7EAF0] bg-white p-4">
          <div>
            <h4 className="font-semibold" style={{ color: NAVY }}>
              規格說明
            </h4>
            <ol className="mt-2 list-decimal space-y-2 pl-4 text-sm text-slate-600">
              <li>規格可設定：重量、口味、尺寸、包裝。</li>
              <li>每個規格組合會產生一個 SKU。</li>
              <li>每個 SKU 可以設定：價格、庫存、重量、條碼、圖片。</li>
            </ol>
          </div>
          <div
            className="rounded-lg px-3 py-3 text-center"
            style={{ backgroundColor: BRAND, color: NAVY }}
          >
            <p className="text-xs font-medium">SKU 預覽</p>
            <p className="mt-1 text-2xl font-bold">{variants.length}</p>
            <p className="text-xs">共 {variants.length} 個組合</p>
          </div>
        </div>
      </aside>

      {editingValue ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[14px] bg-white p-5 shadow-xl">
            <h4 className="font-semibold" style={{ color: NAVY }}>
              編輯規格項目
            </h4>
            <Input
              className="mt-3 h-[42px] rounded-lg"
              value={editingValue.label}
              maxLength={80}
              onChange={(e) =>
                setEditingValue({ ...editingValue, label: e.target.value.slice(0, 80) })
              }
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingValue(null)}>
                取消
              </Button>
              <Button
                type="button"
                style={{ backgroundColor: BRAND, color: NAVY }}
                onClick={() => {
                  applyGroups(
                    groups.map((g) =>
                      g.id === editingValue.groupId
                        ? {
                            ...g,
                            values: g.values.map((v) =>
                              v.id === editingValue.valueId
                                ? { ...v, label: editingValue.label.trim() }
                                : v
                            ),
                          }
                        : g
                    )
                  );
                  setEditingValue(null);
                }}
              >
                儲存
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[14px] bg-white p-5 shadow-xl">
            <h4 className="font-semibold" style={{ color: NAVY }}>
              {confirmDelete.title}
            </h4>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
              {confirmDelete.message}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirmDelete(null)}>
                取消
              </Button>
              <Button type="button" variant="destructive" onClick={() => confirmDelete.onConfirm()}>
                確認刪除
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {drawerVariant ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold" style={{ color: NAVY }}>
                編輯 SKU
              </h4>
              <button type="button" onClick={() => setDrawerVariantId(null)}>
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">{drawerVariant.value}</p>
            <div className="mt-4 space-y-3">
              {(
                [
                  ["sku", "SKU"],
                  ["barcode", "條碼"],
                  ["image_url", "商品圖片 URL"],
                  ["sale_price", "售價"],
                  ["cost_price", "成本價"],
                  ["stock", "庫存"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <FieldLabel>{label}</FieldLabel>
                  <Input
                    type={
                      key === "sale_price" || key === "cost_price" || key === "stock"
                        ? "number"
                        : "text"
                    }
                    className="h-[42px] rounded-lg"
                    value={(drawerVariant[key] as string) || ""}
                    onChange={(e) => {
                      if (key === "sale_price") {
                        const price = e.target.value;
                        updateVariant(drawerVariant.id, {
                          sale_price: price,
                          price,
                          price_adjustment: String(
                            (Number(price) || 0) - (Number(form.price) || 0)
                          ),
                        });
                      } else {
                        updateVariant(drawerVariant.id, { [key]: e.target.value });
                      }
                    }}
                  />
                </div>
              ))}
              <div className="space-y-1">
                <FieldLabel>重量 kg</FieldLabel>
                <Input
                  type="number"
                  step="0.001"
                  className="h-[42px] rounded-lg"
                  value={
                    drawerVariant.weight_grams
                      ? String(Number(drawerVariant.weight_grams) / 1000)
                      : ""
                  }
                  onChange={(e) =>
                    updateVariant(drawerVariant.id, {
                      weight_grams:
                        e.target.value === ""
                          ? ""
                          : String(Math.round(Number(e.target.value) * 1000)),
                    })
                  }
                />
              </div>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg border border-[#E7EAF0] px-3 py-2 text-sm"
                onClick={() =>
                  updateVariant(drawerVariant.id, {
                    is_active: drawerVariant.is_active === false,
                  })
                }
              >
                <span>上架狀態</span>
                <span>{drawerVariant.is_active !== false ? "上架" : "下架"}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

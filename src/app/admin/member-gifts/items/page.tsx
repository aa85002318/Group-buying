"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GIFT_ITEM_SELECTION_LABEL, type GiftItemSelectionMode } from "@/lib/gifts/types";

type ItemRow = {
  id: string;
  gift_name: string;
  gift_code?: string | null;
  product_sku?: string | null;
  description?: string | null;
  quantity_per_redeem?: number;
  cost_amount?: number | null;
  requires_store_prep?: boolean;
  allow_substitute_when_oos?: boolean;
  substitute_item_id?: string | null;
  total_quantity?: number | null;
  reserved_quantity?: number;
  redeemed_quantity?: number;
  is_active?: boolean;
  campaign_id?: string;
  gift_campaigns?: {
    name?: string;
    campaign_code?: string;
    item_selection_mode?: GiftItemSelectionMode;
  } | null;
};

type CampaignOpt = {
  id: string;
  name: string;
  item_selection_mode?: GiftItemSelectionMode;
};

export default function MemberGiftItemsPage() {
  const [items, setItems] = useState<ItemRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOpt[]>([]);
  const [filterCampaign, setFilterCampaign] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [form, setForm] = useState({
    campaign_id: "",
    gift_name: "",
    gift_code: "",
    product_sku: "",
    description: "",
    quantity_per_redeem: "1",
    cost_amount: "",
    total_quantity: "",
    requires_store_prep: true,
    allow_substitute_when_oos: false,
    substitute_item_id: "",
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    const qs = filterCampaign ? `?campaign_id=${encodeURIComponent(filterCampaign)}` : "";
    Promise.all([
      fetch(`/api/admin/member-gifts/items${qs}`).then((r) => r.json()),
      fetch("/api/admin/member-gifts").then((r) => r.json()),
    ]).then(([itemsData, campData]) => {
      setItems(itemsData.items ?? []);
      setWarning(itemsData.warning ?? null);
      setCampaigns(
        (campData.campaigns ?? []).map(
          (c: { id: string; name: string; item_selection_mode?: GiftItemSelectionMode }) => ({
            id: c.id,
            name: c.name,
            item_selection_mode: c.item_selection_mode,
          })
        )
      );
      if (!form.campaign_id && campData.campaigns?.[0]?.id) {
        setForm((f) => ({ ...f, campaign_id: campData.campaigns[0].id }));
      }
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCampaign]);

  const selectedMode = useMemo(() => {
    const c = campaigns.find((x) => x.id === (form.campaign_id || filterCampaign));
    return c?.item_selection_mode ?? "single";
  }, [campaigns, form.campaign_id, filterCampaign]);

  const substituteOptions = useMemo(
    () => items.filter((i) => i.campaign_id === form.campaign_id || !form.campaign_id),
    [items, form.campaign_id]
  );

  const create = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/member-gifts/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity_per_redeem: Number(form.quantity_per_redeem),
          cost_amount: form.cost_amount ? Number(form.cost_amount) : null,
          total_quantity: form.total_quantity ? Number(form.total_quantity) : null,
          substitute_item_id: form.substitute_item_id || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "建立失敗");
      setForm((f) => ({
        ...f,
        gift_name: "",
        gift_code: "",
        product_sku: "",
        description: "",
        cost_amount: "",
        total_quantity: "",
        substitute_item_id: "",
        allow_substitute_when_oos: false,
      }));
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "建立失敗");
    } finally {
      setSaving(false);
    }
  };

  const patchItem = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch("/api/admin/member-gifts/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "更新失敗");
      return;
    }
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("確定刪除此品項？")) return;
    const res = await fetch(`/api/admin/member-gifts/items?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "刪除失敗");
      return;
    }
    load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="兌換品項"
        description="可設定品項獨立庫存與缺貨替代品；搭配活動「多品項選擇方式」決定如何選品"
      />

      {warning ? (
        <p className="rounded-xl bg-[#FFF5CC] px-3 py-2 text-sm text-[#153E73]">
          品項資料表尚未就緒：{warning}（請套用 migration）
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs">
          篩選活動
          <select
            className="input-field mt-1 min-w-[220px]"
            value={filterCampaign}
            onChange={(e) => setFilterCampaign(e.target.value)}
          >
            <option value="">全部活動</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-[#8A94A6]">
          目前選擇活動模式：
          {GIFT_ITEM_SELECTION_LABEL[selectedMode] ?? selectedMode}
        </p>
      </div>

      <section className="grid gap-2 rounded-2xl border border-[#E7EAF0] bg-white p-4 md:grid-cols-3">
        <select
          className="input-field"
          value={form.campaign_id}
          onChange={(e) => setForm((f) => ({ ...f, campaign_id: e.target.value }))}
        >
          <option value="">選擇活動</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Input
          placeholder="贈品名稱"
          value={form.gift_name}
          onChange={(e) => setForm((f) => ({ ...f, gift_name: e.target.value }))}
        />
        <Input
          placeholder="贈品編號"
          value={form.gift_code}
          onChange={(e) => setForm((f) => ({ ...f, gift_code: e.target.value }))}
        />
        <Input
          placeholder="對應 SKU（選填）"
          value={form.product_sku}
          onChange={(e) => setForm((f) => ({ ...f, product_sku: e.target.value }))}
        />
        <Input
          placeholder="每次兌換數量"
          value={form.quantity_per_redeem}
          onChange={(e) => setForm((f) => ({ ...f, quantity_per_redeem: e.target.value }))}
        />
        <Input
          placeholder="成本金額"
          value={form.cost_amount}
          onChange={(e) => setForm((f) => ({ ...f, cost_amount: e.target.value }))}
        />
        <Input
          placeholder="品項庫存上限（空＝不限）"
          value={form.total_quantity}
          onChange={(e) => setForm((f) => ({ ...f, total_quantity: e.target.value }))}
        />
        <Input
          className="md:col-span-2"
          placeholder="贈品說明"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={form.requires_store_prep}
            onChange={(e) => setForm((f) => ({ ...f, requires_store_prep: e.target.checked }))}
          />
          需門市備貨
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={form.allow_substitute_when_oos}
            onChange={(e) =>
              setForm((f) => ({ ...f, allow_substitute_when_oos: e.target.checked }))
            }
          />
          缺貨時允許替代
        </label>
        <select
          className="input-field"
          value={form.substitute_item_id}
          onChange={(e) => setForm((f) => ({ ...f, substitute_item_id: e.target.value }))}
          disabled={!form.allow_substitute_when_oos}
        >
          <option value="">替代品（選填）</option>
          {substituteOptions.map((i) => (
            <option key={i.id} value={i.id}>
              {i.gift_name}
            </option>
          ))}
        </select>
        <Button disabled={saving || !form.campaign_id || !form.gift_name} onClick={() => void create()}>
          新增品項
        </Button>
      </section>

      <ul className="space-y-2">
        {items.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-[#E7EAF0] px-4 py-8 text-center text-sm text-[#8A94A6]">
            尚無兌換品項
          </li>
        ) : (
          items.map((item) => {
            const rem =
              item.total_quantity == null
                ? null
                : Math.max(
                    0,
                    Number(item.total_quantity) -
                      Number(item.reserved_quantity ?? 0) -
                      Number(item.redeemed_quantity ?? 0)
                  );
            const subName = items.find((x) => x.id === item.substitute_item_id)?.gift_name;
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E7EAF0] bg-white px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-[#153E73]">
                    {item.gift_name}
                    {item.is_active === false ? (
                      <span className="ml-2 text-[11px] font-normal text-[#8A94A6]">（停用）</span>
                    ) : null}
                    {rem === 0 ? (
                      <span className="ml-2 text-[11px] font-normal text-[#B42318]">缺貨</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-[#8A94A6]">
                    {item.gift_campaigns?.name ?? "活動"}
                    {item.gift_code ? ` · ${item.gift_code}` : ""}
                    {item.product_sku ? ` · SKU ${item.product_sku}` : ""}
                    {" · 每次 "}
                    {item.quantity_per_redeem ?? 1} 份
                    {item.cost_amount != null ? ` · 成本 $${Number(item.cost_amount)}` : ""}
                    {rem != null ? ` · 品項剩餘 ${rem}` : ""}
                    {item.allow_substitute_when_oos
                      ? ` · 缺貨替代：${subName ?? "未指定"}`
                      : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void patchItem(item.id, { is_active: !item.is_active })}
                  >
                    {item.is_active === false ? "啟用" : "停用"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void remove(item.id)}>
                    刪除
                  </Button>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GiftImageCropUpload } from "@/components/admin/member-gifts/GiftImageCropUpload";
import { GiftEntityPicker } from "@/components/admin/member-gifts/GiftEntityPicker";
import {
  GIFT_CAMPAIGN_STATUS_LABEL,
  GIFT_CAMPAIGN_TYPE_LABEL,
  GIFT_ELIGIBILITY_LABEL,
  GIFT_UI_STATUS_LABEL,
  type GiftCampaignStatus,
  type GiftCampaignType,
  type GiftEligibilityType,
  type GiftMemberUiStatus,
} from "@/lib/gifts/types";

const GIFT_IMAGE_MAX = 2 * 1024 * 1024;

type StoreLite = { id: string; name: string; is_active?: boolean };

type StoreInvRow = {
  store_id: string;
  store_name?: string;
  allocated_quantity: number;
  reserved_quantity?: number;
  redeemed_quantity?: number;
  remaining?: number;
  low_stock_threshold?: number | null;
};

type TabId = "basic" | "rules" | "inventory" | "frontend" | "claims";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "basic", label: "基本資料" },
  { id: "rules", label: "兌換條件" },
  { id: "inventory", label: "門市與庫存" },
  { id: "frontend", label: "前台預覽" },
  { id: "claims", label: "領取紀錄" },
];

function csvToIds(raw: string): string[] {
  return raw
    .split(/[\n,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toLocalInput(iso: unknown): string {
  if (!iso) return "";
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function CampaignEditor(props: {
  campaignId: string;
  campaign: Record<string, unknown>;
  claims: Array<Record<string, unknown>>;
  onCampaignChange: (next: Record<string, unknown>) => void;
  onSaved: (campaign: Record<string, unknown>) => void;
}) {
  const { campaignId, campaign, claims, onCampaignChange, onSaved } = props;
  const [tab, setTab] = useState<TabId>("basic");
  const [saving, setSaving] = useState(false);
  const [stores, setStores] = useState<StoreLite[]>([]);
  const [invRows, setInvRows] = useState<StoreInvRow[]>([]);
  const [invSaving, setInvSaving] = useState(false);
  const [previewStatus, setPreviewStatus] = useState<GiftMemberUiStatus>("claimable");
  const [memberIdsText, setMemberIdsText] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const productIds = Array.isArray(campaign.applicable_product_ids)
    ? (campaign.applicable_product_ids as string[])
    : [];
  const categoryIds = Array.isArray(campaign.applicable_category_ids)
    ? (campaign.applicable_category_ids as string[])
    : [];
  const excludedProductIds = Array.isArray(campaign.excluded_product_ids)
    ? (campaign.excluded_product_ids as string[])
    : [];

  const set = (key: string, value: unknown) =>
    onCampaignChange({ ...campaign, [key]: value });

  useEffect(() => {
    setMemberIdsText(
      Array.isArray(campaign.eligible_member_ids)
        ? (campaign.eligible_member_ids as string[]).join("\n")
        : ""
    );
    setTagsText(
      Array.isArray(campaign.eligible_member_tags)
        ? (campaign.eligible_member_tags as string[]).join(", ")
        : ""
    );
  }, [campaign.id, campaign.eligible_member_ids, campaign.eligible_member_tags]);

  useEffect(() => {
    fetch(`/api/admin/member-gifts/${campaignId}/store-inventory`)
      .then((r) => r.json())
      .then((d) => {
        setStores(d.stores ?? []);
        const inv: StoreInvRow[] = d.inventory ?? [];
        if (inv.length) {
          setInvRows(inv);
        } else {
          setInvRows(
            (d.stores ?? [])
              .filter((s: StoreLite) => s.is_active !== false)
              .map((s: StoreLite) => ({
                store_id: s.id,
                store_name: s.name,
                allocated_quantity: 0,
                reserved_quantity: 0,
                redeemed_quantity: 0,
                remaining: 0,
                low_stock_threshold: 10,
              }))
          );
        }
      })
      .catch(() => {});
  }, [campaignId]);

  const remainingShared = useMemo(() => {
    return Math.max(
      0,
      Number(campaign.total_quantity ?? 0) -
        Number(campaign.reserved_quantity ?? 0) -
        Number(campaign.redeemed_quantity ?? 0)
    );
  }, [campaign]);

  const saveCampaign = async () => {
    setSaving(true);
    try {
      const payload = {
        ...campaign,
        eligible_member_ids: csvToIds(memberIdsText),
        eligible_member_tags: tagsText
          .split(/[,，]/)
          .map((s) => s.trim())
          .filter(Boolean),
        applicable_product_ids: productIds,
        applicable_category_ids: categoryIds,
        excluded_product_ids: excludedProductIds,
      };
      const res = await fetch(`/api/admin/member-gifts/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      onSaved(d.campaign);
      alert("活動已儲存");
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const saveInventory = async () => {
    setInvSaving(true);
    try {
      const res = await fetch(`/api/admin/member-gifts/${campaignId}/store-inventory`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replace: true,
          inventory: invRows.map((r) => ({
            store_id: r.store_id,
            allocated_quantity: Number(r.allocated_quantity) || 0,
            low_stock_threshold: Number(r.low_stock_threshold ?? 10),
          })),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "庫存儲存失敗");
      alert("門市庫存已儲存");
    } catch (e) {
      alert(e instanceof Error ? e.message : "庫存儲存失敗");
    } finally {
      setInvSaving(false);
    }
  };

  const importMembers = async (file: File | null, mode: "merge" | "replace") => {
    if (!file && !memberIdsText.trim()) {
      alert("請選擇 CSV 或貼上會員編號");
      return;
    }
    setImportBusy(true);
    setImportResult(null);
    try {
      const form = new FormData();
      form.append("mode", mode);
      if (file) form.append("file", file);
      else form.append("text", memberIdsText);
      const res = await fetch(`/api/admin/member-gifts/${campaignId}/members/import`, {
        method: "POST",
        body: form,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "匯入失敗");
      const ids = (d.eligible_member_ids as string[]) ?? [];
      setMemberIdsText(ids.join("\n"));
      onCampaignChange({
        ...campaign,
        eligible_member_ids: ids,
        eligibility_type: "member_list",
      });
      setImportResult(
        `已匹配 ${d.matched} 人${d.unresolved?.length ? `，未找到 ${d.unresolved.length} 筆` : ""}`
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "匯入失敗");
    } finally {
      setImportBusy(false);
    }
  };

  const toggleStoreId = (field: string, storeId: string) => {
    const cur = Array.isArray(campaign[field]) ? ([...(campaign[field] as string[])] as string[]) : [];
    const next = cur.includes(storeId) ? cur.filter((id) => id !== storeId) : [...cur, storeId];
    set(field, next);
  };

  const previewButton = () => {
    if (previewStatus === "not_started") return "即將開放";
    if (previewStatus === "claimable") return String(campaign.claim_button_label || "立即領取");
    if (previewStatus === "redeemable" || previewStatus === "claimed") return "出示兌換條碼";
    if (previewStatus === "ineligible") return "尚未符合兌換條件";
    if (previewStatus === "exhausted" || previewStatus === "sold_out")
      return String(campaign.sold_out_label || "兌換完畢");
    if (previewStatus === "redeemed") return "已兌換";
    if (previewStatus === "expired") return "已過期";
    if (previewStatus === "disabled") return "活動暫停";
    return GIFT_UI_STATUS_LABEL[previewStatus];
  };

  const buttonDisabled =
    previewStatus === "exhausted" ||
    previewStatus === "sold_out" ||
    previewStatus === "expired" ||
    previewStatus === "ineligible" ||
    previewStatus === "not_started" ||
    previewStatus === "disabled" ||
    previewStatus === "redeemed";

  const listImage = String(campaign.list_image_url ?? campaign.gift_image_url ?? "");
  const bannerImage = String(campaign.banner_image_url ?? "");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              tab === t.id ? "bg-[#FEE169] text-[#153E73]" : "bg-[#F3F4F6] text-[#687386]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "basic" && (
        <section className="grid gap-3 rounded-2xl border border-[#E7EAF0] bg-white p-4 md:grid-cols-2">
          <label className="text-xs">
            活動名稱
            <Input className="mt-1" value={String(campaign.name ?? "")} onChange={(e) => set("name", e.target.value)} />
          </label>
          <label className="text-xs">
            活動代碼
            <Input
              className="mt-1"
              value={String(campaign.campaign_code ?? "")}
              onChange={(e) => set("campaign_code", e.target.value)}
            />
          </label>
          <label className="text-xs">
            活動類型
            <select
              className="input-field mt-1"
              value={String(campaign.campaign_type ?? "monthly_member_gift")}
              onChange={(e) => set("campaign_type", e.target.value)}
            >
              {(Object.keys(GIFT_CAMPAIGN_TYPE_LABEL) as GiftCampaignType[]).map((k) => (
                <option key={k} value={k}>
                  {GIFT_CAMPAIGN_TYPE_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            活動狀態
            <select
              className="input-field mt-1"
              value={String(campaign.status ?? "draft")}
              onChange={(e) => set("status", e.target.value)}
            >
              {(Object.keys(GIFT_CAMPAIGN_STATUS_LABEL) as GiftCampaignStatus[]).map((k) => (
                <option key={k} value={k}>
                  {GIFT_CAMPAIGN_STATUS_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            贈品名稱
            <Input
              className="mt-1"
              value={String(campaign.gift_name ?? "")}
              onChange={(e) => set("gift_name", e.target.value)}
            />
          </label>
          <label className="text-xs">
            前台標籤
            <Input
              className="mt-1"
              value={String(campaign.tag_label ?? "")}
              onChange={(e) => set("tag_label", e.target.value)}
              placeholder="本月會員禮、限量、門市限定"
            />
          </label>
          <div className="md:col-span-2">
            <GiftImageCropUpload
              value={listImage || null}
              onChange={(url) =>
                onCampaignChange({
                  ...campaign,
                  list_image_url: url,
                  gift_image_url: url,
                })
              }
              label="列表圖片（建議 800×600，可裁切）"
              outWidth={800}
              outHeight={600}
              uploadFolder="member-gifts/list"
              maxFileBytes={GIFT_IMAGE_MAX}
            />
          </div>
          <div className="md:col-span-2">
            <GiftImageCropUpload
              value={bannerImage || null}
              onChange={(url) => set("banner_image_url", url)}
              label="詳情 Banner（建議 1080×600，可裁切）"
              outWidth={1080}
              outHeight={600}
              uploadFolder="member-gifts/banner"
              maxFileBytes={GIFT_IMAGE_MAX}
            />
          </div>
          <label className="text-xs">
            顯示排序
            <Input
              className="mt-1"
              type="number"
              value={String(campaign.sort_order ?? 0)}
              onChange={(e) => set("sort_order", Number(e.target.value))}
            />
          </label>
          <label className="mt-6 flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={campaign.show_on_frontend !== false}
              onChange={(e) => set("show_on_frontend", e.target.checked)}
            />
            顯示於前台
          </label>
          <label className="text-xs">
            活動開始
            <Input
              className="mt-1"
              type="datetime-local"
              value={toLocalInput(campaign.activity_start_at ?? campaign.claim_start_at)}
              onChange={(e) => set("activity_start_at", fromLocalInput(e.target.value))}
            />
          </label>
          <label className="text-xs">
            活動結束
            <Input
              className="mt-1"
              type="datetime-local"
              value={toLocalInput(campaign.activity_end_at ?? campaign.claim_end_at)}
              onChange={(e) => set("activity_end_at", fromLocalInput(e.target.value))}
            />
          </label>
          <label className="text-xs">
            領取開始
            <Input
              className="mt-1"
              type="datetime-local"
              value={toLocalInput(campaign.claim_start_at)}
              onChange={(e) => set("claim_start_at", fromLocalInput(e.target.value))}
            />
          </label>
          <label className="text-xs">
            領取結束
            <Input
              className="mt-1"
              type="datetime-local"
              value={toLocalInput(campaign.claim_end_at)}
              onChange={(e) => set("claim_end_at", fromLocalInput(e.target.value))}
            />
          </label>
          <label className="text-xs">
            兌換開始
            <Input
              className="mt-1"
              type="datetime-local"
              value={toLocalInput(campaign.redeem_start_at)}
              onChange={(e) => set("redeem_start_at", fromLocalInput(e.target.value))}
            />
          </label>
          <label className="text-xs">
            兌換結束
            <Input
              className="mt-1"
              type="datetime-local"
              value={toLocalInput(campaign.redeem_end_at)}
              onChange={(e) => set("redeem_end_at", fromLocalInput(e.target.value))}
            />
          </label>
          <label className="text-xs md:col-span-2">
            活動說明
            <textarea
              className="input-field mt-1 min-h-[80px]"
              value={String(campaign.description ?? "")}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>
          <label className="text-xs md:col-span-2">
            兌換條件文字（顯示於前台）
            <textarea
              className="input-field mt-1 min-h-[60px]"
              value={String(campaign.terms ?? "")}
              onChange={(e) => set("terms", e.target.value)}
            />
          </label>
        </section>
      )}

      {tab === "rules" && (
        <section className="space-y-4 rounded-2xl border border-[#E7EAF0] bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs">
              會員條件類型
              <select
                className="input-field mt-1"
                value={String(campaign.eligibility_type ?? "all_members")}
                onChange={(e) => set("eligibility_type", e.target.value)}
              >
                {(Object.keys(GIFT_ELIGIBILITY_LABEL) as GiftEligibilityType[]).map((k) => (
                  <option key={k} value={k}>
                    {GIFT_ELIGIBILITY_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              會員等級（逗號分隔，等級條件用）
              <Input
                className="mt-1"
                value={(Array.isArray(campaign.eligible_member_levels)
                  ? (campaign.eligible_member_levels as string[])
                  : []
                ).join(", ")}
                onChange={(e) =>
                  set(
                    "eligible_member_levels",
                    e.target.value
                      .split(/[,，]/)
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
              />
            </label>
            {campaign.eligibility_type === "points_threshold" ? (
              <label className="text-xs">
                最低會員點數
                <Input
                  type="number"
                  min={0}
                  className="mt-1"
                  value={Number(campaign.eligibility_min_points ?? 0)}
                  onChange={(e) =>
                    set("eligibility_min_points", Number(e.target.value) || 0)
                  }
                />
              </label>
            ) : null}
            <label className="text-xs md:col-span-2">
              指定會員 UUID／編號（每行一筆）
              <textarea
                className="input-field mt-1 min-h-[72px] font-mono text-[11px]"
                value={memberIdsText}
                onChange={(e) => setMemberIdsText(e.target.value)}
              />
            </label>
            <div className="space-y-2 rounded-xl bg-[#FFFDF6] p-3 text-xs md:col-span-2">
              <p className="font-bold text-[#153E73]">會員名單 CSV 匯入</p>
              <p className="text-[#687386]">
                支援 UUID、會員編號、手機、Email；可合併或覆蓋現有名單。
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  className="text-[11px]"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    void importMembers(f, "merge");
                    e.target.value = "";
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={importBusy}
                  onClick={() => void importMembers(null, "merge")}
                >
                  {importBusy ? "匯入中…" : "從文字合併匯入"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={importBusy}
                  onClick={() => {
                    if (confirm("將覆蓋現有指定會員名單，確定？")) {
                      void importMembers(null, "replace");
                    }
                  }}
                >
                  覆蓋匯入
                </Button>
              </div>
              {importResult ? <p className="text-[#153E73]">{importResult}</p> : null}
            </div>
            <label className="text-xs md:col-span-2">
              會員標籤（逗號分隔）
              <Input className="mt-1" value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
            </label>
            <label className="text-xs">
              註冊日起
              <Input
                className="mt-1"
                type="datetime-local"
                value={toLocalInput(campaign.eligibility_registered_from)}
                onChange={(e) => set("eligibility_registered_from", fromLocalInput(e.target.value))}
              />
            </label>
            <label className="text-xs">
              註冊日迄
              <Input
                className="mt-1"
                type="datetime-local"
                value={toLocalInput(campaign.eligibility_registered_to)}
                onChange={(e) => set("eligibility_registered_to", fromLocalInput(e.target.value))}
              />
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={Boolean(campaign.require_phone_verified)}
                onChange={(e) => set("require_phone_verified", e.target.checked)}
              />
              需完成手機驗證
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={Boolean(campaign.require_email_verified)}
                onChange={(e) => set("require_email_verified", e.target.checked)}
              />
              需完成 Email 驗證
            </label>
          </div>

          <div className="border-t border-[#E7EAF0] pt-4">
            <h3 className="mb-2 text-sm font-bold text-[#153E73]">滿額贈條件</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs">
                滿額金額
                <Input
                  className="mt-1"
                  type="number"
                  value={String(campaign.minimum_spend ?? "")}
                  onChange={(e) =>
                    set("minimum_spend", e.target.value ? Number(e.target.value) : null)
                  }
                />
              </label>
              <label className="text-xs">
                計算方式
                <select
                  className="input-field mt-1"
                  value={String(campaign.spend_mode ?? "single_order")}
                  onChange={(e) => set("spend_mode", e.target.value)}
                >
                  <option value="single_order">單筆滿額</option>
                  <option value="period_accumulate">期間累積</option>
                </select>
              </label>
              <label className="text-xs">
                金額計算
                <select
                  className="input-field mt-1"
                  value={String(campaign.spend_calculation_type ?? "paid_ex_shipping")}
                  onChange={(e) => set("spend_calculation_type", e.target.value)}
                >
                  <option value="paid_ex_shipping">實付（不含運費）</option>
                  <option value="paid_incl_shipping">實付（含運費）</option>
                  <option value="pre_discount">折價前金額</option>
                  <option value="category_only">指定分類</option>
                </select>
              </label>
              <label className="text-xs">
                每張訂單限領
                <Input
                  className="mt-1"
                  type="number"
                  value={String(campaign.per_order_quantity ?? 1)}
                  onChange={(e) => set("per_order_quantity", Number(e.target.value))}
                />
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={campaign.exclude_shipping !== false}
                  onChange={(e) => set("exclude_shipping", e.target.checked)}
                />
                不含運費
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={Boolean(campaign.exclude_coupons)}
                  onChange={(e) => set("exclude_coupons", e.target.checked)}
                />
                扣除折價券後計算
              </label>
              <GiftEntityPicker
                title="指定商品"
                kind="product"
                hint="空＝不限商品；搜尋名稱或 SKU 後點選加入"
                selectedIds={productIds}
                onChange={(ids) => set("applicable_product_ids", ids)}
              />
              <GiftEntityPicker
                title="指定分類"
                kind="category"
                hint="空＝不限分類"
                selectedIds={categoryIds}
                onChange={(ids) => set("applicable_category_ids", ids)}
              />
              <GiftEntityPicker
                title="排除商品"
                kind="product"
                hint="即使在指定分類內也會排除"
                selectedIds={excludedProductIds}
                onChange={(ids) => set("excluded_product_ids", ids)}
              />
            </div>
          </div>

          <div className="border-t border-[#E7EAF0] pt-4">
            <h3 className="mb-2 text-sm font-bold text-[#153E73]">兌換限制</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs">
                每位會員限領
                <Input
                  className="mt-1"
                  type="number"
                  value={String(campaign.per_member_limit ?? 1)}
                  onChange={(e) => set("per_member_limit", Number(e.target.value))}
                />
              </label>
              <label className="text-xs">
                每日限領
                <Input
                  className="mt-1"
                  type="number"
                  value={String(campaign.per_member_daily_limit ?? "")}
                  onChange={(e) =>
                    set(
                      "per_member_daily_limit",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                />
              </label>
              <label className="text-xs">
                領取後幾天內須兌換
                <Input
                  className="mt-1"
                  type="number"
                  value={String(campaign.redeem_within_days ?? "")}
                  onChange={(e) =>
                    set("redeem_within_days", e.target.value ? Number(e.target.value) : null)
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={Boolean(campaign.allow_repeat_participation)}
                  onChange={(e) => set("allow_repeat_participation", e.target.checked)}
                />
                允許同活動重複參加
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={campaign.stackable_with_other_gifts !== false}
                  onChange={(e) => set("stackable_with_other_gifts", e.target.checked)}
                />
                可與其他贈禮同時使用
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={campaign.require_self_redeem !== false}
                  onChange={(e) => set("require_self_redeem", e.target.checked)}
                />
                限本人兌換
              </label>
            </div>
          </div>
        </section>
      )}

      {tab === "inventory" && (
        <section className="space-y-4 rounded-2xl border border-[#E7EAF0] bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs">
              庫存模式
              <select
                className="input-field mt-1"
                value={String(campaign.inventory_scope ?? "shared")}
                onChange={(e) => set("inventory_scope", e.target.value)}
              >
                <option value="shared">共用總庫存</option>
                <option value="per_store">門市獨立庫存</option>
              </select>
            </label>
            <label className="text-xs">
              扣庫時機
              <select
                className="input-field mt-1"
                value={String(campaign.inventory_reservation_mode ?? "reserve_on_claim")}
                onChange={(e) => set("inventory_reservation_mode", e.target.value)}
              >
                <option value="reserve_on_claim">領取時保留</option>
                <option value="deduct_on_redeem">核銷時扣除</option>
              </select>
            </label>
            <label className="text-xs">
              活動總庫存
              <Input
                className="mt-1"
                type="number"
                value={String(campaign.total_quantity ?? 0)}
                onChange={(e) => set("total_quantity", Number(e.target.value))}
              />
            </label>
            <label className="text-xs">
              安全庫存提醒
              <Input
                className="mt-1"
                type="number"
                value={String(campaign.low_stock_threshold ?? 10)}
                onChange={(e) => set("low_stock_threshold", Number(e.target.value))}
              />
            </label>
            <p className="text-xs text-[#8A94A6] md:col-span-2">
              共用剩餘：{remainingShared}（保留 {String(campaign.reserved_quantity ?? 0)}／已兌{" "}
              {String(campaign.redeemed_quantity ?? 0)}）
            </p>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={Boolean(campaign.allow_cross_store_redeem)}
                onChange={(e) => set("allow_cross_store_redeem", e.target.checked)}
              />
              允許跨門市兌換
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={Boolean(campaign.require_store_selection)}
                onChange={(e) => set("require_store_selection", e.target.checked)}
              />
              領取時必須選擇兌換門市
            </label>
            <label className="text-xs md:col-span-2">
              多品項選擇方式
              <select
                className="input-field mt-1"
                value={String(campaign.item_selection_mode ?? "single")}
                onChange={(e) => set("item_selection_mode", e.target.value)}
              >
                <option value="single">單一品項（活動預設贈品）</option>
                <option value="member_pick">會員任選一款</option>
                <option value="random">系統隨機分配</option>
                <option value="staff_pick">門市核銷時選擇</option>
              </select>
              <span className="mt-1 block text-[11px] text-[#8A94A6]">
                請至「兌換品項」維護多款贈品；會員任選／隨機會在領取時決定品項。
              </span>
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={Boolean(campaign.require_same_store_redeem)}
                onChange={(e) => set("require_same_store_redeem", e.target.checked)}
              />
              須與消費門市相同
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={campaign.auto_hide_when_sold_out !== false}
                onChange={(e) => set("auto_hide_when_sold_out", e.target.checked)}
              />
              缺貨後自動下架
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={campaign.show_remaining_quantity !== false}
                onChange={(e) => set("show_remaining_quantity", e.target.checked)}
              />
              前台顯示剩餘數量
            </label>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold text-[#153E73]">適用／排除門市</h3>
            <div className="grid max-h-40 gap-1 overflow-y-auto rounded-xl bg-[#FFFDF6] p-3 text-xs md:grid-cols-2">
              {stores.map((s) => {
                const applicable = Array.isArray(campaign.applicable_redemption_store_ids)
                  ? (campaign.applicable_redemption_store_ids as string[])
                  : [];
                const excluded = Array.isArray(campaign.excluded_store_ids)
                  ? (campaign.excluded_store_ids as string[])
                  : [];
                return (
                  <div key={s.id} className="flex flex-wrap items-center gap-2">
                    <span className="min-w-[6rem] font-medium text-[#153E73]">{s.name}</span>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={applicable.length === 0 || applicable.includes(s.id)}
                        onChange={() => toggleStoreId("applicable_redemption_store_ids", s.id)}
                      />
                      適用
                    </label>
                    <label className="flex items-center gap-1 text-red-600">
                      <input
                        type="checkbox"
                        checked={excluded.includes(s.id)}
                        onChange={() => toggleStoreId("excluded_store_ids", s.id)}
                      />
                      排除
                    </label>
                  </div>
                );
              })}
            </div>
            <p className="mt-1 text-[11px] text-[#8A94A6]">
              適用清單為空＝全門市；勾選後僅限勾選門市。排除優先。
            </p>
          </div>

          {String(campaign.inventory_scope) === "per_store" && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#153E73]">門市獨立庫存</h3>
                <Button size="sm" disabled={invSaving} onClick={() => void saveInventory()}>
                  {invSaving ? "儲存中…" : "儲存門市庫存"}
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E7EAF0] text-[#8A94A6]">
                      <th className="py-2 pr-2">門市</th>
                      <th className="py-2 pr-2">配發數量</th>
                      <th className="py-2 pr-2">已核銷</th>
                      <th className="py-2 pr-2">剩餘</th>
                      <th className="py-2">安全庫存</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invRows.map((row, idx) => {
                      const remaining =
                        row.remaining ??
                        Math.max(
                          0,
                          Number(row.allocated_quantity) -
                            Number(row.reserved_quantity ?? 0) -
                            Number(row.redeemed_quantity ?? 0)
                        );
                      return (
                        <tr key={row.store_id} className="border-b border-[#F3F4F6]">
                          <td className="py-2 pr-2 font-medium text-[#153E73]">
                            {row.store_name ??
                              stores.find((s) => s.id === row.store_id)?.name ??
                              row.store_id}
                          </td>
                          <td className="py-2 pr-2">
                            <Input
                              type="number"
                              className="h-8 w-24"
                              value={String(row.allocated_quantity)}
                              onChange={(e) => {
                                const next = [...invRows];
                                next[idx] = {
                                  ...row,
                                  allocated_quantity: Number(e.target.value) || 0,
                                };
                                setInvRows(next);
                              }}
                            />
                          </td>
                          <td className="py-2 pr-2">{Number(row.redeemed_quantity ?? 0)}</td>
                          <td className={`py-2 pr-2 font-bold ${remaining === 0 ? "text-red-600" : ""}`}>
                            {remaining}
                          </td>
                          <td className="py-2">
                            <Input
                              type="number"
                              className="h-8 w-20"
                              value={String(row.low_stock_threshold ?? 10)}
                              onChange={(e) => {
                                const next = [...invRows];
                                next[idx] = {
                                  ...row,
                                  low_stock_threshold: Number(e.target.value) || 0,
                                };
                                setInvRows(next);
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === "frontend" && (
        <section className="grid gap-4 md:grid-cols-[1fr_280px]">
          <div className="grid gap-3 rounded-2xl border border-[#E7EAF0] bg-white p-4">
            <label className="text-xs">
              主標題
              <Input
                className="mt-1"
                value={String(campaign.frontend_title ?? campaign.name ?? "")}
                onChange={(e) => set("frontend_title", e.target.value)}
              />
            </label>
            <label className="text-xs">
              副標題
              <Input
                className="mt-1"
                value={String(campaign.frontend_subtitle ?? "")}
                onChange={(e) => set("frontend_subtitle", e.target.value)}
              />
            </label>
            <label className="text-xs">
              按鈕文字
              <Input
                className="mt-1"
                value={String(campaign.claim_button_label ?? "立即領取")}
                onChange={(e) => set("claim_button_label", e.target.value)}
              />
            </label>
            <label className="text-xs">
              售罄文字
              <Input
                className="mt-1"
                value={String(campaign.sold_out_label ?? "兌換完畢")}
                onChange={(e) => set("sold_out_label", e.target.value)}
              />
            </label>
            <label className="text-xs">
              模擬會員狀態
              <select
                className="input-field mt-1"
                value={previewStatus}
                onChange={(e) => setPreviewStatus(e.target.value as GiftMemberUiStatus)}
              >
                {(Object.keys(GIFT_UI_STATUS_LABEL) as GiftMemberUiStatus[]).map((k) => (
                  <option key={k} value={k}>
                    {GIFT_UI_STATUS_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mx-auto w-full max-w-[280px]">
            <div className="overflow-hidden rounded-[2rem] border-[8px] border-[#1a1a1a] bg-[#FFFDF6] shadow-xl">
              <div className="h-6 bg-[#1a1a1a]" />
              <div className="aspect-[16/9] bg-[#E7EAF0]">
                {Boolean(
                  campaign.banner_image_url || campaign.list_image_url || campaign.gift_image_url
                ) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={String(
                      campaign.banner_image_url ||
                        campaign.list_image_url ||
                        campaign.gift_image_url
                    )}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="space-y-2 p-4">
                {campaign.tag_label ? (
                  <span className="inline-block rounded bg-[#FEE169] px-2 py-0.5 text-[10px] font-bold text-[#153E73]">
                    {String(campaign.tag_label)}
                  </span>
                ) : null}
                <h3 className="text-base font-bold text-[#153E73]">
                  {String(campaign.frontend_title || campaign.name || "活動標題")}
                </h3>
                <p className="text-xs text-[#687386]">
                  {String(campaign.frontend_subtitle || campaign.gift_name || "")}
                </p>
                {campaign.show_remaining_quantity !== false ? (
                  <p className="text-[11px] text-[#8A94A6]">剩餘 {remainingShared}</p>
                ) : null}
                {campaign.terms ? (
                  <p className="line-clamp-3 text-[11px] text-[#687386]">{String(campaign.terms)}</p>
                ) : null}
                <button
                  type="button"
                  disabled={buttonDisabled}
                  className={`mt-2 w-full rounded-xl py-2.5 text-sm font-bold ${
                    buttonDisabled
                      ? "bg-[#E7EAF0] text-[#8A94A6]"
                      : "bg-[#FEE169] text-[#153E73]"
                  }`}
                >
                  {previewButton()}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {tab === "claims" && (
        <section className="rounded-2xl border border-[#E7EAF0] bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-[#153E73]">領取／核銷紀錄</h2>
          <ul className="max-h-96 space-y-2 overflow-y-auto text-sm">
            {claims.length === 0 ? (
              <li className="text-[#8A94A6]">尚無紀錄</li>
            ) : (
              claims.map((c) => (
                <li key={String(c.id)} className="rounded-xl bg-[#FFFDF6] px-3 py-2">
                  <p className="font-semibold text-[#153E73]">
                    {(c.profiles as { full_name?: string } | null)?.full_name ?? "會員"} ·{" "}
                    {String(c.status)}
                  </p>
                  <p className="text-xs text-[#8A94A6]">
                    {c.redemption_number ? `核銷號 ${String(c.redemption_number)} · ` : ""}
                    {c.redeemed_store_name_snapshot
                      ? String(c.redeemed_store_name_snapshot)
                      : "尚未核銷"}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      )}

      {tab !== "claims" && (
        <div className="flex justify-end">
          <Button disabled={saving} onClick={() => void saveCampaign()}>
            {saving ? "儲存中…" : "儲存活動設定"}
          </Button>
        </div>
      )}
    </div>
  );
}

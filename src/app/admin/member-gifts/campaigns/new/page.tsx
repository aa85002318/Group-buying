"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GIFT_CAMPAIGN_TYPE_LABEL, type GiftCampaignType } from "@/lib/gifts/types";

const TYPES = Object.keys(GIFT_CAMPAIGN_TYPE_LABEL) as GiftCampaignType[];

export default function NewMemberGiftCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    campaign_type: "monthly_member_gift" as GiftCampaignType,
    name: "",
    campaign_code: "",
    gift_name: "",
    description: "",
    tag_label: "本月會員禮",
    total_quantity: "100",
    per_member_limit: "1",
    per_order_quantity: "1",
    minimum_spend: "",
    inventory_scope: "shared",
    inventory_reservation_mode: "reserve_on_claim",
    status: "draft",
    show_on_frontend: true,
    show_remaining_quantity: true,
    low_stock_threshold: "10",
    claim_start_at: "",
    claim_end_at: "",
    redeem_end_at: "",
  });

  const create = async () => {
    setSaving(true);
    try {
      const now = Date.now();
      const res = await fetch("/api/admin/member-gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          total_quantity: Number(form.total_quantity),
          per_member_limit: Number(form.per_member_limit),
          per_order_quantity: Number(form.per_order_quantity),
          minimum_spend: form.minimum_spend ? Number(form.minimum_spend) : null,
          low_stock_threshold: Number(form.low_stock_threshold),
          claim_start_at: form.claim_start_at || new Date(now).toISOString(),
          claim_end_at: form.claim_end_at || new Date(now + 30 * 86400000).toISOString(),
          redeem_end_at: form.redeem_end_at || new Date(now + 35 * 86400000).toISOString(),
          eligibility_type:
            form.campaign_type === "birthday_gift"
              ? "birthday_month"
              : form.campaign_type === "new_member_gift"
                ? "new_members"
                : "all_members",
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "建立失敗");
      router.push(`/admin/member-gifts/campaigns/${d.campaign.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "建立失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="新增活動"
        description="先選擇活動類型，再填寫基本資料、條件與庫存"
      />
      <Link href="/admin/member-gifts/campaigns" className="text-sm text-[#153E73] underline">
        ← 返回活動列表
      </Link>

      <div className="flex gap-2 text-xs font-semibold text-[#8A94A6]">
        <span className={step === 1 ? "text-[#153E73]" : ""}>1. 活動類型</span>
        <span>→</span>
        <span className={step === 2 ? "text-[#153E73]" : ""}>2. 基本資料</span>
        <span>→</span>
        <span className={step === 3 ? "text-[#153E73]" : ""}>3. 庫存與發布</span>
      </div>

      {step === 1 ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setForm((f) => ({
                  ...f,
                  campaign_type: t,
                  tag_label: GIFT_CAMPAIGN_TYPE_LABEL[t],
                }));
                setStep(2);
              }}
              className={`rounded-2xl border p-4 text-left transition ${
                form.campaign_type === t
                  ? "border-[#FEE169] bg-[#FFFDF6]"
                  : "border-[#E7EAF0] bg-white hover:border-[#FEE169]"
              }`}
            >
              <p className="font-bold text-[#153E73]">{GIFT_CAMPAIGN_TYPE_LABEL[t]}</p>
              <p className="mt-1 text-xs text-[#8A94A6]">{t}</p>
            </button>
          ))}
        </section>
      ) : null}

      {step === 2 ? (
        <section className="grid gap-3 rounded-2xl border border-[#E7EAF0] bg-white p-4 md:grid-cols-2">
          <label className="text-xs md:col-span-2">
            活動類型
            <Input className="mt-1" value={GIFT_CAMPAIGN_TYPE_LABEL[form.campaign_type]} readOnly />
          </label>
          <label className="text-xs">
            活動名稱*
            <Input
              className="mt-1"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="text-xs">
            活動代碼（可空白自動產生）
            <Input
              className="mt-1"
              value={form.campaign_code}
              onChange={(e) => setForm((f) => ({ ...f, campaign_code: e.target.value }))}
            />
          </label>
          <label className="text-xs">
            禮品名稱*
            <Input
              className="mt-1"
              value={form.gift_name}
              onChange={(e) => setForm((f) => ({ ...f, gift_name: e.target.value }))}
            />
          </label>
          <label className="text-xs">
            前台標籤
            <Input
              className="mt-1"
              value={form.tag_label}
              onChange={(e) => setForm((f) => ({ ...f, tag_label: e.target.value }))}
            />
          </label>
          {form.campaign_type === "store_spend_gift" ? (
            <label className="text-xs">
              滿額金額
              <Input
                className="mt-1"
                type="number"
                value={form.minimum_spend}
                onChange={(e) => setForm((f) => ({ ...f, minimum_spend: e.target.value }))}
              />
            </label>
          ) : null}
          <label className="text-xs md:col-span-2">
            活動說明
            <textarea
              className="input-field mt-1 min-h-[80px]"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <div className="flex gap-2 md:col-span-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              上一步
            </Button>
            <Button
              disabled={!form.name.trim() || !form.gift_name.trim()}
              onClick={() => setStep(3)}
            >
              下一步
            </Button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="grid gap-3 rounded-2xl border border-[#E7EAF0] bg-white p-4 md:grid-cols-2">
          <label className="text-xs">
            活動總庫存
            <Input
              className="mt-1"
              type="number"
              value={form.total_quantity}
              onChange={(e) => setForm((f) => ({ ...f, total_quantity: e.target.value }))}
            />
          </label>
          <label className="text-xs">
            安全庫存提醒
            <Input
              className="mt-1"
              type="number"
              value={form.low_stock_threshold}
              onChange={(e) => setForm((f) => ({ ...f, low_stock_threshold: e.target.value }))}
            />
          </label>
          <label className="text-xs">
            庫存模式
            <select
              className="input-field mt-1"
              value={form.inventory_scope}
              onChange={(e) => setForm((f) => ({ ...f, inventory_scope: e.target.value }))}
            >
              <option value="shared">共用總庫存</option>
              <option value="per_store">門市獨立庫存</option>
            </select>
          </label>
          <label className="text-xs">
            庫存占用
            <select
              className="input-field mt-1"
              value={form.inventory_reservation_mode}
              onChange={(e) =>
                setForm((f) => ({ ...f, inventory_reservation_mode: e.target.value }))
              }
            >
              <option value="reserve_on_claim">領券時保留</option>
              <option value="deduct_on_redeem">核銷時扣除</option>
            </select>
          </label>
          <label className="text-xs">
            每位會員限領
            <Input
              className="mt-1"
              type="number"
              value={form.per_member_limit}
              onChange={(e) => setForm((f) => ({ ...f, per_member_limit: e.target.value }))}
            />
          </label>
          <label className="text-xs">
            狀態
            <select
              className="input-field mt-1"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="draft">草稿</option>
              <option value="scheduled">預約</option>
              <option value="published">進行中</option>
              <option value="paused">暫停</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.show_on_frontend}
              onChange={(e) => setForm((f) => ({ ...f, show_on_frontend: e.target.checked }))}
            />
            顯示於前台
          </label>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.show_remaining_quantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, show_remaining_quantity: e.target.checked }))
              }
            />
            顯示剩餘數量
          </label>
          <div className="flex gap-2 md:col-span-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              上一步
            </Button>
            <Button disabled={saving} onClick={() => void create()}>
              {saving ? "建立中…" : "建立活動"}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

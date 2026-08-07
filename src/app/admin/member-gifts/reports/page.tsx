"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminBarChart, AdminLineChart } from "@/components/admin/v2/AdminCharts";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GIFT_CAMPAIGN_TYPE_LABEL, type GiftCampaignType } from "@/lib/gifts/types";

type ReportRow = {
  campaign_id: string;
  name: string;
  campaign_type: GiftCampaignType;
  status: string;
  total_quantity: number;
  claimed_count: number;
  redeemed_count: number;
  unused_count: number;
  expired_count: number;
  cancelled_count: number;
  available_quantity: number;
  gift_cost: number;
  redemption_rate: number;
};

type ChartPoint = { label: string; value: number; color?: string };
type Participant = {
  id: string;
  status: string;
  claimed_at?: string;
  redeemed_at?: string | null;
  redemption_number?: string | null;
  store?: string | null;
  campaign?: string;
  member_name?: string;
  member_number?: string;
  gift_name?: string;
  cost?: number | null;
};

export default function MemberGiftReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [dailyTrend, setDailyTrend] = useState<ChartPoint[]>([]);
  const [byStore, setByStore] = useState<ChartPoint[]>([]);
  const [failureReasons, setFailureReasons] = useState<ChartPoint[]>([]);
  const [duplicateScans, setDuplicateScans] = useState(0);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
  const [campaignId, setCampaignId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [days, setDays] = useState(30);

  useEffect(() => {
    const qs = new URLSearchParams({ days: String(days) });
    if (campaignId) qs.set("campaign_id", campaignId);
    if (storeId) qs.set("store_id", storeId);
    if (status) qs.set("status", status);
    if (from) qs.set("from", new Date(from).toISOString());
    if (to) qs.set("to", new Date(to).toISOString());
    fetch(`/api/admin/member-gifts/reports?${qs.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setReports(d.reports ?? []);
        setDailyTrend(d.daily_trend ?? []);
        setByStore(d.by_store ?? []);
        setFailureReasons(d.failure_reasons ?? []);
        setDuplicateScans(Number(d.duplicate_scans ?? 0));
        setParticipants(d.participants ?? []);
        setStores(d.stores ?? []);
      });
  }, [campaignId, storeId, status, from, to, days]);

  const csvHref = useMemo(() => {
    const qs = new URLSearchParams({ format: "csv" });
    if (campaignId) qs.set("campaign_id", campaignId);
    return `/api/admin/member-gifts/reports?${qs.toString()}`;
  }, [campaignId]);

  const participantsCsvHref = useMemo(() => {
    const qs = new URLSearchParams({ format: "participants_csv" });
    if (campaignId) qs.set("campaign_id", campaignId);
    if (storeId) qs.set("store_id", storeId);
    if (status) qs.set("status", status);
    if (from) qs.set("from", new Date(from).toISOString());
    if (to) qs.set("to", new Date(to).toISOString());
    return `/api/admin/member-gifts/reports?${qs.toString()}`;
  }, [campaignId, storeId, status, from, to]);

  const tableRows = useMemo(
    () => (campaignId ? reports.filter((r) => r.campaign_id === campaignId) : reports),
    [reports, campaignId]
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="報表統計"
        description="核銷趨勢、門市分布、贈品成本與會員參與名單"
        actions={
          <div className="flex flex-wrap gap-2">
            <a href={csvHref} className={cn(buttonVariants({ variant: "outline" }))}>
              匯出活動 CSV
            </a>
            <a href={participantsCsvHref} className={cn(buttonVariants({ variant: "outline" }))}>
              匯出參與名單
            </a>
          </div>
        }
      />

      <div className="grid gap-3 rounded-2xl border border-[#E7EAF0] bg-white p-4 md:grid-cols-3 lg:grid-cols-6">
        <label className="text-xs">
          活動
          <select
            className="input-field mt-1"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
          >
            <option value="">全部</option>
            {reports.map((r) => (
              <option key={r.campaign_id} value={r.campaign_id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          門市
          <select
            className="input-field mt-1"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
          >
            <option value="">全部</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          兌換狀態
          <select
            className="input-field mt-1"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">全部</option>
            <option value="available">可兌換</option>
            <option value="redeemed">已核銷</option>
            <option value="expired">已過期</option>
            <option value="cancelled">已作廢</option>
          </select>
        </label>
        <label className="text-xs">
          領取起
          <input
            type="date"
            className="input-field mt-1"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-xs">
          領取迄
          <input
            type="date"
            className="input-field mt-1"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <label className="text-xs">
          趨勢天數
          <select
            className="input-field mt-1"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>近 7 天</option>
            <option value={14}>近 14 天</option>
            <option value={30}>近 30 天</option>
            <option value={60}>近 60 天</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#E7EAF0] bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-[#153E73]">每日核銷趨勢</h3>
          <AdminLineChart data={dailyTrend} height={160} color="#153E73" />
        </div>
        <div className="rounded-2xl border border-[#E7EAF0] bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-[#153E73]">門市核銷分布</h3>
          {byStore.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#8A94A6]">尚無核銷資料</p>
          ) : (
            <AdminBarChart data={byStore} height={160} />
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <div className="rounded-2xl border border-[#E7EAF0] bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-[#153E73]">核銷失敗原因</h3>
          {failureReasons.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#8A94A6]">期間內無失敗紀錄</p>
          ) : (
            <AdminBarChart data={failureReasons} height={160} />
          )}
        </div>
        <div className="rounded-2xl border border-[#E7EAF0] bg-white p-4">
          <h3 className="text-sm font-bold text-[#153E73]">重複掃描</h3>
          <p className="mt-6 text-3xl font-black text-[#B42318]">{duplicateScans}</p>
          <p className="mt-2 text-xs text-[#8A94A6]">已兌換券再次掃描／核銷次數</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#E7EAF0] bg-white">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-[#FFFDF6] text-[11px] uppercase text-[#8A94A6]">
            <tr>
              <th className="px-3 py-2">活動</th>
              <th className="px-3 py-2">類型</th>
              <th className="px-3 py-2">總量</th>
              <th className="px-3 py-2">已領</th>
              <th className="px-3 py-2">已核銷</th>
              <th className="px-3 py-2">未用</th>
              <th className="px-3 py-2">剩餘</th>
              <th className="px-3 py-2">成本</th>
              <th className="px-3 py-2">兌換率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F2F5]">
            {tableRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-[#8A94A6]">
                  尚無資料
                </td>
              </tr>
            ) : (
              tableRows.map((r) => (
                <tr key={r.campaign_id}>
                  <td className="px-3 py-3 font-semibold text-[#153E73]">{r.name}</td>
                  <td className="px-3 py-3 text-xs">
                    {GIFT_CAMPAIGN_TYPE_LABEL[r.campaign_type] ?? r.campaign_type}
                  </td>
                  <td className="px-3 py-3 text-xs">{r.total_quantity}</td>
                  <td className="px-3 py-3 text-xs">{r.claimed_count}</td>
                  <td className="px-3 py-3 text-xs">{r.redeemed_count}</td>
                  <td className="px-3 py-3 text-xs">{r.unused_count}</td>
                  <td className="px-3 py-3 text-xs">{r.available_quantity}</td>
                  <td className="px-3 py-3 text-xs">${Number(r.gift_cost ?? 0).toLocaleString()}</td>
                  <td className="px-3 py-3 text-xs font-bold">{r.redemption_rate}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#E7EAF0] bg-white">
        <div className="border-b border-[#E7EAF0] px-4 py-3">
          <h3 className="text-sm font-bold text-[#153E73]">會員參與名單（最近 50 筆）</h3>
        </div>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[#FFFDF6] text-[11px] uppercase text-[#8A94A6]">
            <tr>
              <th className="px-3 py-2">會員</th>
              <th className="px-3 py-2">活動</th>
              <th className="px-3 py-2">贈品</th>
              <th className="px-3 py-2">狀態</th>
              <th className="px-3 py-2">門市</th>
              <th className="px-3 py-2">領取時間</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F2F5]">
            {participants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-[#8A94A6]">
                  尚無資料
                </td>
              </tr>
            ) : (
              participants.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-3 text-xs">
                    <span className="font-semibold text-[#153E73]">{p.member_name ?? "—"}</span>
                    <span className="block text-[#8A94A6]">{p.member_number ?? ""}</span>
                  </td>
                  <td className="px-3 py-3 text-xs">{p.campaign ?? "—"}</td>
                  <td className="px-3 py-3 text-xs">{p.gift_name ?? "—"}</td>
                  <td className="px-3 py-3 text-xs">{p.status}</td>
                  <td className="px-3 py-3 text-xs">{p.store ?? "—"}</td>
                  <td className="px-3 py-3 text-xs">
                    {p.claimed_at ? new Date(p.claimed_at).toLocaleString("zh-TW") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

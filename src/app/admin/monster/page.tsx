"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import type { ProductShareRecord, MonsterReward, RewardRule, MonsterGameSettings } from "@/lib/types/database";

type Tab = "overview" | "shares" | "rewards" | "rules";

const SHARE_STATUS_LABELS: Record<string, string> = {
  pending_review: "待審核",
  approved: "已通過",
  rejected: "已拒絕",
};

const REWARD_STATUS_LABELS: Record<string, string> = {
  pending_review: "待發放",
  issued: "已發放",
  used: "已使用",
  expired: "已過期",
};

export default function AdminMonsterPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<Record<string, number>>({});
  const [shares, setShares] = useState<ProductShareRecord[]>([]);
  const [rewards, setRewards] = useState<MonsterReward[]>([]);
  const [rewardRules, setRewardRules] = useState<RewardRule[]>([]);
  const [gameSettings, setGameSettings] = useState<MonsterGameSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const loadOverview = () => {
    setLoading(true);
    fetch("/api/admin/monster/overview")
      .then((r) => r.json())
      .then((d) => setOverview(d.overview ?? {}))
      .finally(() => setLoading(false));
  };

  const loadShares = () => {
    setLoading(true);
    fetch("/api/admin/monster/shares")
      .then((r) => r.json())
      .then((d) => setShares(d.shares ?? []))
      .finally(() => setLoading(false));
  };

  const loadRewards = () => {
    setLoading(true);
    fetch("/api/admin/monster/rewards")
      .then((r) => r.json())
      .then((d) => setRewards(d.rewards ?? []))
      .finally(() => setLoading(false));
  };

  const loadRules = () => {
    setLoading(true);
    fetch("/api/admin/monster/rules")
      .then((r) => r.json())
      .then((d) => {
        setRewardRules(d.rewardRules ?? []);
        setGameSettings(d.gameSettings ?? null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab === "overview") loadOverview();
    if (tab === "shares") loadShares();
    if (tab === "rewards") loadRewards();
    if (tab === "rules") loadRules();
  }, [tab]);

  const approveShare = async (id: string) => {
    await fetch(`/api/admin/monster/shares/${id}/approve`, { method: "PATCH" });
    loadShares();
  };

  const rejectShare = async (id: string) => {
    await fetch(`/api/admin/monster/shares/${id}/reject`, { method: "PATCH" });
    loadShares();
  };

  const issueReward = async (id: string) => {
    await fetch(`/api/admin/monster/rewards/${id}/issue`, { method: "PATCH" });
    loadRewards();
  };

  const saveRules = async () => {
    await fetch("/api/admin/monster/rules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardRules, gameSettings }),
    });
    loadRules();
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "總覽" },
    { key: "shares", label: "分享審核" },
    { key: "rewards", label: "獎勵發放" },
    { key: "rules", label: "規則設定" },
  ];

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="麵包小怪獸"
        description="購後分享小遊戲管理：審核分享、發放獎勵、調整規則"
      />

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              tab === t.key
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "玩家數", value: overview.totalPlayers ?? 0 },
            { label: "總麵包 kg", value: (overview.totalBreadKg ?? 0).toFixed(1) },
            { label: "待審分享", value: overview.pendingShares ?? 0 },
            { label: "待發獎勵", value: overview.pendingRewards ?? 0 },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "shares" && (
        <AdminTable
          columns={[
            {
              key: "member",
              header: "會員",
              render: (r) =>
                (r as ProductShareRecord & { profiles?: { full_name?: string; member_code?: string } })
                  .profiles?.full_name ??
                r.user_id.slice(0, 8),
            },
            {
              key: "product",
              header: "商品",
              render: (r) =>
                (r as ProductShareRecord & { products?: { name?: string } }).products?.name ??
                r.product_id.slice(0, 8),
            },
            {
              key: "bread",
              header: "麵包 kg",
              render: (r) => Number(r.bread_kg_awarded).toFixed(1),
            },
            {
              key: "review",
              header: "心得",
              render: (r) => (
                <span className="line-clamp-2 max-w-xs text-xs">{r.review_text}</span>
              ),
            },
            {
              key: "status",
              header: "狀態",
              render: (r) => (
                <StatusBadge
                  label={SHARE_STATUS_LABELS[r.status] ?? r.status}
                  variant={r.status === "approved" ? "success" : r.status === "rejected" ? "danger" : "warning"}
                />
              ),
            },
            {
              key: "actions",
              header: "操作",
              render: (r) =>
                r.status === "pending_review" ? (
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => approveShare(r.id)}>
                      核准
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => rejectShare(r.id)}>
                      拒絕
                    </Button>
                  </div>
                ) : null,
            },
          ]}
          rows={shares}
          loading={loading}
          page={1}
          totalPages={1}
          onPageChange={() => {}}
        />
      )}

      {tab === "rewards" && (
        <AdminTable
          columns={[
            {
              key: "member",
              header: "會員",
              render: (r) =>
                (r as MonsterReward & { profiles?: { full_name?: string } }).profiles?.full_name ??
                r.user_id.slice(0, 8),
            },
            { key: "name", header: "獎勵", render: (r) => r.reward_name },
            { key: "threshold", header: "門檻", render: (r) => `${r.threshold_kg} kg` },
            {
              key: "status",
              header: "狀態",
              render: (r) => (
                <StatusBadge
                  label={REWARD_STATUS_LABELS[r.status] ?? r.status}
                  variant={r.status === "issued" ? "success" : "warning"}
                />
              ),
            },
            {
              key: "actions",
              header: "操作",
              render: (r) =>
                r.status === "pending_review" ? (
                  <Button size="sm" onClick={() => issueReward(r.id)}>
                    發放
                  </Button>
                ) : null,
            },
          ]}
          rows={rewards}
          loading={loading}
          page={1}
          totalPages={1}
          onPageChange={() => {}}
        />
      )}

      {tab === "rules" && gameSettings && (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <h3 className="font-medium">遊戲參數</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {(
                  [
                    ["share_kg", "基礎麵包 kg"],
                    ["bonus_kg", "加碼麵包 kg"],
                    ["photo_kg", "照片加碼 kg"],
                    ["min_chars", "最少字數"],
                    ["bonus_chars", "加碼字數門檻"],
                    ["daily_limit", "每日上限"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground">{label}</label>
                    <Input
                      type="number"
                      value={gameSettings[key]}
                      onChange={(e) =>
                        setGameSettings({
                          ...gameSettings,
                          [key]: key.includes("chars") || key === "daily_limit"
                            ? parseInt(e.target.value, 10)
                            : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <h3 className="font-medium">獎勵門檻</h3>
              {rewardRules.map((rule, idx) => (
                <div key={rule.id} className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="text-xs text-muted-foreground">門檻 kg</label>
                    <Input
                      type="number"
                      value={rule.threshold_kg}
                      onChange={(e) => {
                        const updated = [...rewardRules];
                        updated[idx] = { ...rule, threshold_kg: parseFloat(e.target.value) };
                        setRewardRules(updated);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">類型</label>
                    <Input
                      value={rule.reward_type}
                      onChange={(e) => {
                        const updated = [...rewardRules];
                        updated[idx] = { ...rule, reward_type: e.target.value };
                        setRewardRules(updated);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">名稱</label>
                    <Input
                      value={rule.reward_name}
                      onChange={(e) => {
                        const updated = [...rewardRules];
                        updated[idx] = { ...rule, reward_name: e.target.value };
                        setRewardRules(updated);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">數值</label>
                    <Input
                      value={rule.reward_value ?? ""}
                      onChange={(e) => {
                        const updated = [...rewardRules];
                        updated[idx] = { ...rule, reward_value: e.target.value || null };
                        setRewardRules(updated);
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button onClick={saveRules}>儲存設定</Button>
        </div>
      )}
    </div>
  );
}

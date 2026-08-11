"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/lib/site-links";

type Device = {
  id: string;
  device_label: string | null;
  user_agent: string | null;
  ip_address: string | null;
  first_seen_at: string;
  last_seen_at: string;
  is_trusted: boolean;
};

export default function LoginDevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/member/login-devices")
      .then((r) => r.json())
      .then((d) => setDevices(d.devices ?? []))
      .catch(() => setError("載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // Record / refresh current device on visit
    fetch("/api/member/login-devices", { method: "POST" }).catch(() => {});
  }, []);

  const revoke = async (id: string) => {
    if (!confirm("撤銷後，此裝置下次登入將被拒絕。確定嗎？")) return;
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/member/login-devices?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "撤銷失敗");
      return;
    }
    setMessage("已撤銷此裝置");
    load();
  };

  return (
    <RequireAuth>
      <div className="mx-auto max-w-lg space-y-5 pb-4">
        <div className="flex items-center gap-3">
          <Link href={APP_ROUTES.memberSettings}>
            <ArrowLeft className="h-5 w-5 text-caramel" />
          </Link>
          <h1 className="text-xl font-bold text-caramel">登入裝置</h1>
        </div>

        <div className="space-y-3 rounded-[20px] bg-surface p-5 shadow-card">
          <p className="text-sm text-foreground-secondary">
            檢視近期登入裝置。若發現異常裝置，可立即撤銷以保護帳號。
          </p>

          {loading ? (
            <p className="text-sm text-foreground-secondary">載入中…</p>
          ) : devices.length === 0 ? (
            <p className="text-sm text-foreground-secondary">尚無裝置紀錄</p>
          ) : (
            devices.map((device) => (
              <div
                key={device.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border/70 p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {device.device_label || "未知裝置"}
                  </p>
                  <p className="mt-1 text-xs text-foreground-secondary">
                    最近登入：{new Date(device.last_seen_at).toLocaleString("zh-TW")}
                  </p>
                  {device.ip_address ? (
                    <p className="text-xs text-foreground-secondary">IP：{device.ip_address}</p>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-error text-error"
                  onClick={() => revoke(device.id)}
                >
                  撤銷
                </Button>
              </div>
            ))
          )}

          {error && <p className="text-sm text-error">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
        </div>
      </div>
    </RequireAuth>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_WEEKLY_HOURS,
  parseLatLngFromGoogleMapsUrl,
  type StoreProfile,
} from "@/lib/admin/store-profile";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (store: StoreProfile) => void;
};

export function StoreCreateWizard({ open, onClose, onCreated }: Props) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [phone, setPhone] = useState("");
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("21:00");

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setName("");
    setAddress("");
    setMapUrl("");
    setLatitude("");
    setLongitude("");
    setPhone("");
    setOpenTime("09:00");
    setCloseTime("21:00");
  }, [open]);

  if (!open) return null;

  const fillFromMap = () => {
    const { latitude: lat, longitude: lng } = parseLatLngFromGoogleMapsUrl(mapUrl);
    if (lat != null) setLatitude(String(lat));
    if (lng != null) setLongitude(String(lng));
    if (lat == null && lng == null) {
      alert("無法從網址解析經緯度，請手動填寫或貼上含 @lat,lng 的 Google Maps 連結");
    }
  };

  const finish = async () => {
    if (!name.trim() || !address.trim()) {
      alert("請填寫分店名稱與地址");
      return;
    }
    setSaving(true);
    try {
      const weekly_hours = { ...DEFAULT_WEEKLY_HOURS };
      for (const key of Object.keys(weekly_hours) as Array<keyof typeof weekly_hours>) {
        weekly_hours[key] = { open: openTime, close: closeTime };
      }
      const res = await fetch("/api/admin/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim() || null,
          map_url: mapUrl.trim() || null,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          weekly_hours,
          is_active: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "新增失敗");
      onCreated(data.store as StoreProfile);
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : "新增失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,.38)] p-4">
      <div className="w-full max-w-lg rounded-[20px] bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#2F2925]">新增分店 · Step {step}/4</h2>
          <button type="button" className="text-sm text-[#756B64]" onClick={onClose}>
            關閉
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span className="text-[#756B64]">分店名稱</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：台北復興店" />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span className="text-[#756B64]">地址</span>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="完整地址" />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-[#756B64]">Google Map URL</span>
              <Input
                value={mapUrl}
                onChange={(e) => setMapUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
              />
            </label>
            <Button type="button" variant="outline" onClick={fillFromMap}>
              📍 自動取得經緯度
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-sm">
                <span className="text-[#756B64]">Latitude</span>
                <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-[#756B64]">Longitude</span>
                <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} />
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span className="text-[#756B64]">電話</span>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-sm">
                <span className="text-[#756B64]">開門</span>
                <Input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-[#756B64]">打烊</span>
                <Input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
              </label>
            </div>
            <p className="text-xs text-[#756B64]">將套用至一週七天，之後可在營業資訊 Tab 個別調整。</p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-2 text-sm text-[#2F2925]">
            <p className="font-medium">確認建立</p>
            <p>名稱：{name || "—"}</p>
            <p>地址：{address || "—"}</p>
            <p>電話：{phone || "—"}</p>
            <p>
              營業：{openTime}~{closeTime}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-between gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={step === 1 || saving}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            上一步
          </Button>
          {step < 4 ? (
            <Button
              type="button"
              disabled={(step === 1 && !name.trim()) || (step === 2 && !address.trim())}
              onClick={() => setStep((s) => Math.min(4, s + 1))}
            >
              下一步
            </Button>
          ) : (
            <Button type="button" disabled={saving} onClick={() => void finish()}>
              {saving ? "建立中…" : "完成"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

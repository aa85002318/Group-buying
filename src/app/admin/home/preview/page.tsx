"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Monitor, Smartphone, Tablet } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { cn } from "@/lib/utils";

const DEVICES = [
  { id: "390", label: "手機 390", width: 390, icon: Smartphone },
  { id: "768", label: "平板 768", width: 768, icon: Tablet },
  { id: "1440", label: "桌機 1440", width: 1440, icon: Monitor },
] as const;

export default function AdminHomePreviewPage() {
  const [device, setDevice] = useState<(typeof DEVICES)[number]["id"]>("390");
  const active = useMemo(() => DEVICES.find((d) => d.id === device) ?? DEVICES[0], [device]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="首頁草稿預覽"
        description="以 390／768／1440 寬度預覽草稿版面。訪客看不到此內容，需在首頁設定按「發布」才會上線。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/home"
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              返回編輯
            </Link>
            <Link href="/admin/home" className={buttonVariants({ size: "sm" })}>
              前往發布
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {DEVICES.map((d) => {
          const Icon = d.icon;
          return (
            <Button
              key={d.id}
              size="sm"
              variant={device === d.id ? "default" : "outline"}
              onClick={() => setDevice(d.id)}
            >
              <Icon className="mr-1.5 h-4 w-4" />
              {d.label}
            </Button>
          );
        })}
      </div>

      <div className="overflow-auto rounded-xl border border-border bg-surface-soft p-4">
        <div
          className={cn(
            "mx-auto overflow-hidden rounded-2xl border border-border bg-white shadow-card transition-all"
          )}
          style={{ width: active.width, maxWidth: "100%" }}
        >
          <iframe
            title="homepage-draft-preview"
            src="/?preview=draft"
            className="h-[78vh] w-full bg-white"
          />
        </div>
      </div>
    </div>
  );
}

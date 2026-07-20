"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";

export default function SupportShippingPage() {
  const [info, setInfo] = useState("");

  useEffect(() => {
    fetch("/api/support-settings")
      .then((r) => r.json())
      .then((d) => setInfo(d.settings?.shipping_info ?? ""));
  }, []);

  return (
    <div className="space-y-4 pb-6">
      <Link href={APP_ROUTES.support} className="inline-flex items-center gap-2 text-caramel">
        <ArrowLeft className="h-4 w-4" /> 返回客服中心
      </Link>
      <h1 className="text-xl font-bold text-caramel">配送說明</h1>
      <div className="whitespace-pre-wrap rounded-2xl bg-surface p-4 text-sm text-foreground-secondary shadow-card">
        {info || "配送說明尚未設定，請洽客服或參考 FAQ。"}
      </div>
      <Link href={`${APP_ROUTES.faq}?category=shipping`} className="text-sm font-semibold text-primary">
        查看配送 FAQ →
      </Link>
    </div>
  );
}

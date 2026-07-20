"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getBrowserOrigin } from "@/lib/env";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import { REVIEW_TEMPLATES, buildLineShareText, buildShareUrl } from "@/lib/services/monsterService";
import { getMockProductById } from "@/lib/mock-data";
import type { ShareableProduct } from "@/lib/types/database";

export default function MonsterShareClient() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params.productId as string;
  const orderId = searchParams.get("orderId") ?? "";

  const [product, setProduct] = useState<ShareableProduct | null>(null);
  const [memberCode, setMemberCode] = useState("DEMO01");
  const [reviewText, setReviewText] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [idempotencyKey] = useState(() => `${orderId}-${productId}-${Date.now()}`);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) router.push("/auth/login");
      });
      fetch("/api/profile")
        .then((r) => r.json())
        .then((d) => {
          if (d.profile?.member_code) setMemberCode(d.profile.member_code);
        })
        .catch(() => {});
    }

    fetch("/api/monster/products")
      .then((r) => r.json())
      .then((d) => {
        const found = (d.products ?? []).find(
          (p: ShareableProduct) => p.product_id === productId && p.order_id === orderId
        );
        if (found) {
          setProduct(found);
        } else if (!isSupabaseConfigured()) {
          const mock = getMockProductById(productId);
          if (mock) {
            setProduct({
              product_id: productId,
              order_id: orderId,
              order_number: "DEMO",
              product_name: mock.name,
              image_url: mock.image_url,
              unit_price: mock.price,
              quantity: 1,
              share_status: "available",
            });
          }
        }
      })
      .catch(() => {});
  }, [productId, orderId, router]);

  const appUrl = getBrowserOrigin() ?? "http://localhost:3003";

  const shareUrl = useMemo(
    () => buildShareUrl(appUrl, productId, memberCode),
    [appUrl, productId, memberCode]
  );

  const lineShareText = useMemo(
    () =>
      product
        ? buildLineShareText(product.product_name, reviewText || "（請填寫心得）", shareUrl)
        : "",
    [product, reviewText, shareUrl]
  );

  const lineShareHref = `https://line.me/R/msg/text/?${encodeURIComponent(lineShareText)}`;

  const logLineShare = useCallback(() => {
    fetch("/api/monster/line-share-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        eventType: "line_share_click",
        rawPayload: { shareUrl },
      }),
    }).catch(() => {});
  }, [productId, shareUrl]);

  const handleShareToLine = () => {
    logLineShare();
    window.open(lineShareHref, "_blank", "noopener,noreferrer");
  };

  const handleSubmit = async () => {
    if (reviewText.trim().length < 10) {
      setError("心得至少需要 10 個字");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/monster/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          orderId,
          reviewText,
          hasPhoto,
          idempotencyKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "提交失敗");
        return;
      }
      const qs = new URLSearchParams({
        breadKg: String(data.breadKgAwarded ?? 0),
        pending: "1",
      });
      router.push(`/monster/success?${qs}`);
    } catch {
      setError("網路錯誤，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  if (!orderId) {
    return (
      <div className="text-center py-8 space-y-2">
        <p className="text-[#8A8A8A]">缺少訂單資訊</p>
        <Link
          href="/monster/products"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium hover:bg-muted"
        >
          返回商品列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/monster/products" className="text-sm text-[#C94C4C]">← 返回商品列表</Link>
      <h1 className="text-xl font-bold text-[#333333]">分享購後心得</h1>

      {product && (
        <Card>
          <CardContent className="flex gap-3 p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#FFF8F5]">
              {product.image_url ? (
                <Image src={product.image_url} alt={product.product_name} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl">📦</div>
              )}
            </div>
            <div>
              <p className="font-medium">{product.product_name}</p>
              <p className="text-sm text-[#8A8A8A]">訂單 {product.order_number}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#333333]">購後心得（至少 10 字）</label>
        <div className="flex flex-wrap gap-2">
          {REVIEW_TEMPLATES.map((t) => (
            <button
              key={t.slice(0, 12)}
              type="button"
              onClick={() => setReviewText(t)}
              className="rounded-full border border-[#F7DADA] bg-[#FFF8F5] px-3 py-1 text-xs text-[#8A8A8A] hover:border-[#C94C4C] hover:text-[#C94C4C]"
            >
              套用範本
            </button>
          ))}
        </div>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={5}
          placeholder="寫下你的真實使用心得…"
          className="w-full rounded-xl border border-border bg-surface p-3 text-sm focus:border-[#C94C4C] focus:outline-none focus:ring-1 focus:ring-[#C94C4C]"
        />
        <p className="text-xs text-[#8A8A8A]">{reviewText.trim().length} 字</p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={hasPhoto}
          onChange={(e) => setHasPhoto(e.target.checked)}
          className="rounded border-[#C94C4C] text-[#C94C4C]"
        />
        我有附上商品照片（+1 kg 麵包）
      </label>

      <Card className="border-[#F7DADA] bg-[#FFF8F5]">
        <CardContent className="p-4 space-y-2">
          <p className="text-sm font-medium text-[#333333]">LINE 分享預覽</p>
          <pre className="whitespace-pre-wrap text-xs text-[#8A8A8A] font-sans">{lineShareText}</pre>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full border-[#06C755] text-[#06C755] hover:bg-[#06C755]/10"
        onClick={handleShareToLine}
        disabled={reviewText.trim().length < 10}
      >
        分享到 LINE
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={submitting || reviewText.trim().length < 10}
      >
        {submitting ? "提交中…" : "我已完成分享"}
      </Button>

      <p className="text-xs text-center text-[#8A8A8A]">
        提交後需管理員審核，麵包才會入帳小怪獸帳戶
      </p>
    </div>
  );
}

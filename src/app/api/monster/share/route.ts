import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { getOrCreateMockProfile, monsterMockStore } from "@/lib/monster-mock";
import { getMockProductById } from "@/lib/mock-data";
import {
  buildLineShareText,
  buildShareUrl,
  calculateBreadKg,
  checkDailyLimit,
  checkDuplicateShare,
} from "@/lib/services/monsterService";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/env";
import type { ProductShareRecord } from "@/lib/types/database";

export async function POST(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;
  const userId = auth!.profile.id;

  const body = await request.json();
  const { productId, orderId, reviewText, hasPhoto, idempotencyKey } = body as {
    productId?: string;
    orderId?: string;
    reviewText?: string;
    hasPhoto?: boolean;
    idempotencyKey?: string;
  };

  if (!productId || !orderId) {
    return NextResponse.json({ error: "缺少商品或訂單資訊" }, { status: 400 });
  }

  const trimmed = (reviewText ?? "").trim();
  if (trimmed.length < 10) {
    return NextResponse.json(
      { error: "心得至少需要 10 個字才能獲得麵包" },
      { status: 400 }
    );
  }

  const appUrl = getSiteUrl();
  const memberCode = auth!.profile.member_code ?? "";

  if (!isSupabaseConfigured()) {
    const settings = monsterMockStore.gameSettings;

    if (idempotencyKey) {
      const existing = monsterMockStore.shareRecords.find(
        (r) =>
          r.user_id === userId &&
          r.order_id === orderId &&
          r.product_id === productId &&
          r.status !== "rejected"
      );
      if (existing) {
        return NextResponse.json({ shareRecord: existing, profile: getOrCreateMockProfile(userId) });
      }
    }

    const daily = checkDailyLimit(
      monsterMockStore.shareRecords.filter((r) => r.user_id === userId),
      settings.daily_limit
    );
    if (!daily.allowed) {
      return NextResponse.json({ error: "今日分享次數已達上限（3 次）" }, { status: 429 });
    }

    if (
      checkDuplicateShare(
        monsterMockStore.shareRecords.filter((r) => r.user_id === userId),
        orderId,
        productId
      )
    ) {
      return NextResponse.json({ error: "此訂單商品已分享過" }, { status: 409 });
    }

    const breadKg = calculateBreadKg(trimmed, !!hasPhoto, settings);
    const shareUrl = buildShareUrl(appUrl, productId, memberCode);
    const mockProduct = getMockProductById(productId);
    const productName = mockProduct?.name ?? "精選商品";

    const record: ProductShareRecord = {
      id: `psr-${Date.now()}`,
      user_id: userId,
      product_id: productId,
      order_id: orderId,
      review_text: trimmed,
      has_photo: !!hasPhoto,
      line_share_text: buildLineShareText(productName, trimmed, shareUrl),
      share_url: shareUrl,
      bread_kg_awarded: breadKg,
      status: "pending_review",
      reviewed_by: null,
      reviewed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    monsterMockStore.shareRecords.push(record);
    return NextResponse.json({
      shareRecord: record,
      profile: getOrCreateMockProfile(userId),
      breadKgAwarded: breadKg,
      message: "分享已提交，待管理員審核後麵包才會入帳",
    });
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: settingsRows } = await admin
    .from("monster_game_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  const settings = settingsRows ?? {
    share_kg: 0.5,
    min_chars: 10,
    bonus_chars: 30,
    bonus_kg: 0.5,
    photo_kg: 1,
    daily_limit: 3,
  };

  const { data: existingRecords } = await supabase
    .from("product_share_records")
    .select("*")
    .eq("user_id", userId);

  if (
    checkDuplicateShare(existingRecords ?? [], orderId, productId)
  ) {
    const dup = (existingRecords ?? []).find(
      (r) => r.order_id === orderId && r.product_id === productId && r.status !== "rejected"
    );
    if (dup) {
      const { data: profile } = await supabase
        .from("monster_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      return NextResponse.json({ shareRecord: dup, profile, idempotent: true });
    }
    return NextResponse.json({ error: "此訂單商品已分享過" }, { status: 409 });
  }

  const daily = checkDailyLimit(existingRecords ?? [], settings.daily_limit);
  if (!daily.allowed) {
    return NextResponse.json({ error: "今日分享次數已達上限（3 次）" }, { status: 429 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, user_id, order_items(product_id, product_name)")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "訂單不存在" }, { status: 404 });
  }

  const orderItem = (order.order_items ?? []).find(
    (i: { product_id: string }) => i.product_id === productId
  );
  if (!orderItem) {
    return NextResponse.json({ error: "訂單中無此商品" }, { status: 400 });
  }

  const { data: product } = await supabase
    .from("products")
    .select("name")
    .eq("id", productId)
    .single();

  const breadKg = calculateBreadKg(trimmed, !!hasPhoto, settings);
  const shareUrl = buildShareUrl(appUrl, productId, memberCode);
  const lineShareText = buildLineShareText(
    product?.name ?? orderItem.product_name,
    trimmed,
    shareUrl
  );

  const { data: shareRecord, error: insertError } = await supabase
    .from("product_share_records")
    .insert({
      user_id: userId,
      product_id: productId,
      order_id: orderId,
      review_text: trimmed,
      has_photo: !!hasPhoto,
      line_share_text: lineShareText,
      share_url: shareUrl,
      bread_kg_awarded: breadKg,
      status: "pending_review",
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "此訂單商品已分享過" }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase.from("monster_feed_logs").insert({
    user_id: userId,
    product_id: productId,
    order_id: orderId,
    share_record_id: shareRecord.id,
    bread_kg: breadKg,
    reason: "分享提交（待審核）",
    status: "pending",
  });

  const { data: profile } = await supabase
    .from("monster_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return NextResponse.json({
    shareRecord,
    profile,
    breadKgAwarded: breadKg,
    message: "分享已提交，待管理員審核後麵包才會入帳",
  });
}

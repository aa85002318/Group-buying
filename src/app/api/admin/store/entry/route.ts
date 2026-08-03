import { NextResponse } from "next/server";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreEntryDef, type StoreEntryType } from "@/lib/admin/store-entry";

/**
 * Unified field entry — maps quick-entry types onto existing store_* tables.
 * Does not create products; product_id must reference Product Master.
 */
export async function POST(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  const body = await request.json();
  const type = body.type as StoreEntryType;
  const def = getStoreEntryDef(type);
  if (!def) {
    return NextResponse.json({ error: "無效的紀錄類型" }, { status: 400 });
  }

  const productId = (body.product_id as string | undefined)?.trim() || null;
  const batchId = (body.batch_id as string | undefined)?.trim() || null;
  const quantity = body.quantity != null ? Number(body.quantity) : null;
  const reason = String(body.reason ?? body.description ?? "").trim();
  const photoUrl = (body.photo_url as string | undefined)?.trim() || null;
  const anomalyType =
    (body.anomaly_type as string | undefined)?.trim() || def.anomalyType || "other";

  if (!reason) {
    return NextResponse.json({ error: "請填寫原因／說明" }, { status: 400 });
  }

  if (def.requiresProduct && !productId) {
    return NextResponse.json({ error: "請先選擇商品" }, { status: 400 });
  }
  if (def.requiresBatch && !batchId) {
    return NextResponse.json({ error: "請選擇批次" }, { status: 400 });
  }
  if (def.requiresQuantity) {
    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: "數量必須大於 0" }, { status: 400 });
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      item: { id: `tmp-${Date.now()}`, type, reason },
      message: "已新增（模擬）",
    });
  }

  const admin = createAdminClient();
  let storeId = (body.store_id as string | undefined) || null;
  if (!storeId) {
    const { data: store } = await admin
      .from("stores")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    storeId = store?.id ?? null;
  }
  if (!storeId) {
    return NextResponse.json({ error: "找不到可用門市" }, { status: 400 });
  }

  const staffName =
    (auth!.profile as { full_name?: string | null }).full_name?.trim() || "門市人員";

  try {
    if (def.resource === "store_messages") {
      const { data, error: insertError } = await admin
        .from("store_messages")
        .insert({
          store_id: storeId,
          body: reason,
          author_id: auth!.profile.id,
          author_name: staffName,
        })
        .select()
        .single();
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      await logAudit(
        auth!.profile.id,
        "create",
        "store_messages",
        data.id,
        null,
        data,
        request as never
      );
      return NextResponse.json({ item: data, resource: "store_messages", message: "留言已送出" });
    }

    if (def.resource === "store_work_logs") {
      const { data, error: insertError } = await admin
        .from("store_work_logs")
        .insert({
          store_id: storeId,
          log_date: new Date().toISOString().slice(0, 10),
          body: reason,
          author_id: auth!.profile.id,
          author_name: staffName,
        })
        .select()
        .single();
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      await logAudit(
        auth!.profile.id,
        "create",
        "store_work_logs",
        data.id,
        null,
        data,
        request as never
      );
      return NextResponse.json({ item: data, resource: "store_work_logs", message: "工作紀錄已儲存" });
    }

    if (def.resource === "store_requests") {
      const qty = quantity && quantity > 0 ? quantity : 1;
      const productLabel =
        (body.product_label as string | undefined)?.trim() ||
        (body.product_name as string | undefined)?.trim() ||
        null;
      const { data, error: insertError } = await admin
        .from("store_requests")
        .insert({
          store_id: storeId,
          product_id: productId,
          product_label: productLabel,
          quantity: qty,
          unit: (body.unit as string | undefined)?.trim() || null,
          note: reason,
          status: "pending",
          requested_by: auth!.profile.id,
          requested_by_name: staffName,
        })
        .select()
        .single();
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      await logAudit(
        auth!.profile.id,
        "create",
        "store_requests",
        data.id,
        null,
        data,
        request as never
      );
      return NextResponse.json({ item: data, resource: "store_requests", message: "叫貨需求已送出" });
    }

    if (def.resource === "disposals") {
      const unitCost = body.unit_cost != null ? Number(body.unit_cost) : null;
      const qty = quantity!;
      const payload = {
        store_id: storeId,
        product_id: productId!,
        batch_id: batchId!,
        quantity: qty,
        reason,
        unit_cost: unitCost,
        total_loss: unitCost != null ? unitCost * qty : null,
        photo_url: photoUrl,
        status: "open",
        created_by: auth!.profile.id,
        disposed_at: new Date().toISOString(),
      };
      const { data, error: insertError } = await admin
        .from("store_disposals")
        .insert(payload)
        .select()
        .single();
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      await applyBatchMovement({
        admin,
        storeId,
        productId: productId!,
        batchId: batchId!,
        qty,
        movementType: "disposal",
        referenceType: "store_disposals",
        referenceId: data.id,
        createdBy: auth!.profile.id,
      });
      await logAudit(
        auth!.profile.id,
        "create",
        "store_disposals",
        data.id,
        null,
        data,
        request as never
      );
      return NextResponse.json({ item: data, resource: "disposals", message: "報廢已登記" });
    }

    if (def.resource === "returns") {
      const qty = quantity!;
      const payload = {
        store_id: storeId,
        product_id: productId!,
        batch_id: batchId!,
        quantity: qty,
        reason,
        status: "open",
        created_by: auth!.profile.id,
        returned_at: new Date().toISOString(),
      };
      const { data, error: insertError } = await admin
        .from("store_returns")
        .insert(payload)
        .select()
        .single();
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      await applyBatchMovement({
        admin,
        storeId,
        productId: productId!,
        batchId: batchId!,
        qty,
        movementType: "return",
        referenceType: "store_returns",
        referenceId: data.id,
        createdBy: auth!.profile.id,
      });
      await logAudit(
        auth!.profile.id,
        "create",
        "store_returns",
        data.id,
        null,
        data,
        request as never
      );
      return NextResponse.json({ item: data, resource: "returns", message: "退貨已登記" });
    }

    // anomalies (issue / repair / special)
    const useBatch = Boolean(batchId);
    if ((type === "issue" || type === "repair") && !useBatch) {
      return NextResponse.json({ error: "請選擇批次" }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      store_id: storeId,
      product_id: productId,
      batch_id: batchId,
      anomaly_type: anomalyType,
      description: reason,
      quantity: quantity && quantity > 0 ? quantity : null,
      photo_url: photoUrl,
      status: "open",
      reported_by: auth!.profile.id,
      reported_at: new Date().toISOString(),
    };

    const { data, error: insertError } = await admin
      .from("store_anomalies")
      .insert(payload)
      .select()
      .single();
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    await logAudit(
      auth!.profile.id,
      "create",
      "store_anomalies",
      data.id,
      null,
      data,
      request as never
    );
    return NextResponse.json({ item: data, resource: "anomalies", message: "已登記" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "送出失敗" },
      { status: 500 }
    );
  }
}

async function applyBatchMovement(args: {
  admin: ReturnType<typeof createAdminClient>;
  storeId: string;
  productId: string;
  batchId: string;
  qty: number;
  movementType: "disposal" | "return";
  referenceType: string;
  referenceId: string;
  createdBy: string;
}) {
  try {
    const { recordInventoryMovement, syncInventoryFromBatches } = await import(
      "@/lib/admin/inventory-movements"
    );
    const { data: batch } = await args.admin
      .from("store_batches")
      .select("remaining_quantity, quantity")
      .eq("id", args.batchId)
      .single();
    if (!batch) return;
    const before = Number(batch.remaining_quantity ?? batch.quantity ?? 0);
    const after = Math.max(0, before - args.qty);
    await args.admin
      .from("store_batches")
      .update({ remaining_quantity: after })
      .eq("id", args.batchId);
    await recordInventoryMovement({
      storeId: args.storeId,
      productId: args.productId,
      batchId: args.batchId,
      movementType: args.movementType,
      quantityDelta: -args.qty,
      quantityBefore: before,
      quantityAfter: after,
      referenceType: args.referenceType,
      referenceId: args.referenceId,
      createdBy: args.createdBy,
    });
    await syncInventoryFromBatches(args.storeId, args.productId);
  } catch (e) {
    console.error("[store entry movement]", e);
  }
}

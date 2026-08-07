import { NextResponse } from "next/server";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreEntryDef, type StoreEntryType } from "@/lib/admin/store-entry";
import { assertCanWriteStore, resolveOpsStoreId } from "@/lib/admin/store-access";

type AdminClient = ReturnType<typeof createAdminClient>;

async function logStatusChange(args: {
  admin: AdminClient;
  storeId: string;
  resourceType: "store_anomalies" | "store_returns" | "store_disposals";
  resourceId: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  changedByName: string;
  note?: string | null;
}) {
  await args.admin.from("store_status_logs").insert({
    store_id: args.storeId,
    resource_type: args.resourceType,
    resource_id: args.resourceId,
    from_status: args.fromStatus,
    to_status: args.toStatus,
    note: args.note ?? null,
    changed_by: args.changedBy,
    changed_by_name: args.changedByName,
  });
}

const NEW_FIELD_RE =
  /pause_sales|assignee_name|urgency|affects_operations|manager_confirmed|disposal_reason|return_target|expected_return/i;

async function insertWithSoftFallback(
  admin: AdminClient,
  table: "store_anomalies" | "store_returns" | "store_disposals",
  payload: Record<string, unknown>,
  extraKeys: string[]
) {
  let result = await admin.from(table).insert(payload).select().single();
  if (result.error && NEW_FIELD_RE.test(result.error.message)) {
    const legacy = { ...payload };
    for (const key of extraKeys) delete legacy[key];
    result = await admin.from(table).insert(legacy).select().single();
  }
  return result;
}

/**
 * Unified field entry — maps quick-entry types onto existing store_* tables.
 * May create products only via /api/admin/store/products; entry expects product_id.
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
  const photoUrls = Array.isArray(body.photo_urls)
    ? (body.photo_urls as string[]).filter((u) => typeof u === "string" && u.trim())
    : photoUrl
      ? [photoUrl]
      : [];
  const anomalyType =
    (body.anomaly_type as string | undefined)?.trim() ||
    (body.case_kind as string | undefined)?.trim() ||
    def.anomalyType ||
    "other";
  const caseKind = (body.case_kind as string | undefined)?.trim() || anomalyType;
  const status = (body.status as string | undefined)?.trim() || "pending";
  const invoiceNo = (body.invoice_no as string | undefined)?.trim() || null;
  const location = (body.location as string | undefined)?.trim() || null;
  const productExpiry = (body.product_expiry as string | undefined)?.trim() || null;
  const customerName = (body.customer_name as string | undefined)?.trim() || null;
  const customerPhone = (body.customer_phone as string | undefined)?.trim() || null;
  const vendorName = (body.vendor_name as string | undefined)?.trim() || null;
  const piecesCount = body.pieces_count != null ? Number(body.pieces_count) : null;
  const receivedAtRaw = (body.received_at as string | undefined)?.trim() || null;
  const receivedAt = receivedAtRaw ? new Date(receivedAtRaw).toISOString() : null;
  const assigneeName = (body.assignee_name as string | undefined)?.trim() || null;
  const pauseSales = Boolean(body.pause_sales);
  const managerConfirmed = Boolean(body.manager_confirmed);
  const disposalReasonCode =
    (body.disposal_reason_code as string | undefined)?.trim() || null;
  const returnTarget = (body.return_target as string | undefined)?.trim() || null;
  const expectedReturnDate =
    (body.expected_return_date as string | undefined)?.trim() || null;
  const urgency = (body.urgency as string | undefined)?.trim() || null;
  const affectsOperations = Boolean(body.affects_operations);

  if (!reason) {
    return NextResponse.json({ error: "請填寫原因／說明" }, { status: 400 });
  }

  if (def.requiresProduct && !productId) {
    return NextResponse.json({ error: "請先選擇商品" }, { status: 400 });
  }
  if (def.requiresBatch && !batchId) {
    return NextResponse.json({ error: "請選擇批次" }, { status: 400 });
  }
  if (def.requiresQuantity || def.id === "issue" || def.id === "return") {
    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: "數量必須大於 0" }, { status: 400 });
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      item: { id: `tmp-${Date.now()}`, type, reason },
      message: "已新增（模擬）",
      resource: def.resource,
    });
  }

  const admin = createAdminClient();
  let storeId =
    (await resolveOpsStoreId(auth!, (body.store_id as string | undefined) || null)) || null;
  if (!storeId) {
    return NextResponse.json(
      { error: "找不到可用門市，或無權限寫入指定分店" },
      { status: 403 }
    );
  }
  const writeGate = await assertCanWriteStore(auth!, storeId);
  if (!writeGate.ok) return writeGate.response;

  const staffName =
    (auth!.profile as { full_name?: string | null }).full_name?.trim() || "門市人員";
  const now = new Date().toISOString();

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
      return NextResponse.json({
        item: data,
        resource: "store_messages",
        message: "留言已送出",
      });
    }

    if (def.resource === "disposals") {
      const unitCost = body.unit_cost != null ? Number(body.unit_cost) : null;
      const qty = quantity!;
      const disposalStatus = status || "pending";
      const payload: Record<string, unknown> = {
        store_id: storeId,
        product_id: productId!,
        batch_id: batchId,
        quantity: qty,
        reason,
        unit_cost: unitCost,
        total_loss: unitCost != null ? unitCost * qty : null,
        photo_url: photoUrls[0] ?? null,
        photo_urls: photoUrls,
        product_expiry: productExpiry,
        location,
        status: disposalStatus,
        status_changed_at: now,
        created_by: auth!.profile.id,
        disposed_at: disposalStatus === "disposed" ? now : null,
        manager_confirmed: managerConfirmed,
        assignee_name: assigneeName,
        disposal_reason_code: disposalReasonCode,
      };
      const { data, error: insertError } = await insertWithSoftFallback(
        admin,
        "store_disposals",
        payload,
        ["manager_confirmed", "assignee_name", "disposal_reason_code"]
      );
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      if (batchId) {
        await applyBatchMovement({
          admin,
          storeId,
          productId: productId!,
          batchId,
          qty,
          movementType: "disposal",
          referenceType: "store_disposals",
          referenceId: data.id,
          createdBy: auth!.profile.id,
        });
      }
      await logStatusChange({
        admin,
        storeId,
        resourceType: "store_disposals",
        resourceId: data.id,
        fromStatus: null,
        toStatus: disposalStatus,
        changedBy: auth!.profile.id,
        changedByName: staffName,
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
      const payload: Record<string, unknown> = {
        store_id: storeId,
        product_id: productId!,
        batch_id: batchId,
        quantity: qty,
        reason,
        status,
        case_kind: "customer_return",
        invoice_no: invoiceNo,
        location,
        product_expiry: productExpiry,
        photo_url: photoUrls[0] ?? null,
        photo_urls: photoUrls,
        status_changed_at: now,
        created_by: auth!.profile.id,
        returned_at: now,
        return_target: returnTarget,
        expected_return_date: expectedReturnDate,
        assignee_name: assigneeName,
      };
      const { data, error: insertError } = await insertWithSoftFallback(
        admin,
        "store_returns",
        payload,
        ["return_target", "expected_return_date", "assignee_name"]
      );
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      if (batchId) {
        await applyBatchMovement({
          admin,
          storeId,
          productId: productId!,
          batchId,
          qty,
          movementType: "return",
          referenceType: "store_returns",
          referenceId: data.id,
          createdBy: auth!.profile.id,
        });
      }
      await logStatusChange({
        admin,
        storeId,
        resourceType: "store_returns",
        resourceId: data.id,
        fromStatus: null,
        toStatus: status,
        changedBy: auth!.profile.id,
        changedByName: staffName,
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

    // anomalies: issue / repair / special
    const isRepair = def.id === "repair";
    const anomalyStatus = isRepair ? status || "notified_vendor" : status || "pending";
    const payload: Record<string, unknown> = {
      store_id: storeId,
      product_id: productId,
      batch_id: batchId,
      anomaly_type: anomalyType,
      case_kind: caseKind,
      description: reason,
      quantity: quantity && quantity > 0 ? quantity : null,
      photo_url: photoUrls[0] ?? null,
      photo_urls: photoUrls,
      invoice_no: invoiceNo,
      location,
      product_expiry: productExpiry,
      customer_name: customerName,
      customer_phone: customerPhone,
      vendor_name: vendorName,
      pieces_count: piecesCount && piecesCount > 0 ? piecesCount : null,
      received_at: receivedAt,
      status: isRepair ? anomalyStatus : anomalyStatus === "open" ? "pending" : anomalyStatus,
      status_changed_at: now,
      reported_by: auth!.profile.id,
      reported_at: now,
      pause_sales: pauseSales,
      assignee_name: assigneeName,
      urgency: isRepair ? urgency : null,
      affects_operations: isRepair ? affectsOperations : false,
    };

    const { data, error: insertError } = await insertWithSoftFallback(
      admin,
      "store_anomalies",
      payload,
      ["pause_sales", "assignee_name", "urgency", "affects_operations"]
    );
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await logStatusChange({
      admin,
      storeId,
      resourceType: "store_anomalies",
      resourceId: data.id,
      fromStatus: null,
      toStatus: String(payload.status),
      changedBy: auth!.profile.id,
      changedByName: staffName,
      note: isRepair ? "報修建立" : def.id === "issue" ? "異常建立" : null,
    });

    await logAudit(
      auth!.profile.id,
      "create",
      "store_anomalies",
      data.id,
      null,
      data,
      request as never
    );

    const message =
      def.id === "repair" ? "報修已登記" : def.id === "issue" ? "異常已登記" : "已登記";
    return NextResponse.json({
      item: data,
      resource: "anomalies",
      message,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "送出失敗" },
      { status: 500 }
    );
  }
}

async function applyBatchMovement(args: {
  admin: AdminClient;
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

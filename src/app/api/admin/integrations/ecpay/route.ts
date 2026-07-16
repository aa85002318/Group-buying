import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import {
  getEcpaySettings,
  saveEcpaySettings,
  toPublicView,
  type EcpayEnvironment,
  type EcpaySettingsPatch,
} from "@/lib/ecpay/settings";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const settings = await getEcpaySettings();
  return NextResponse.json(toPublicView(settings));
}

export async function PATCH(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const patch: EcpaySettingsPatch = {};

  if (typeof body.paymentEnabled === "boolean") patch.paymentEnabled = body.paymentEnabled;
  if (body.environment === "stage" || body.environment === "production") {
    patch.environment = body.environment as EcpayEnvironment;
  }
  if (typeof body.merchantId === "string") patch.merchantId = body.merchantId;
  if (typeof body.hashKey === "string") patch.hashKey = body.hashKey;
  if (typeof body.hashIv === "string") patch.hashIv = body.hashIv;
  if (typeof body.creditCardEnabled === "boolean") patch.creditCardEnabled = body.creditCardEnabled;
  if (typeof body.atmEnabled === "boolean") patch.atmEnabled = body.atmEnabled;
  if (typeof body.cvsPaymentEnabled === "boolean") {
    patch.cvsPaymentEnabled = body.cvsPaymentEnabled;
  }
  if (typeof body.logisticsEnabled === "boolean") patch.logisticsEnabled = body.logisticsEnabled;
  if (typeof body.homeDeliveryEnabled === "boolean") {
    patch.homeDeliveryEnabled = body.homeDeliveryEnabled;
  }
  if (typeof body.cvsPickupEnabled === "boolean") patch.cvsPickupEnabled = body.cvsPickupEnabled;
  if (typeof body.senderName === "string") patch.senderName = body.senderName;
  if (typeof body.senderPhone === "string") patch.senderPhone = body.senderPhone;
  if (typeof body.senderAddress === "string") patch.senderAddress = body.senderAddress;
  if (typeof body.logisticsMerchantId === "string") {
    patch.logisticsMerchantId = body.logisticsMerchantId;
  }
  if (typeof body.adminNotes === "string") patch.adminNotes = body.adminNotes;

  try {
    const saved = await saveEcpaySettings(patch);
    await logAudit(auth!.user.id, "ecpay_settings_update", "ecpay_integration_settings", "main", {
      paymentEnabled: saved.paymentEnabled,
      logisticsEnabled: saved.logisticsEnabled,
      environment: saved.environment,
    });
    return NextResponse.json(toPublicView(saved));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "儲存失敗" },
      { status: 500 }
    );
  }
}

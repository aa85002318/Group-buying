import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { getSiteUrl } from "@/lib/env";

export type EcpayEnvironment = "stage" | "production";

export type EcpayIntegrationSettings = {
  paymentEnabled: boolean;
  environment: EcpayEnvironment;
  merchantId: string;
  hashKey: string;
  hashIv: string;
  creditCardEnabled: boolean;
  atmEnabled: boolean;
  cvsPaymentEnabled: boolean;
  logisticsEnabled: boolean;
  homeDeliveryEnabled: boolean;
  cvsPickupEnabled: boolean;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  logisticsMerchantId: string;
  adminNotes: string;
};

export type EcpaySettingsPublicView = Omit<
  EcpayIntegrationSettings,
  "hashKey" | "hashIv"
> & {
  hashKeyMasked: string;
  hashIvMasked: string;
  hashKeyConfigured: boolean;
  hashIvConfigured: boolean;
  callbackUrls: {
    paymentReturn: string;
    paymentNotify: string;
    logisticsNotify: string;
  };
  gatewayUrls: {
    payment: string;
    logistics: string;
  };
  readiness: {
    paymentReady: boolean;
    logisticsReady: boolean;
    missing: string[];
  };
};

export const DEFAULT_ECPAY_SETTINGS: EcpayIntegrationSettings = {
  paymentEnabled: false,
  environment: "stage",
  merchantId: "",
  hashKey: "",
  hashIv: "",
  creditCardEnabled: true,
  atmEnabled: false,
  cvsPaymentEnabled: false,
  logisticsEnabled: false,
  homeDeliveryEnabled: false,
  cvsPickupEnabled: false,
  senderName: "",
  senderPhone: "",
  senderAddress: "",
  logisticsMerchantId: "",
  adminNotes: "",
};

function maskSecret(value: string): string {
  const v = value.trim();
  if (!v) return "（尚未設定）";
  if (v.length <= 4) return "••••";
  return `${"•".repeat(Math.min(12, v.length - 4))}${v.slice(-4)}`;
}

export function ecpayGatewayUrls(environment: EcpayEnvironment) {
  if (environment === "production") {
    return {
      payment: "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5",
      logistics: "https://logistics.ecpay.com.tw/Express/Create",
    };
  }
  return {
    payment: "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5",
    logistics: "https://logistics-stage.ecpay.com.tw/Express/Create",
  };
}

export function ecpayCallbackUrls(baseUrl = getSiteUrl()) {
  const base = baseUrl.replace(/\/$/, "");
  return {
    paymentReturn: `${base}/api/payment/callback`,
    paymentNotify: `${base}/api/payment/callback`,
    logisticsNotify: `${base}/api/logistics/ecpay/callback`,
  };
}

function rowToSettings(row: Record<string, unknown> | null | undefined): EcpayIntegrationSettings {
  if (!row) return { ...DEFAULT_ECPAY_SETTINGS };
  return {
    paymentEnabled: Boolean(row.payment_enabled),
    environment: row.environment === "production" ? "production" : "stage",
    merchantId: String(row.merchant_id ?? ""),
    hashKey: String(row.hash_key ?? ""),
    hashIv: String(row.hash_iv ?? ""),
    creditCardEnabled: row.credit_card_enabled !== false,
    atmEnabled: Boolean(row.atm_enabled),
    cvsPaymentEnabled: Boolean(row.cvs_payment_enabled),
    logisticsEnabled: Boolean(row.logistics_enabled),
    homeDeliveryEnabled: Boolean(row.home_delivery_enabled),
    cvsPickupEnabled: Boolean(row.cvs_pickup_enabled),
    senderName: String(row.sender_name ?? ""),
    senderPhone: String(row.sender_phone ?? ""),
    senderAddress: String(row.sender_address ?? ""),
    logisticsMerchantId: String(row.logistics_merchant_id ?? ""),
    adminNotes: String(row.admin_notes ?? ""),
  };
}

export function computeEcpayReadiness(settings: EcpayIntegrationSettings) {
  const missing: string[] = [];
  if (!settings.merchantId.trim()) missing.push("特店編號 MerchantID");
  if (!settings.hashKey.trim()) missing.push("HashKey");
  if (!settings.hashIv.trim()) missing.push("HashIV");

  const credentialsOk = missing.length === 0;
  const paymentReady = settings.paymentEnabled && credentialsOk;
  const logisticsReady =
    settings.logisticsEnabled &&
    credentialsOk &&
    (settings.homeDeliveryEnabled || settings.cvsPickupEnabled) &&
    Boolean(settings.senderName.trim() && settings.senderPhone.trim());

  if (settings.logisticsEnabled) {
    if (!settings.homeDeliveryEnabled && !settings.cvsPickupEnabled) {
      missing.push("至少啟用一種物流方式（宅配或超商）");
    }
    if (!settings.senderName.trim()) missing.push("寄件人姓名");
    if (!settings.senderPhone.trim()) missing.push("寄件人電話");
  }

  return { paymentReady, logisticsReady, missing };
}

export function toPublicView(settings: EcpayIntegrationSettings): EcpaySettingsPublicView {
  const readiness = computeEcpayReadiness(settings);
  return {
    paymentEnabled: settings.paymentEnabled,
    environment: settings.environment,
    merchantId: settings.merchantId,
    creditCardEnabled: settings.creditCardEnabled,
    atmEnabled: settings.atmEnabled,
    cvsPaymentEnabled: settings.cvsPaymentEnabled,
    logisticsEnabled: settings.logisticsEnabled,
    homeDeliveryEnabled: settings.homeDeliveryEnabled,
    cvsPickupEnabled: settings.cvsPickupEnabled,
    senderName: settings.senderName,
    senderPhone: settings.senderPhone,
    senderAddress: settings.senderAddress,
    logisticsMerchantId: settings.logisticsMerchantId,
    adminNotes: settings.adminNotes,
    hashKeyMasked: maskSecret(settings.hashKey),
    hashIvMasked: maskSecret(settings.hashIv),
    hashKeyConfigured: Boolean(settings.hashKey.trim()),
    hashIvConfigured: Boolean(settings.hashIv.trim()),
    callbackUrls: ecpayCallbackUrls(),
    gatewayUrls: ecpayGatewayUrls(settings.environment),
    readiness,
  };
}

export async function getEcpaySettings(): Promise<EcpayIntegrationSettings> {
  if (!isSupabaseConfigured()) return { ...DEFAULT_ECPAY_SETTINGS };

  const admin = createAdminClient();
  const { data } = await admin
    .from("ecpay_integration_settings")
    .select("*")
    .eq("singleton_key", "main")
    .maybeSingle();

  const fromDb = rowToSettings(data);

  // Optional env fallback when DB secrets empty
  return {
    ...fromDb,
    merchantId: fromDb.merchantId || process.env.ECPAY_MERCHANT_ID?.trim() || "",
    hashKey: fromDb.hashKey || process.env.ECPAY_HASH_KEY?.trim() || "",
    hashIv: fromDb.hashIv || process.env.ECPAY_HASH_IV?.trim() || "",
    environment:
      fromDb.environment ||
      (process.env.ECPAY_ENVIRONMENT === "production" ? "production" : "stage"),
  };
}

export type EcpaySettingsPatch = Partial<{
  paymentEnabled: boolean;
  environment: EcpayEnvironment;
  merchantId: string;
  hashKey: string;
  hashIv: string;
  creditCardEnabled: boolean;
  atmEnabled: boolean;
  cvsPaymentEnabled: boolean;
  logisticsEnabled: boolean;
  homeDeliveryEnabled: boolean;
  cvsPickupEnabled: boolean;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  logisticsMerchantId: string;
  adminNotes: string;
}>;

export async function saveEcpaySettings(patch: EcpaySettingsPatch): Promise<EcpayIntegrationSettings> {
  const current = await getEcpaySettings();

  const next: EcpayIntegrationSettings = {
    ...current,
    paymentEnabled: patch.paymentEnabled ?? current.paymentEnabled,
    environment: patch.environment ?? current.environment,
    merchantId: patch.merchantId !== undefined ? patch.merchantId.trim() : current.merchantId,
    // Empty string means "keep existing secret"
    hashKey:
      patch.hashKey !== undefined && patch.hashKey.trim() !== ""
        ? patch.hashKey.trim()
        : current.hashKey,
    hashIv:
      patch.hashIv !== undefined && patch.hashIv.trim() !== ""
        ? patch.hashIv.trim()
        : current.hashIv,
    creditCardEnabled: patch.creditCardEnabled ?? current.creditCardEnabled,
    atmEnabled: patch.atmEnabled ?? current.atmEnabled,
    cvsPaymentEnabled: patch.cvsPaymentEnabled ?? current.cvsPaymentEnabled,
    logisticsEnabled: patch.logisticsEnabled ?? current.logisticsEnabled,
    homeDeliveryEnabled: patch.homeDeliveryEnabled ?? current.homeDeliveryEnabled,
    cvsPickupEnabled: patch.cvsPickupEnabled ?? current.cvsPickupEnabled,
    senderName: patch.senderName !== undefined ? patch.senderName.trim() : current.senderName,
    senderPhone: patch.senderPhone !== undefined ? patch.senderPhone.trim() : current.senderPhone,
    senderAddress:
      patch.senderAddress !== undefined ? patch.senderAddress.trim() : current.senderAddress,
    logisticsMerchantId:
      patch.logisticsMerchantId !== undefined
        ? patch.logisticsMerchantId.trim()
        : current.logisticsMerchantId,
    adminNotes: patch.adminNotes !== undefined ? patch.adminNotes.trim() : current.adminNotes,
  };

  if (!isSupabaseConfigured()) return next;

  const admin = createAdminClient();
  const { error } = await admin.from("ecpay_integration_settings").upsert(
    {
      singleton_key: "main",
      payment_enabled: next.paymentEnabled,
      environment: next.environment,
      merchant_id: next.merchantId,
      hash_key: next.hashKey,
      hash_iv: next.hashIv,
      credit_card_enabled: next.creditCardEnabled,
      atm_enabled: next.atmEnabled,
      cvs_payment_enabled: next.cvsPaymentEnabled,
      logistics_enabled: next.logisticsEnabled,
      home_delivery_enabled: next.homeDeliveryEnabled,
      cvs_pickup_enabled: next.cvsPickupEnabled,
      sender_name: next.senderName,
      sender_phone: next.senderPhone,
      sender_address: next.senderAddress,
      logistics_merchant_id: next.logisticsMerchantId,
      admin_notes: next.adminNotes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "singleton_key" }
  );

  if (error) throw new Error(error.message);
  return next;
}

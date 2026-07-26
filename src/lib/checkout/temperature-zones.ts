/** Product temperature / storage zone helpers for split-shipment rules. */

export type TemperatureZone = "ambient" | "chilled" | "frozen";

export const TEMPERATURE_ZONE_LABELS: Record<TemperatureZone, string> = {
  ambient: "常溫",
  chilled: "冷藏",
  frozen: "冷凍",
};

export type ProductTemperatureFlags = {
  id: string;
  name?: string | null;
  storage_type?: string | null;
  temp_ambient?: boolean | null;
  temp_chilled?: boolean | null;
  temp_frozen?: boolean | null;
};

/** Resolve primary shipping zone for a product (frozen > chilled > ambient). */
export function resolveProductTemperatureZone(
  product: ProductTemperatureFlags
): TemperatureZone {
  if (product.storage_type === "frozen" || product.temp_frozen) return "frozen";
  if (product.storage_type === "chilled" || product.temp_chilled) return "chilled";
  if (product.storage_type === "ambient" || product.temp_ambient !== false) return "ambient";
  if (product.temp_ambient) return "ambient";
  return "ambient";
}

export function collectTemperatureZones(
  products: ProductTemperatureFlags[]
): TemperatureZone[] {
  const set = new Set<TemperatureZone>();
  for (const p of products) {
    set.add(resolveProductTemperatureZone(p));
  }
  return Array.from(set);
}

export function formatTemperatureZones(zones: TemperatureZone[]): string {
  return zones.map((z) => TEMPERATURE_ZONE_LABELS[z]).join("、");
}

/**
 * Home delivery / CVS cannot mix temperature zones in one shipment.
 * Store pickup may combine zones (customer picks up everything).
 */
export function assertShipmentTemperatureCompatible(input: {
  shipmentMethod: string;
  zones: TemperatureZone[];
}): { ok: true } | { ok: false; code: "TEMPERATURE_SPLIT"; message: string } {
  const method = input.shipmentMethod;
  const needsSingleZone =
    method === "home_delivery" ||
    method === "cvs_pickup" ||
    method === "ambient" ||
    method === "chilled" ||
    method === "frozen";

  if (!needsSingleZone) {
    return { ok: true };
  }

  if (input.zones.length <= 1) {
    return { ok: true };
  }

  return {
    ok: false,
    code: "TEMPERATURE_SPLIT",
    message: `購物車含不同溫層（${formatTemperatureZones(input.zones)}），宅配／超商無法合併配送，請分開結帳或改選門市取貨`,
  };
}

export function buildTemperatureSplitNotice(zones: TemperatureZone[]): string | null {
  if (zones.length <= 1) return null;
  return `購物車含 ${formatTemperatureZones(zones)} 商品。不同溫層宅配需分開下單；門市取貨可合併。`;
}

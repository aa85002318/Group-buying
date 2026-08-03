/** Phase D — Chinese Excel templates & export definitions for store ops hub. */

export type StoreExcelImportType =
  | "products"
  | "price"
  | "expiry"
  | "inventory"
  | "anomaly"
  | "disposal"
  | "return";

export type StoreExcelExportType =
  | "products"
  | "price"
  | "expiry"
  | "inventory"
  | "anomaly"
  | "disposal"
  | "return"
  | "requests";

export type StoreExcelTemplate = {
  id: StoreExcelImportType;
  label: string;
  description: string;
  /** Filename without extension */
  fileStem: string;
  headers: string[];
  sample: string[];
  /** If true, hub links to product master import instead of store import API */
  externalHref?: string;
  /** Can preview/commit via /api/admin/store/import */
  supportsStoreImport: boolean;
};

export const STORE_EXCEL_TEMPLATES: StoreExcelTemplate[] = [
  {
    id: "products",
    label: "商品匯入範本",
    description: "新增商品主檔（名稱、規格、品牌、售價、成本、安全庫存）",
    fileStem: "商品匯入範本",
    headers: ["商品編號", "商品名稱", "規格", "品牌", "售價", "成本", "安全庫存", "條碼", "分類"],
    sample: ["SKU-DEMO001", "示範高筋麵粉", "1kg", "示範品牌", "299", "180", "10", "4710000000001", "麵粉"],
    externalHref: "/admin/products/import",
    supportsStoreImport: false,
  },
  {
    id: "price",
    label: "價格更新範本",
    description: "依條碼／SKU 更新售價、成本、安全庫存（不新建商品）",
    fileStem: "價格更新範本",
    headers: ["條碼", "SKU", "商品名稱", "售價", "成本", "安全庫存"],
    sample: ["4710000000001", "SKU-DEMO001", "示範高筋麵粉", "299", "180", "10"],
    supportsStoreImport: true,
  },
  {
    id: "expiry",
    label: "效期更新範本",
    description: "依條碼進貨／更新批次效期與數量",
    fileStem: "效期更新範本",
    headers: ["條碼", "SKU", "商品名稱", "批號", "到期日", "數量", "廠商", "分類"],
    sample: ["4710000000001", "SKU-DEMO001", "示範高筋麵粉", "LOT202608", "2027-12-31", "20", "示範廠商", "麵粉"],
    supportsStoreImport: true,
  },
  {
    id: "inventory",
    label: "庫存更新範本",
    description: "依條碼／批號調整批次剩餘數量",
    fileStem: "庫存更新範本",
    headers: ["條碼", "SKU", "批號", "數量", "備註"],
    sample: ["4710000000001", "SKU-DEMO001", "LOT202608", "15", "盤點調整"],
    supportsStoreImport: true,
  },
  {
    id: "anomaly",
    label: "商品異常範本",
    description: "批次登錄商品異常／報修",
    fileStem: "商品異常範本",
    headers: ["條碼", "SKU", "批號", "數量", "異常類型", "原因"],
    sample: ["4710000000001", "SKU-DEMO001", "LOT202608", "1", "損壞", "外包裝破損"],
    supportsStoreImport: true,
  },
  {
    id: "disposal",
    label: "報廢範本",
    description: "批次登錄報廢（依條碼找商品）",
    fileStem: "報廢範本",
    headers: ["條碼", "SKU", "批號", "數量", "原因", "成本"],
    sample: ["4710000000001", "SKU-DEMO001", "LOT202608", "2", "過期報廢", "180"],
    supportsStoreImport: true,
  },
  {
    id: "return",
    label: "退貨範本",
    description: "批次登錄退貨（需批號）",
    fileStem: "退貨範本",
    headers: ["條碼", "SKU", "批號", "數量", "原因"],
    sample: ["4710000000001", "SKU-DEMO001", "LOT202608", "1", "品質不佳"],
    supportsStoreImport: true,
  },
];

export type StoreExcelExportDef = {
  id: StoreExcelExportType;
  label: string;
  description: string;
  fileStem: string;
};

export const STORE_EXCEL_EXPORTS: StoreExcelExportDef[] = [
  {
    id: "inventory",
    label: "目前庫存",
    description: "各商品門市庫存數量",
    fileStem: "目前庫存匯出",
  },
  {
    id: "expiry",
    label: "效期批次",
    description: "所有有效批次與到期日",
    fileStem: "效期批次匯出",
  },
  {
    id: "price",
    label: "商品價格",
    description: "SKU／條碼／售價／成本／安全庫存",
    fileStem: "商品價格匯出",
  },
  {
    id: "anomaly",
    label: "商品異常",
    description: "未結案與近期異常紀錄",
    fileStem: "商品異常匯出",
  },
  {
    id: "disposal",
    label: "報廢紀錄",
    description: "近期報廢明細",
    fileStem: "報廢紀錄匯出",
  },
  {
    id: "return",
    label: "退貨紀錄",
    description: "近期退貨明細",
    fileStem: "退貨紀錄匯出",
  },
  {
    id: "requests",
    label: "分店需求",
    description: "叫貨需求列表",
    fileStem: "分店需求匯出",
  },
];

export function getStoreExcelTemplate(id: string): StoreExcelTemplate | undefined {
  return STORE_EXCEL_TEMPLATES.find((t) => t.id === id);
}

export function encodeContentDisposition(filename: string): string {
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${filename.replace(/[^\x20-\x7E]/g, "_")}"; filename*=UTF-8''${encoded}`;
}

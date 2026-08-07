/** Chinese Excel templates & export definitions for store collaboration hub. */

export type StoreExcelImportType =
  | "products"
  | "price"
  | "expiry"
  | "inventory"
  | "anomaly"
  | "disposal"
  | "return"
  | "repair"
  | "customer_order"
  | "price_inquiry"
  | "demand"
  | "worklog"
  | "todo";

export type StoreExcelExportType =
  | "products"
  | "price"
  | "expiry"
  | "inventory"
  | "anomaly"
  | "disposal"
  | "return"
  | "repair"
  | "requests"
  | "customer_orders"
  | "price_inquiries"
  | "worklogs"
  | "todos";

export type StoreExcelTemplate = {
  id: StoreExcelImportType;
  label: string;
  description: string;
  /** Filename without extension — all Chinese */
  fileStem: string;
  headers: string[];
  sample: string[];
  group: "catalog" | "product_ops" | "collaboration" | "work";
  /** If set, hub links to another page instead of store import API */
  externalHref?: string;
  /** Can preview/commit via /api/admin/store/import */
  supportsStoreImport: boolean;
};

export const STORE_EXCEL_TEMPLATES: StoreExcelTemplate[] = [
  {
    id: "customer_order",
    label: "門市客戶訂購範本",
    description: "現場客戶訂購紀錄欄位說明（建立請走客戶服務）",
    fileStem: "門市客戶訂購範本",
    headers: [
      "姓名",
      "電話",
      "客戶來源",
      "條碼",
      "商品名稱",
      "數量",
      "希望到貨日",
      "取貨分店",
      "負責人",
      "備註",
    ],
    sample: [
      "王小明",
      "0912345678",
      "現場",
      "4710000000001",
      "示範高筋麵粉",
      "2",
      "2026-08-10",
      "復興店",
      "小美",
      "要冷藏",
    ],
    group: "collaboration",
    externalHref: "/admin/store/pos?type=order",
    supportsStoreImport: false,
  },
  {
    id: "price_inquiry",
    label: "價格詢問紀錄範本",
    description: "價格詢問欄位說明（建立請走客戶服務）",
    fileStem: "價格詢問紀錄範本",
    headers: [
      "姓名",
      "電話",
      "條碼",
      "商品名稱",
      "預估訂購量",
      "詢問內容",
      "需正式報價",
      "預計回覆日",
      "負責人",
      "備註",
    ],
    sample: [
      "李小姐",
      "0987654321",
      "4710000000001",
      "示範鮮奶油",
      "10",
      "企業大量詢價",
      "是",
      "2026-08-08",
      "小美",
      "",
    ],
    group: "collaboration",
    externalHref: "/admin/store/pos?type=price_inquiry",
    supportsStoreImport: false,
  },
  {
    id: "demand",
    label: "分店貨品需求範本",
    description: "跨店需求欄位說明（建立請走分店協作）",
    fileStem: "分店貨品需求範本",
    headers: ["條碼", "SKU", "商品名稱", "數量", "希望來源分店", "備註"],
    sample: ["4710000000001", "SKU-DEMO001", "示範高筋麵粉", "10", "信義店", "週五前需要"],
    group: "collaboration",
    externalHref: "/admin/store/demand?type=restock",
    supportsStoreImport: false,
  },
  {
    id: "anomaly",
    label: "商品異常紀錄範本",
    description: "批次登錄商品異常（寫入既有異常表）",
    fileStem: "商品異常紀錄範本",
    headers: ["條碼", "SKU", "批號", "數量", "異常類型", "原因", "負責人"],
    sample: ["4710000000001", "SKU-DEMO001", "LOT202608", "1", "損壞", "外包裝破損", "小美"],
    group: "product_ops",
    supportsStoreImport: true,
  },
  {
    id: "disposal",
    label: "商品報廢紀錄範本",
    description: "批次登錄報廢（依條碼找商品）",
    fileStem: "商品報廢紀錄範本",
    headers: ["條碼", "SKU", "批號", "數量", "原因", "成本", "效期", "負責人"],
    sample: ["4710000000001", "SKU-DEMO001", "LOT202608", "2", "過期報廢", "180", "2026-07-01", "小美"],
    group: "product_ops",
    supportsStoreImport: true,
  },
  {
    id: "return",
    label: "商品退貨紀錄範本",
    description: "批次登錄退貨",
    fileStem: "商品退貨紀錄範本",
    headers: ["條碼", "SKU", "批號", "數量", "原因", "退貨對象", "預計退貨日", "負責人"],
    sample: [
      "4710000000001",
      "SKU-DEMO001",
      "LOT202608",
      "1",
      "品質不佳",
      "退回廠商",
      "2026-08-12",
      "小美",
    ],
    group: "product_ops",
    supportsStoreImport: true,
  },
  {
    id: "repair",
    label: "商品報修紀錄範本",
    description: "批次登錄報修（寫入異常表，類型＝報修）",
    fileStem: "商品報修紀錄範本",
    headers: ["條碼", "SKU", "數量", "故障說明", "緊急程度", "客戶姓名", "電話", "廠商", "負責人"],
    sample: [
      "4710000000001",
      "SKU-DEMO001",
      "1",
      "馬達異音",
      "高",
      "陳先生",
      "0911111111",
      "示範廠商",
      "小美",
    ],
    group: "product_ops",
    supportsStoreImport: true,
  },
  {
    id: "expiry",
    label: "商品效期更新範本",
    description: "依條碼進貨／更新批次效期與數量",
    fileStem: "商品效期更新範本",
    headers: ["條碼", "SKU", "商品名稱", "批號", "到期日", "數量", "廠商", "分類"],
    sample: [
      "4710000000001",
      "SKU-DEMO001",
      "示範高筋麵粉",
      "LOT202608",
      "2027-12-31",
      "20",
      "示範廠商",
      "麵粉",
    ],
    group: "product_ops",
    supportsStoreImport: true,
  },
  {
    id: "worklog",
    label: "每日工作紀錄範本",
    description: "工作紀錄欄位說明（建立請走工作管理）",
    fileStem: "每日工作紀錄範本",
    headers: ["日期", "內容", "填寫人"],
    sample: ["2026-08-06", "完成冷藏清點與交班", "小美"],
    group: "work",
    externalHref: "/admin/store?tab=worklogs#calendar",
    supportsStoreImport: false,
  },
  {
    id: "todo",
    label: "明日待辦事項範本",
    description: "待辦欄位說明（建立請走工作管理）",
    fileStem: "明日待辦事項範本",
    headers: ["日期", "待辦內容", "是否完成"],
    sample: ["2026-08-07", "回覆價格詢問", "否"],
    group: "work",
    externalHref: "/admin/store?tab=todos&date=tomorrow#calendar",
    supportsStoreImport: false,
  },
  {
    id: "inventory",
    label: "庫存更新範本",
    description: "依條碼／批號調整批次剩餘數量",
    fileStem: "庫存更新範本",
    headers: ["條碼", "SKU", "批號", "數量", "備註"],
    sample: ["4710000000001", "SKU-DEMO001", "LOT202608", "15", "盤點調整"],
    group: "catalog",
    supportsStoreImport: true,
  },
  {
    id: "price",
    label: "價格更新範本",
    description: "依條碼／SKU 更新售價、成本、安全庫存（不新建商品）",
    fileStem: "價格更新範本",
    headers: ["條碼", "SKU", "商品名稱", "售價", "成本", "安全庫存"],
    sample: ["4710000000001", "SKU-DEMO001", "示範高筋麵粉", "299", "180", "10"],
    group: "catalog",
    supportsStoreImport: true,
  },
  {
    id: "products",
    label: "商品匯入範本",
    description: "新增商品主檔（寫入 products）",
    fileStem: "商品匯入範本",
    headers: ["商品編號", "商品名稱", "規格", "品牌", "售價", "成本", "安全庫存", "條碼", "分類"],
    sample: ["SKU-DEMO001", "示範高筋麵粉", "1kg", "示範品牌", "299", "180", "10", "4710000000001", "麵粉"],
    group: "catalog",
    externalHref: "/admin/products/import",
    supportsStoreImport: false,
  },
];

export const STORE_EXCEL_GROUPS: Array<{
  id: StoreExcelTemplate["group"];
  label: string;
}> = [
  { id: "collaboration", label: "客戶服務／分店協作" },
  { id: "product_ops", label: "商品處理" },
  { id: "work", label: "工作管理" },
  { id: "catalog", label: "商品主檔／庫存價格" },
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
    fileStem: "商品效期批次匯出",
  },
  {
    id: "price",
    label: "商品價格",
    description: "SKU／條碼／售價／成本／安全庫存",
    fileStem: "商品價格匯出",
  },
  {
    id: "anomaly",
    label: "商品異常紀錄",
    description: "異常紀錄（不含報修）",
    fileStem: "商品異常紀錄匯出",
  },
  {
    id: "repair",
    label: "商品報修紀錄",
    description: "報修追蹤紀錄",
    fileStem: "商品報修紀錄匯出",
  },
  {
    id: "disposal",
    label: "商品報廢紀錄",
    description: "近期報廢明細",
    fileStem: "商品報廢紀錄匯出",
  },
  {
    id: "return",
    label: "商品退貨紀錄",
    description: "近期退貨明細",
    fileStem: "商品退貨紀錄匯出",
  },
  {
    id: "requests",
    label: "分店貨品需求",
    description: "叫貨／調貨需求列表",
    fileStem: "分店貨品需求匯出",
  },
  {
    id: "customer_orders",
    label: "門市客戶訂購",
    description: "客戶訂購服務紀錄",
    fileStem: "門市客戶訂購匯出",
  },
  {
    id: "price_inquiries",
    label: "價格詢問紀錄",
    description: "價格詢問服務紀錄",
    fileStem: "價格詢問紀錄匯出",
  },
  {
    id: "worklogs",
    label: "每日工作紀錄",
    description: "近期工作紀錄",
    fileStem: "每日工作紀錄匯出",
  },
  {
    id: "todos",
    label: "待辦事項",
    description: "近日待辦清單",
    fileStem: "待辦事項匯出",
  },
];

export function getStoreExcelTemplate(id: string): StoreExcelTemplate | undefined {
  return STORE_EXCEL_TEMPLATES.find((t) => t.id === id);
}

export function isStoreExcelImportType(id: string): id is StoreExcelImportType {
  return STORE_EXCEL_TEMPLATES.some((t) => t.id === id);
}

export function encodeContentDisposition(filename: string): string {
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${filename.replace(/[^\x20-\x7E]/g, "_")}"; filename*=UTF-8''${encoded}`;
}

/** Client-side error detail sheet (CSV) */
export function buildImportErrorCsv(
  rows: Array<{ row: number; errors: string[]; product_name?: string; barcode?: string }>
): string {
  const header = ["列", "條碼", "商品", "錯誤"].join(",");
  const lines = rows
    .filter((r) => r.errors.length > 0)
    .map((r) =>
      [r.row, r.barcode ?? "", r.product_name ?? "", r.errors.join("；")]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",")
    );
  return "\uFEFF" + [header, ...lines].join("\n");
}

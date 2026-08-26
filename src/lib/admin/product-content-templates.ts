export const PRODUCT_CONTENT_SECTIONS = [
  "rich_description",
  "product_info",
  "specifications",
] as const;

export type ProductContentSection = (typeof PRODUCT_CONTENT_SECTIONS)[number];

export const PRODUCT_CONTENT_SECTION_LABELS: Record<ProductContentSection, string> = {
  rich_description: "商品介紹（商品特色）",
  product_info: "適合用途",
  specifications: "商品規格",
};

export type ProductContentTemplate = {
  id: string;
  name: string;
  template_key: string;
  section: ProductContentSection;
  body_html: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export function isProductContentSection(v: unknown): v is ProductContentSection {
  return (
    typeof v === "string" &&
    (PRODUCT_CONTENT_SECTIONS as readonly string[]).includes(v)
  );
}

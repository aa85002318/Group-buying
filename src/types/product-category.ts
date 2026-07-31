/** Product category tree for home drawer / mall navigation. */

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  href: string;
  icon?: string;
  imageUrl?: string;
  sortOrder: number;
  enabled: boolean;
  children?: ProductCategory[];
};

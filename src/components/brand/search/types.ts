export type SearchScope =
  | "global"
  | "products"
  | "recipes"
  | "courses"
  | "group_buy"
  | "articles";

export type BrandSearchProps = {
  scope?: SearchScope;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  /** Floating style under hero */
  floating?: boolean;
  onSubmitQuery?: (q: string) => void;
};

export const SEARCH_SCOPE_PATH: Record<SearchScope, string> = {
  global: "/search",
  products: "/products",
  recipes: "/recipes",
  courses: "/courses",
  group_buy: "/group-buy",
  articles: "/articles",
};

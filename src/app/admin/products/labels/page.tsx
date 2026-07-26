import { ProductLabelPrintCenter } from "@/components/admin/labels/ProductLabelPrintCenter";

type PageProps = {
  searchParams?: Promise<{ productIds?: string; productId?: string }> | {
    productIds?: string;
    productId?: string;
  };
};

export default async function AdminProductLabelsPage({ searchParams }: PageProps) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams ?? {};
  const fromList = (params.productIds ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const single = params.productId?.trim();
  const initialProductIds = single ? [single, ...fromList] : fromList;

  return <ProductLabelPrintCenter initialProductIds={Array.from(new Set(initialProductIds))} />;
}

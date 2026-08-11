import { permanentRedirect } from "next/navigation";
import { APP_ROUTES } from "@/lib/site-links";

export default function ProductsRedirect({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (Array.isArray(value)) value.forEach((item) => qs.append(key, item));
    else if (value) qs.set(key, value);
  }
  const query = qs.toString();
  permanentRedirect(query ? `${APP_ROUTES.shop}?${query}` : APP_ROUTES.shop);
}

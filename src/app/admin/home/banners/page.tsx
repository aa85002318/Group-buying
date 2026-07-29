import { redirect } from "next/navigation";

export default async function AdminHomeBannersAlias({
  searchParams,
}: {
  searchParams?: Promise<{ placement?: string }> | { placement?: string };
}) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams ?? {};
  if (params.placement === "home_hero") {
    redirect("/admin/brand-system/heroes");
  }
  const q = params.placement ? `?placement=${encodeURIComponent(params.placement)}` : "";
  redirect(`/admin/banners${q}`);
}

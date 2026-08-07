import { Suspense } from "react";
import { ShopCmsStudio } from "@/components/admin/shop/ShopCmsStudio";

/** Shop homepage CMS hub — studio shell with section list + live preview. */
export default function AdminShopCmsHubPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">載入商城 CMS…</p>}>
      <ShopCmsStudio />
    </Suspense>
  );
}

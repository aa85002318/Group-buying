import { Suspense } from "react";
import { ShopHomeCms } from "@/components/admin/shop/ShopHomeCms";

export default function AdminShopHomePage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#687386]">載入商城首頁設定…</p>}>
      <ShopHomeCms />
    </Suspense>
  );
}

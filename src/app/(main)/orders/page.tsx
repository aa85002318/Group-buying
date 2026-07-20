import { Suspense } from "react";
import { OrdersClient } from "./OrdersClient";

/** Legacy `/orders` — same App order data as `/member/orders` */
export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      }
    >
      <OrdersClient appOrdersOnly />
    </Suspense>
  );
}

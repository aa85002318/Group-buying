import { Suspense } from "react";
import MonsterSuccessClient from "./MonsterSuccessClient";

export default function MonsterSuccessPage() {
  return (
    <Suspense fallback={<p className="text-center text-muted-foreground py-8">載入中…</p>}>
      <MonsterSuccessClient />
    </Suspense>
  );
}

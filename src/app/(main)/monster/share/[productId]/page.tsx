import { Suspense } from "react";
import MonsterShareClient from "./MonsterShareClient";

export default function MonsterSharePage() {
  return (
    <Suspense fallback={<p className="text-center text-muted-foreground py-8">載入中…</p>}>
      <MonsterShareClient />
    </Suspense>
  );
}

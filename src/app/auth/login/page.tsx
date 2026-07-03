import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">載入中...</div>}>
      <LoginClient />
    </Suspense>
  );
}

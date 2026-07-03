import { Suspense } from "react";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background p-8 text-center text-coffee/70">載入中...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

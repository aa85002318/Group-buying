import { Header } from "@/components/layout/Header";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-[calc(var(--header-height)+var(--header-content-gap))]">{children}</div>
    </div>
  );
}

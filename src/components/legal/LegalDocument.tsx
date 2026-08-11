import Link from "next/link";
import { sanitizeCmsHtml } from "@/lib/cms/safeHtml";

export function LegalDocument({
  title,
  updatedAt,
  children,
  html,
}: {
  title: string;
  updatedAt: string;
  children?: React.ReactNode;
  html?: string;
}) {
  return (
    <article className="mx-auto max-w-2xl space-y-6 pb-8">
      <header className="space-y-2 border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-coffee">{title}</h1>
        <p className="text-sm text-muted-foreground">最後更新日期：{updatedAt}</p>
      </header>
      <div className="space-y-5 text-sm leading-relaxed text-coffee [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-bold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline">
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(html) }} />
        ) : (
          children
        )}
      </div>
      <p className="border-t border-border pt-4 text-sm text-muted-foreground">
        <Link href="/">← 返回首頁</Link>
        {" · "}
        <Link href="/privacy">隱私權政策</Link>
        {" · "}
        <Link href="/terms">服務條款</Link>
        {" · "}
        <Link href="/account-deletion">刪除帳號說明</Link>
      </p>
    </article>
  );
}

import Link from "next/link";

type ShopCmsLiveSaveNoticeProps = {
  /** Hub section query, e.g. categories */
  section?: string;
  /** When true, this editor writes layout draft instead of going live */
  draftMode?: boolean;
};

/** Shared callout for shop CMS detail editors. */
export function ShopCmsLiveSaveNotice({
  section,
  draftMode = false,
}: ShopCmsLiveSaveNoticeProps) {
  const hubHref = section
    ? `/admin/shop?section=${encodeURIComponent(section)}`
    : "/admin/shop";

  if (draftMode) {
    return (
      <p className="rounded-xl border border-[#FFE149]/70 bg-[#FFFBEA] px-4 py-3 text-sm text-[#153E73]">
        此外觀色寫入<strong>商城版面草稿</strong>，不會立刻改訪客前台。請回{" "}
        <Link href={hubHref} className="font-semibold underline">
          商城 CMS
        </Link>{" "}
        按「發布上線」後才生效。草稿預覽：{" "}
        <Link href="/shop?preview=draft" className="font-semibold underline" target="_blank">
          /shop?preview=draft
        </Link>
      </p>
    );
  }

  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      此頁素材內容<strong>儲存即上線</strong>。區塊顯示／排序請回{" "}
      <Link href={hubHref} className="font-semibold underline">
        商城 CMS
      </Link>{" "}
      用草稿 → 發布控制。
    </p>
  );
}

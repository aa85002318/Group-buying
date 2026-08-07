import { permanentRedirect } from "next/navigation";

type Props = { params: Promise<{ voucherId: string }> };

/** 規格別名：/member/gifts/vouchers/[id] → benefits vouchers */
export default async function MemberGiftsVoucherAliasPage({ params }: Props) {
  const { voucherId } = await params;
  permanentRedirect(`/member/benefits/vouchers/${voucherId}`);
}

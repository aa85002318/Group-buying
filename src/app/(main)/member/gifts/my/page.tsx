import { permanentRedirect } from "next/navigation";

/** 規格別名：/member/gifts/my → /member/benefits/vouchers */
export default function MemberGiftsMyAliasPage() {
  permanentRedirect("/member/benefits/vouchers");
}

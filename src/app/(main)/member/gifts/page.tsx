import { permanentRedirect } from "next/navigation";

/** 規格別名：/member/gifts → /member/benefits */
export default function MemberGiftsAliasPage() {
  permanentRedirect("/member/benefits");
}

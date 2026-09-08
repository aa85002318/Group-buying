"use client";

import { DesktopMember } from "@/components/desktop/DesktopMember";
import { DesktopV2Gate } from "@/components/desktop/DesktopV2Gate";
import { MemberCenterClient } from "@/components/member/MemberCenterClient";

export function MemberPageClient() {
  return (
    <DesktopV2Gate mobile={<MemberCenterClient />} desktop={<DesktopMember />} />
  );
}

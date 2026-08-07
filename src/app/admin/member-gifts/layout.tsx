"use client";

import { MemberGiftsAdminNav } from "@/components/admin/member-gifts/MemberGiftsAdminNav";

export default function MemberGiftsAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <MemberGiftsAdminNav />
      {children}
    </div>
  );
}

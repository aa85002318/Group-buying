import { redirect } from "next/navigation";

export default async function LegacyMemberGiftDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/member-gifts/campaigns/${id}`);
}

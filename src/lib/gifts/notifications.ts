import type { SupabaseClient } from "@supabase/supabase-js";
import { createMemberNotification } from "@/lib/services/memberNotificationService";
import { sendEmail } from "@/lib/email/send";
import {
  buildGiftClaimEmail,
  buildGiftExpiringEmail,
  buildGiftRedeemedEmail,
} from "@/lib/email/templates/member-gift";

async function memberEmail(
  admin: SupabaseClient,
  memberId: string
): Promise<string | null> {
  const { data } = await admin
    .from("profiles")
    .select("email")
    .eq("id", memberId)
    .maybeSingle();
  const email = String(data?.email ?? "").trim();
  return email.includes("@") ? email : null;
}

export async function notifyGiftClaimed(
  admin: SupabaseClient,
  opts: {
    memberId: string;
    claimId: string;
    giftName: string;
    expiresAt?: string | null;
  }
) {
  const exp = opts.expiresAt
    ? new Date(opts.expiresAt).toLocaleDateString("zh-TW")
    : null;
  const linkUrl = `/member/benefits/vouchers/${opts.claimId}`;
  await createMemberNotification(admin, {
    userId: opts.memberId,
    notificationType: "benefit",
    title: "會員禮領取成功",
    message: exp
      ? `您已領取「${opts.giftName}」，請於 ${exp} 前至門市兌換。`
      : `您已領取「${opts.giftName}」，請至門市出示兌換條碼。`,
    linkUrl,
    referenceId: opts.claimId,
  });

  const to = await memberEmail(admin, opts.memberId);
  if (to) {
    const mail = buildGiftClaimEmail({
      giftName: opts.giftName,
      expiresLabel: exp,
      linkPath: linkUrl,
    });
    await sendEmail({
      to,
      subject: mail.subject,
      html: mail.html,
      tags: [{ name: "type", value: "member_gift_claim" }],
    });
  }
}

export async function notifyGiftExpiringSoon(
  admin: SupabaseClient,
  opts: {
    memberId: string;
    claimId: string;
    giftName: string;
    expiresAt: string;
  }
) {
  const exp = new Date(opts.expiresAt).toLocaleDateString("zh-TW");
  const linkUrl = `/member/benefits/vouchers/${opts.claimId}`;
  await createMemberNotification(admin, {
    userId: opts.memberId,
    notificationType: "benefit",
    title: "會員禮即將到期",
    message: `「${opts.giftName}」將於 ${exp} 到期，請盡快至門市兌換。`,
    linkUrl,
    referenceId: opts.claimId,
  });

  const to = await memberEmail(admin, opts.memberId);
  if (to) {
    const mail = buildGiftExpiringEmail({
      giftName: opts.giftName,
      expiresLabel: exp,
      linkPath: linkUrl,
    });
    await sendEmail({
      to,
      subject: mail.subject,
      html: mail.html,
      tags: [{ name: "type", value: "member_gift_expiring" }],
    });
  }
}

export async function notifyGiftRedeemed(
  admin: SupabaseClient,
  opts: {
    memberId: string;
    claimId: string;
    giftName: string;
    storeName?: string | null;
  }
) {
  const linkUrl = `/member/benefits/vouchers/${opts.claimId}`;
  await createMemberNotification(admin, {
    userId: opts.memberId,
    notificationType: "benefit",
    title: "會員禮已兌換",
    message: opts.storeName
      ? `「${opts.giftName}」已於 ${opts.storeName} 完成兌換。`
      : `「${opts.giftName}」已完成兌換。`,
    linkUrl,
    referenceId: opts.claimId,
  });

  const to = await memberEmail(admin, opts.memberId);
  if (to) {
    const mail = buildGiftRedeemedEmail({
      giftName: opts.giftName,
      storeName: opts.storeName,
      linkPath: linkUrl,
    });
    await sendEmail({
      to,
      subject: mail.subject,
      html: mail.html,
      tags: [{ name: "type", value: "member_gift_redeemed" }],
    });
  }
}

/** 核銷／沖銷後同步品項 reserved → redeemed */
export async function adjustGiftItemRedeemCounters(
  admin: SupabaseClient,
  opts: {
    giftItemId: string | null | undefined;
    quantity: number;
    mode: "redeem" | "reverse_restore" | "reverse_void";
    hadReservation: boolean;
  }
) {
  if (!opts.giftItemId) return;
  const qty = Math.max(1, Number(opts.quantity ?? 1));
  const { data: item } = await admin
    .from("gift_campaign_items")
    .select("id, reserved_quantity, redeemed_quantity, total_quantity")
    .eq("id", opts.giftItemId)
    .maybeSingle();
  if (!item) return;

  let reserved = Number(item.reserved_quantity ?? 0);
  let redeemed = Number(item.redeemed_quantity ?? 0);

  if (opts.mode === "redeem") {
    if (opts.hadReservation) reserved = Math.max(0, reserved - qty);
    redeemed = redeemed + qty;
  } else if (opts.mode === "reverse_restore") {
    redeemed = Math.max(0, redeemed - qty);
    if (opts.hadReservation) reserved = reserved + qty;
  } else {
    // reverse_void: drop redeemed, do not re-reserve
    redeemed = Math.max(0, redeemed - qty);
  }

  await admin
    .from("gift_campaign_items")
    .update({
      reserved_quantity: reserved,
      redeemed_quantity: redeemed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", item.id);
}

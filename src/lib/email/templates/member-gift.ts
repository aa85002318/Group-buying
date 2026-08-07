import { BRAND_NAME, getSiteUrl } from "@/lib/env";
import { emailButton, escapeHtml, wrapEmailHtml } from "@/lib/email/layout";

function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${getSiteUrl().replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildGiftClaimEmail(opts: {
  giftName: string;
  expiresLabel?: string | null;
  linkPath: string;
}): { subject: string; html: string } {
  const gift = escapeHtml(opts.giftName);
  const linkUrl = absoluteUrl(opts.linkPath);
  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#6B4423;">會員禮領取成功</h1>
    <p style="margin:0 0 16px;color:#666666;font-size:14px;">您已成功領取「${gift}」。</p>
    ${
      opts.expiresLabel
        ? `<p style="margin:0 0 16px;color:#666666;font-size:14px;">請於 <strong>${escapeHtml(opts.expiresLabel)}</strong> 前至門市兌換。</p>`
        : `<p style="margin:0 0 16px;color:#666666;font-size:14px;">請至門市出示兌換條碼完成兌換。</p>`
    }
    ${emailButton(linkUrl, "查看兌換券")}
  `;
  return {
    subject: `【${BRAND_NAME}】會員禮領取成功：${opts.giftName}`,
    html: wrapEmailHtml({
      title: "會員禮領取成功",
      preheader: `您已領取「${opts.giftName}」`,
      bodyHtml,
    }),
  };
}

export function buildGiftExpiringEmail(opts: {
  giftName: string;
  expiresLabel: string;
  linkPath: string;
}): { subject: string; html: string } {
  const gift = escapeHtml(opts.giftName);
  const linkUrl = absoluteUrl(opts.linkPath);
  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#6B4423;">會員禮即將到期</h1>
    <p style="margin:0 0 16px;color:#666666;font-size:14px;">
      「${gift}」將於 <strong>${escapeHtml(opts.expiresLabel)}</strong> 到期，請盡快至門市兌換。
    </p>
    ${emailButton(linkUrl, "立即查看")}
  `;
  return {
    subject: `【${BRAND_NAME}】會員禮即將到期：${opts.giftName}`,
    html: wrapEmailHtml({
      title: "會員禮即將到期",
      preheader: `「${opts.giftName}」即將到期`,
      bodyHtml,
    }),
  };
}

export function buildGiftRedeemedEmail(opts: {
  giftName: string;
  storeName?: string | null;
  linkPath: string;
}): { subject: string; html: string } {
  const gift = escapeHtml(opts.giftName);
  const linkUrl = absoluteUrl(opts.linkPath);
  const where = opts.storeName
    ? `已於「${escapeHtml(opts.storeName)}」`
    : "已";
  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#6B4423;">會員禮已兌換</h1>
    <p style="margin:0 0 16px;color:#666666;font-size:14px;">
      「${gift}」${where}完成兌換。
    </p>
    ${emailButton(linkUrl, "查看紀錄")}
  `;
  return {
    subject: `【${BRAND_NAME}】會員禮已兌換：${opts.giftName}`,
    html: wrapEmailHtml({
      title: "會員禮已兌換",
      preheader: `「${opts.giftName}」已完成兌換`,
      bodyHtml,
    }),
  };
}

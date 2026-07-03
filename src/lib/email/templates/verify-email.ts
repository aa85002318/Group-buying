import { BRAND_NAME } from "@/lib/env";
import { emailButton, wrapEmailHtml } from "@/lib/email/layout";

export interface VerifyEmailData {
  confirmationUrl: string;
  recipientEmail: string;
}

export function buildVerifyEmail(data: VerifyEmailData): { subject: string; html: string } {
  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-size:20px;color:#6B4423;">歡迎加入</h1>
    <p style="margin:0 0 8px;color:#666666;font-size:14px;">您好，</p>
    <p style="margin:0 0 24px;color:#666666;font-size:14px;">
      感謝您註冊 <strong>${BRAND_NAME}</strong>（${data.recipientEmail}）。
      請點擊下方按鈕完成 Email 驗證，驗證成功後即可登入購物與下單。
    </p>
    ${emailButton("驗證 Email", data.confirmationUrl)}
    <p style="font-size:13px;color:#888888;margin-top:24px;">若按鈕無法點擊，請複製以下連結至瀏覽器：</p>
    <p style="font-size:12px;word-break:break-all;color:#aaaaaa;">${data.confirmationUrl}</p>
  `;

  return {
    subject: `請驗證您的 ${BRAND_NAME} 帳號`,
    html: wrapEmailHtml({
      title: `驗證您的 ${BRAND_NAME} 帳號`,
      preheader: "請點擊連結完成 Email 驗證",
      bodyHtml,
    }),
  };
}

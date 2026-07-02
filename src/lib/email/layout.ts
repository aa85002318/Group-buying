import { BRAND_NAME, SUPPORT_EMAIL } from "@/lib/env";

export interface EmailLayoutOptions {
  title: string;
  preheader?: string;
  bodyHtml: string;
}

/** Shared responsive email shell (inline styles for mail clients). */
export function wrapEmailHtml({ title, preheader, bodyHtml }: EmailLayoutOptions): string {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  ${preheader ? `<span style="display:none;max-height:0;overflow:hidden;color:transparent;">${escapeHtml(preheader)}</span>` : ""}
</head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang TC','Microsoft JhengHei',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EB;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(107,68,35,0.08);">
          <tr>
            <td style="background:#6B4423;padding:28px 32px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">${escapeHtml(BRAND_NAME)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#333333;line-height:1.7;font-size:15px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #EEE5DC;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#888888;">© ${year} ${escapeHtml(BRAND_NAME)}</p>
              <p style="margin:0;font-size:12px;color:#888888;">如有問題請聯絡 <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color:#E85D4C;text-decoration:none;">${escapeHtml(SUPPORT_EMAIL)}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailButton(href: string, label: string): string {
  return `<p style="text-align:center;margin:28px 0;">
    <a href="${escapeHtml(href)}"
       style="display:inline-block;background:#E85D4C;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:600;font-size:15px;">
      ${escapeHtml(label)}
    </a>
  </p>`;
}

export function emailInfoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;color:#888888;font-size:14px;width:100px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;color:#333333;font-size:14px;font-weight:500;">${escapeHtml(value)}</td>
  </tr>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

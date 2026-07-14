import { loadEnvLocal } from "./load-env";

async function main() {
  loadEnvLocal();

  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const to = "aa85002318@diychimei.page";

  if (!key || !from) {
    console.error("Missing RESEND_API_KEY or EMAIL_FROM in .env.local");
    process.exit(1);
  }

  console.log("From:", from);
  console.log("To:", to);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "chimeidiy 團購 — 寄信測試",
      html: "<p>您好，</p><p>這是一封<strong>測試信</strong>，用來確認 Resend 寄件設定是否成功。</p><p>若您收到此信，表示寄件網域與 API Key 運作正常。</p><p>— chimeidiy 團購</p>",
    }),
  });

  const body = await res.text();
  console.log("HTTP", res.status);
  console.log(body);

  if (!res.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

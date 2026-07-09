import { loadEnvLocal } from "./load-env";

async function main() {
  loadEnvLocal();

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const emailFrom = process.env.EMAIL_FROM?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  console.log("=== Local env ===");
  console.log("RESEND_API_KEY:", apiKey ? `${apiKey.slice(0, 8)}...` : "(missing)");
  console.log("EMAIL_FROM:", emailFrom ?? "(missing)");
  console.log("SUPABASE_URL:", supabaseUrl ?? "(missing)");
  console.log("SERVICE_ROLE_KEY:", serviceKey ? "set" : "(missing)");

  if (!apiKey) {
    console.log("\nResult: RESEND_API_KEY missing — emails will not send.");
    return;
  }

  const domainRes = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const domainBody = (await domainRes.json()) as {
    data?: Array<{ name: string; status: string }>;
    message?: string;
  };

  console.log("\n=== Resend domains ===");
  console.log("HTTP", domainRes.status);
  if (!domainRes.ok) {
    console.log("Error:", domainBody.message ?? JSON.stringify(domainBody));
    return;
  }

  for (const domain of domainBody.data ?? []) {
    console.log(`- ${domain.name}: ${domain.status}`);
  }

  const fromDomain = emailFrom?.match(/<[^@]+@([^>]+)>/)?.[1] ?? emailFrom?.split("@")[1];
  if (fromDomain) {
    const match = domainBody.data?.find((d) => d.name === fromDomain);
    console.log(`\nEMAIL_FROM domain (${fromDomain}):`, match?.status ?? "NOT FOUND in Resend");
    if (match?.status !== "verified") {
      console.log("Result: Sender domain is not verified — Resend will reject sends.");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

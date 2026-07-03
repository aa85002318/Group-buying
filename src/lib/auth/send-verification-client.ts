/** Browser-side helper: send verification email to the registrant via Resend API. */
export async function requestVerificationEmail(
  email: string
): Promise<{ ok: boolean; message?: string; error?: string; skipped?: boolean }> {
  const res = await fetch("/api/auth/send-verification-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), origin: window.location.origin }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
    skipped?: boolean;
  };

  if (!res.ok) {
    return { ok: false, error: data.error ?? "寄送失敗", skipped: data.skipped };
  }

  return { ok: true, message: data.message };
}

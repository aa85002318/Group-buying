"use client";

import { useCallback, useEffect, useState } from "react";
import { requestVerificationEmail } from "@/lib/auth/send-verification-client";

export function useEmailVerification() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [resending, setResending] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    return fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) {
          setLoggedIn(false);
          setEmailVerified(null);
          setEmail("");
          return;
        }
        const data = await res.json();
        setLoggedIn(true);
        setEmailVerified(Boolean(data.email_verified));
        setEmail(data.user?.email ?? "");
      })
      .catch(() => {
        setLoggedIn(false);
        setEmailVerified(null);
        setEmail("");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function resendVerification(targetEmail?: string) {
    const to = (targetEmail ?? email).trim();
    if (!to) {
      throw new Error("請先登入或提供 Email");
    }
    setResending(true);
    try {
      const result = await requestVerificationEmail(to);
      if (!result.ok) throw new Error(result.error ?? "寄送失敗");
      return result.message ?? "驗證信已寄出";
    } finally {
      setResending(false);
    }
  }

  return {
    loading,
    loggedIn,
    email,
    emailVerified,
    resending,
    refresh,
    resendVerification,
    canPurchase: emailVerified === true,
  };
}

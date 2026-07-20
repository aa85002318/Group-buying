"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/config";

type WelcomeState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "member"; name: string };

export function HomeWelcome() {
  const [state, setState] = useState<WelcomeState>({ status: "loading" });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState({ status: "guest" });
      return;
    }

    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.profile) {
          const name = String(data.profile.full_name ?? "").trim() || "會員";
          setState({ status: "member", name });
        } else {
          setState({ status: "guest" });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "guest" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="text-left" aria-hidden>
        <div className="h-6 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (state.status === "member") {
    return (
      <div className="text-left">
        <h1 className="text-xl font-semibold tracking-tight text-caramel sm:text-[22px]">
          嗨，{state.name}
        </h1>
        <p className="mt-1 text-sm text-foreground-secondary">今天也一起做點好吃的吧</p>
      </div>
    );
  }

  return (
    <div className="text-left">
      <h1 className="text-xl font-semibold tracking-tight text-caramel sm:text-[22px]">
        今天想做點什麼？
      </h1>
      <p className="mt-1 text-sm text-foreground-secondary">
        找材料、看食譜，讓烘焙變得更簡單
      </p>
    </div>
  );
}

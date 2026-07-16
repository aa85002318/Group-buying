"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/config";
import { APP_ROUTES } from "@/lib/site-links";

const CONFIRM_PHRASE = "刪除帳號";

export default function ProfileDeletePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setEmail("demo@example.com");
      setRole("member");
      setLoading(false);
      return;
    }
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.profile) {
          router.replace(`${APP_ROUTES.login}?next=${encodeURIComponent(APP_ROUTES.profileDelete)}`);
          return;
        }
        setEmail(data.user?.email ?? data.profile.email ?? "");
        setRole(data.profile.role ?? null);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const isStaff = role === "admin" || role === "store_staff";
  const canSubmit = confirm.trim() === CONFIRM_PHRASE && !submitting && !isStaff;

  const handleDelete = async () => {
    if (!canSubmit) return;
    if (!window.confirm("確定要永久刪除帳號？此操作無法復原。")) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "刪除失敗，請稍後再試");
        return;
      }
      router.replace(`${APP_ROUTES.login}?deleted=1`);
    } catch {
      setError("連線失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">載入中…</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <Link href={APP_ROUTES.profile} className="text-sm text-primary hover:underline">
          ← 返回會員中心
        </Link>
        <h1 className="mt-2 text-xl font-bold text-coffee">刪除帳號</h1>
        <p className="mt-1 text-sm text-muted-foreground">目前帳號：{email || "—"}</p>
      </div>

      <div className="space-y-3 rounded-xl bg-white p-4 text-sm shadow-card">
        <p className="font-medium text-coffee">刪除後將立即生效，且無法復原：</p>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>無法再以此帳號登入</li>
          <li>姓名、Email、手機、生日等個人資料會被清除或匿名化</li>
          <li>LINE 綁定與購物車會一併清除</li>
          <li>訂單紀錄可能依法保留，但聯絡資訊會匿名化</li>
        </ul>
        <p className="text-muted-foreground">
          詳細說明請見{" "}
          <Link href="/account-deletion" className="text-primary hover:underline">
            刪除帳號說明
          </Link>
          。
        </p>
      </div>

      {isStaff ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          門市／管理帳號無法於前台自行刪除，請透過客服協助處理。
        </div>
      ) : (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
          <label className="block text-sm">
            請輸入「{CONFIRM_PHRASE}」以確認
            <Input
              className="mt-1"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              autoComplete="off"
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            variant="destructive"
            className="w-full"
            disabled={!canSubmit}
            onClick={handleDelete}
          >
            {submitting ? "處理中…" : "永久刪除我的帳號"}
          </Button>
        </div>
      )}
    </div>
  );
}

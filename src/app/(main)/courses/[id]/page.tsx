"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

type Course = {
  id: string;
  title: string;
  description: string | null;
  teacher_name: string;
  location: string | null;
  start_at: string | null;
  price: number;
  capacity: number;
  enrolled_count: number;
  seats_left: number;
  waitlist_enabled: boolean;
};

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ contact_name: "", contact_phone: "", contact_email: "" });

  useEffect(() => {
    fetch(`/api/courses/${params.id}`)
      .then((r) => r.json())
      .then((d) => setCourse(d.course ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  const enroll = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/courses/${params.id}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push(`/auth/login?next=/courses/${params.id}`);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "報名失敗");
      setMessage(data.message);
      setTicketCode(data.ticket?.ticket_code ?? null);
      setQrPayload(data.ticket?.qr_payload ?? null);
      if (data.enrollment && !data.enrollment.status?.includes("wait")) {
        setCourse((c) => (c ? { ...c, seats_left: Math.max(0, c.seats_left - 1), enrolled_count: c.enrolled_count + 1 } : c));
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "報名失敗");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Skeleton className="h-80 w-full rounded-[22px]" />;
  if (!course) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">找不到課程</p>
        <Link href="/courses" className="mt-3 inline-block text-primary">返回課程列表</Link>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-5 pb-8">
      <Link href="/courses" className="text-sm font-bold text-primary">← 課程中心</Link>
      <div className="card-surface space-y-3 p-5">
        <span className="sticker bg-[#3A86FF] text-white">剩餘 {course.seats_left} 名</span>
        <h1 className="text-xl font-black text-coffee">{course.title}</h1>
        <p className="text-sm text-muted-foreground">老師：{course.teacher_name}</p>
        {course.location && <p className="text-sm text-muted-foreground">地點：{course.location}</p>}
        {course.start_at && (
          <p className="text-sm text-muted-foreground">
            時間：{new Date(course.start_at).toLocaleString("zh-TW")}
          </p>
        )}
        <p className="text-2xl font-black text-primary">
          {course.price > 0 ? formatCurrency(course.price) : "免費／另洽"}
        </p>
        {course.description && <p className="text-sm leading-relaxed text-coffee">{course.description}</p>}
      </div>

      <section className="card-surface space-y-3 p-5">
        <h2 className="font-bold text-coffee">線上報名</h2>
        <Input className="min-h-12" placeholder="學員姓名" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
        <Input className="min-h-12" type="tel" placeholder="手機" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
        <Input className="min-h-12" type="email" placeholder="Email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
        <Button className="w-full" disabled={submitting} onClick={enroll}>
          {submitting ? "報名中…" : course.seats_left > 0 ? "立即報名" : "加入候補"}
        </Button>
        <p className="text-xs text-muted-foreground">
          線上付款將於後續版本完善；目前先建立報名與電子票券。額滿可進入候補名單。
        </p>
      </section>

      {message && (
        <div className="rounded-[20px] bg-green-50 p-5 text-sm text-green-900">
          <p>{message}</p>
          {ticketCode && (
            <div className="mt-4 rounded-2xl bg-white p-4 text-center shadow-card">
              <p className="text-xs text-muted-foreground">電子票券</p>
              <p className="mt-1 font-mono text-lg font-black tracking-wider text-coffee">{ticketCode}</p>
              {qrPayload && (
                <p className="mt-2 break-all text-[10px] text-muted-foreground">{qrPayload}</p>
              )}
              <p className="mt-2 text-xs">報到時出示此代碼／QR Payload</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

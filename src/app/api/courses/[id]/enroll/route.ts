import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildTicketPayload, generateTicketCode } from "@/lib/services/courseTicketService";
import { rateLimit } from "@/lib/security/rateLimit";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const ip = request.headers.get("x-forwarded-for") ?? auth!.profile.id;
  const rl = rateLimit(`course-enroll:${ip}`, 8, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "報名過於頻繁" }, { status: 429 });

  const { id: courseId } = await context.params;
  const body = await request.json();
  const contactName = body.contact_name?.trim() || auth!.profile.full_name || "學員";

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      enrollment: { id: `mock-enroll-${Date.now()}`, status: "pending", payment_status: "unpaid" },
      ticket: { ticket_code: "CMT-DEMO-0001", qr_payload: "demo" },
      message: "模擬報名成功（資料庫未連線）",
    });
  }

  const admin = createAdminClient();
  const { data: course, error: courseError } = await admin
    .from("baking_courses")
    .select("*")
    .eq("id", courseId)
    .eq("is_active", true)
    .single();

  if (courseError || !course) {
    return NextResponse.json({ error: "課程不存在或已下架" }, { status: 404 });
  }

  const seatsLeft = Number(course.capacity) - Number(course.enrolled_count);
  const waitlisted = seatsLeft <= 0;
  if (waitlisted && !course.waitlist_enabled) {
    return NextResponse.json({ error: "課程已額滿" }, { status: 409 });
  }

  const status = waitlisted ? "waitlisted" : course.price > 0 ? "pending" : "paid";
  const paymentStatus = waitlisted ? "unpaid" : course.price > 0 ? "unpaid" : "paid";

  const { data: enrollment, error: enrollError } = await admin
    .from("course_enrollments")
    .insert({
      course_id: courseId,
      user_id: auth!.profile.id,
      contact_name: contactName,
      contact_phone: body.contact_phone?.trim() || auth!.profile.phone || null,
      contact_email: body.contact_email?.trim() || auth!.user.email || null,
      status,
      payment_status: paymentStatus,
      amount: course.price,
      notes: body.notes?.trim() || null,
    })
    .select()
    .single();

  if (enrollError || !enrollment) {
    return NextResponse.json({ error: enrollError?.message ?? "報名失敗" }, { status: 500 });
  }

  let ticket = null;
  if (!waitlisted) {
    if (!waitlisted) {
      await admin
        .from("baking_courses")
        .update({ enrolled_count: Number(course.enrolled_count) + 1 })
        .eq("id", courseId);
    }
    const ticketCode = generateTicketCode();
    const qrPayload = buildTicketPayload(enrollment.id, ticketCode);
    const { data: ticketRow } = await admin
      .from("course_tickets")
      .insert({
        enrollment_id: enrollment.id,
        ticket_code: ticketCode,
        qr_payload: qrPayload,
      })
      .select()
      .single();
    ticket = ticketRow;
  }

  return NextResponse.json({
    enrollment,
    ticket,
    message: waitlisted
      ? "目前已額滿，您已加入候補名單，有名額時會通知您。"
      : course.price > 0
        ? "報名已建立，請完成付款後啟用電子票券。（線上付款串接將於後續完善）"
        : "報名成功！請保存電子票券 QR Code 供報到使用。",
  }, { status: 201 });
}

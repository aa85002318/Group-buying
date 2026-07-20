import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { MOCK_COURSES } from "@/lib/mock-courses";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      courses: MOCK_COURSES.map((c) => ({
        id: c.id,
        title: c.title,
        teacher_name: c.teacherName,
        teacher_image_url: c.teacherImage,
        cover_image_url: c.coverImage,
        start_at: null,
        date_label: c.dateLabel,
        seats_left: c.seatsLeft,
        capacity: c.seatsLeft + 4,
        enrolled_count: 4,
        price: 0,
        location: "棋美點心屋",
        description: null,
        href: c.href,
      })),
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("baking_courses")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .order("start_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const courses = (data ?? []).map((c) => ({
    ...c,
    seats_left: Math.max(0, Number(c.capacity) - Number(c.enrolled_count)),
    date_label: c.start_at
      ? new Date(c.start_at).toLocaleString("zh-TW", {
          month: "numeric",
          day: "numeric",
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "即將公告",
    href: `/courses/${c.id}`,
  }));

  return NextResponse.json({ courses });
}

"use client";

import { useEffect, useState } from "react";
import { CourseCard, type CourseCardData } from "@/components/courses/CourseCard";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

type ApiCourse = CourseCardData & {
  price?: number;
  seats_left?: number;
  teacher_name?: string;
  date_label?: string;
  cover_image_url?: string | null;
  teacher_image_url?: string | null;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.courses ?? []).map((c: ApiCourse) => ({
          id: c.id,
          title: c.title,
          teacherName: c.teacherName ?? c.teacher_name ?? "老師",
          teacherImage: c.teacherImage ?? c.teacher_image_url ?? null,
          dateLabel: c.dateLabel ?? c.date_label ?? "即將開課",
          seatsLeft: c.seatsLeft ?? c.seats_left ?? 0,
          coverImage: c.coverImage ?? c.cover_image_url ?? null,
          href: c.href?.startsWith("http") ? c.href : `/courses/${c.id}`,
        }));
        setCourses(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-enter space-y-5">
      <div>
        <h1 className="text-xl font-black text-coffee">課程中心</h1>
        <p className="mt-1 text-sm text-muted-foreground">線上報名 · 剩餘名額 · 電子票券報到</p>
      </div>

      <div className="rounded-[20px] bg-promo-strip p-4 text-sm text-coffee">
        報名後可取得電子票券 QR Code。線上付款金流將持續串接；目前可先完成報名／候補。
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-[20px]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      <Link href="/articles" className="block text-center text-sm font-bold text-primary">
        逛逛烘焙文章 →
      </Link>
    </div>
  );
}

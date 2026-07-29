"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { HomeSectionFrame } from "@/components/home/HomeSectionFrame";
import { HorizontalScroller } from "@/components/home/HorizontalScroller";
import { CourseCard, type CourseCardData } from "@/components/courses/CourseCard";
import { formatCurrency } from "@/lib/utils";

type ApiCourse = {
  id: string;
  title: string;
  teacher_name?: string;
  teacher_image_url?: string | null;
  cover_image_url?: string | null;
  date_label?: string;
  seats_left?: number;
  price?: number;
  href?: string;
};

function mapCourse(c: ApiCourse): CourseCardData & { priceLabel?: string } {
  return {
    id: c.id,
    title: c.title,
    teacherName: c.teacher_name || "講師",
    teacherImage: c.teacher_image_url ?? null,
    dateLabel: c.date_label || "即將公告",
    seatsLeft: Number(c.seats_left ?? 0),
    coverImage: c.cover_image_url ?? null,
    href: c.href || `/courses/${c.id}`,
    priceLabel:
      typeof c.price === "number" && c.price > 0 ? formatCurrency(c.price) : undefined,
  };
}

export function FeaturedCoursesSection({
  title = "最新課程",
  subtitle,
  viewAllHref = "/courses",
  limit = 4,
  manualIds = [],
}: {
  title?: string;
  subtitle?: string | null;
  viewAllHref?: string;
  limit?: number;
  manualIds?: string[];
}) {
  const [courses, setCourses] = useState<CourseCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const manualKey = manualIds.join(",");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/courses")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        let list = ((d.courses ?? []) as ApiCourse[]).map(mapCourse);
        if (manualIds.length > 0) {
          const byId = new Map(list.map((c) => [c.id, c]));
          list = manualIds.map((id) => byId.get(id)).filter(Boolean) as CourseCardData[];
        }
        setCourses(list.slice(0, limit));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "載入失敗");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [limit, manualKey, manualIds, tick]);

  return (
    <section className="space-y-3" aria-label={title}>
      <SectionHeader title={title} href={viewAllHref} className="!mb-0" />
      {subtitle ? <p className="text-xs text-foreground-secondary">{subtitle}</p> : null}
      <HomeSectionFrame
        loading={loading}
        error={error}
        onRetry={() => setTick((t) => t + 1)}
        empty={!loading && !error && courses.length === 0}
        emptyTitle="尚無課程"
        emptyText="新課程上架後會出現在這裡"
        emptyActionHref={viewAllHref}
        emptyActionLabel="看全部課程"
        skeletonCount={3}
      >
        <HorizontalScroller className="md:grid md:grid-cols-2 md:gap-4 md:overflow-visible xl:grid-cols-4">
          {courses.map((c) => (
            <div key={c.id} className="w-[240px] shrink-0 md:w-auto">
              <CourseCard course={c} />
            </div>
          ))}
        </HorizontalScroller>
      </HomeSectionFrame>
      {courses.length === 0 && !loading ? null : (
        <p className="text-center text-xs text-foreground-secondary md:hidden">
          <Link href={viewAllHref} className="font-medium text-primary">
            查看全部課程
          </Link>
        </p>
      )}
    </section>
  );
}

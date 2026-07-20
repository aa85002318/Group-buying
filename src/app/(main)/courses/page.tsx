import Link from "next/link";
import { CourseCard } from "@/components/courses/CourseCard";
import { MOCK_COURSES } from "@/lib/mock-courses";

export default function CoursesPage() {
  return (
    <div className="page-enter space-y-5">
      <div>
        <h1 className="text-xl font-black text-coffee">課程中心</h1>
        <p className="mt-1 text-sm text-muted-foreground">跟老師一起做烘焙，門市與線上報名</p>
      </div>

      <div className="rounded-[20px] bg-promo-strip p-4 text-sm text-coffee">
        課程報名目前導向官網{" "}
        <a
          href="https://www.chimeidiy.shop"
          target="_blank"
          rel="noreferrer"
          className="font-bold text-primary underline"
        >
          www.chimeidiy.shop
        </a>
        ，團購 App 內課程管理將於後續開放。
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_COURSES.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      <Link href="/articles" className="block text-center text-sm font-bold text-primary">
        逛逛烘焙文章 →
      </Link>
    </div>
  );
}

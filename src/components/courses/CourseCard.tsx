import Link from "next/link";
import Image from "next/image";

export type CourseCardData = {
  id: string;
  title: string;
  teacherName: string;
  teacherImage: string | null;
  dateLabel: string;
  seatsLeft: number;
  coverImage: string | null;
  href: string;
};

function CourseLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const external = href.startsWith("http");
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <article className="card-lift overflow-hidden">
      <CourseLink href={course.href} className="block">
        <div className="relative aspect-[16/10] bg-muted">
          {course.coverImage ? (
            <Image src={course.coverImage} alt={course.title} fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center bg-hero-gradient text-white">
              <span className="text-sm font-black">烘焙課程</span>
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-[#3A86FF] px-2.5 py-1 text-[10px] font-black text-white shadow-sticker">
            剩餘 {course.seatsLeft} 名
          </span>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <div className="relative h-9 w-9 overflow-hidden rounded-full bg-[#FFF0F4]">
              {course.teacherImage ? (
                <Image src={course.teacherImage} alt={course.teacherName} fill className="object-cover" unoptimized />
              ) : (
                <span className="flex h-full items-center justify-center text-xs font-bold text-primary">
                  {course.teacherName.slice(0, 1)}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">{course.teacherName}</p>
              <p className="text-[11px] text-muted-foreground">{course.dateLabel}</p>
            </div>
          </div>
          <h3 className="line-clamp-2 text-sm font-bold text-coffee">{course.title}</h3>
          <span className="btn-brand block w-full text-center">立即報名</span>
        </div>
      </CourseLink>
    </article>
  );
}

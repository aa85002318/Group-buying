import type { CourseCardData } from "@/components/courses/CourseCard";

/** UI mock courses — deep-link to official site until course API exists */
export const MOCK_COURSES: CourseCardData[] = [
  {
    id: "course-1",
    title: "胖姐烘焙教室｜一分鐘教你在家做",
    teacherName: "胖姐",
    teacherImage: null,
    dateLabel: "2026.09 開課",
    seatsLeft: 8,
    coverImage: null,
    href: "https://www.chimeidiy.shop/article_categories/group-o3VugiQ25s7tQxBasrRs7k",
  },
  {
    id: "course-2",
    title: "基礎麵包入門｜揉麵與發酵實作",
    teacherName: "棋美老師",
    teacherImage: null,
    dateLabel: "週六 14:00",
    seatsLeft: 5,
    coverImage: null,
    href: "https://www.chimeidiy.shop",
  },
  {
    id: "course-3",
    title: "蛋糕裝飾工作坊｜奶油霜擠花",
    teacherName: "棋美老師",
    teacherImage: null,
    dateLabel: "週日 10:00",
    seatsLeft: 3,
    coverImage: null,
    href: "https://www.chimeidiy.shop",
  },
];

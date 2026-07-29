import { redirect } from "next/navigation";

export default function AdminHomeFeaturedCoursesPage() {
  redirect("/admin/home?section=featured_courses");
}

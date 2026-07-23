"use client";

import { useParams } from "next/navigation";
import { AdminRecipeEditor } from "@/components/admin/recipes/AdminRecipeEditor";

export default function AdminRecipeEditPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  if (!id) return <p className="text-sm text-muted-foreground">無效的食譜 ID</p>;
  return <AdminRecipeEditor recipeId={id} />;
}

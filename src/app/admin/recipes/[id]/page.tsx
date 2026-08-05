"use client";

import { useParams } from "next/navigation";
import { AdminRecipeContentEditor } from "@/components/admin/recipes/AdminRecipeContentEditor";

export default function AdminRecipeEditPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  if (!id) return <p className="text-sm text-muted-foreground">無效的食譜 ID</p>;
  return <AdminRecipeContentEditor recipeId={id} />;
}

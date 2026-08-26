"use client";

import { RecipeEditor } from "@/components/admin/recipes/RecipeEditor";

/** Create recipe with simplified video / article editor. */
export default function AdminRecipeNewPage() {
  return <RecipeEditor mode="create" />;
}

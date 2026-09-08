"use client";

import { Suspense } from "react";
import { DesktopRecipes } from "@/components/desktop/DesktopRecipes";
import { DesktopV2Gate } from "@/components/desktop/DesktopV2Gate";
import { RecipesClient } from "@/components/recipes/RecipesClient";

export function RecipesPageClient() {
  return (
    <DesktopV2Gate
      mobile={
        <Suspense fallback={<p className="py-12 text-center text-muted-foreground">載入中...</p>}>
          <RecipesClient />
        </Suspense>
      }
      desktop={<DesktopRecipes />}
    />
  );
}

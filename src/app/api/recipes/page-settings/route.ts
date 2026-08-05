import { NextResponse } from "next/server";
import { getRecipePageSettings } from "@/lib/recipes/settings-store";
import {
  isRecipeHeroLive,
  resolveRecipeHeroHref,
} from "@/lib/recipes/page-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getRecipePageSettings();
  const hero = settings.hero;
  const live = isRecipeHeroLive(hero);

  return NextResponse.json({
    settings: {
      ...settings,
      hero: {
        ...hero,
        href: live ? resolveRecipeHeroHref(hero) : null,
        is_live: live,
      },
    },
  });
}

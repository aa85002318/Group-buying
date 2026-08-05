/**
 * Seed 5 flipbook smart recipes (idempotent via slug / seed_key).
 * Usage: npm run seed:flipbook-recipes
 */
import { loadEnvLocal } from "./load-env";
import { seedFlipbookRecipes } from "../src/lib/recipes/flipbook-seed";

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const site = process.env.NEXT_PUBLIC_SITE_URL || "";
const isProd =
  /shop\.chimeidiygroupbuying\.com/i.test(site) &&
  !/staging/i.test(url + site);
if (isProd && process.env.ALLOW_PROD_SEED !== "1") {
  console.error("Refusing production seed");
  process.exit(1);
}

async function main() {
  console.log("Seeding flipbook recipes…");
  const result = await seedFlipbookRecipes();
  console.log(
    JSON.stringify(
      {
        ok: true,
        count: result.recipes.length,
        recipes: result.recipes,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

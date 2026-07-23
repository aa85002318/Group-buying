/**
 * Seed CHIMEIDIY smart-recipe DEMO (idempotent via demo_key).
 * Usage: npm run seed:demo-recipe
 */
import { loadEnvLocal } from "./load-env";
import {
  seedDemoSmartRecipe,
  DEMO_KEY,
  DEMO_SLUG,
} from "../src/lib/demo/smart-recipe-demo";

loadEnvLocal();

async function main() {
  console.log(`Seeding demo smart recipe (${DEMO_KEY})…`);
  const result = await seedDemoSmartRecipe();
  console.log(
    JSON.stringify(
      {
        ok: true,
        recipeId: result.recipeId,
        slug: result.slug || DEMO_SLUG,
        demoKey: result.demoKey,
        createdDemoProducts: result.createdDemoProducts,
        counts: result.counts,
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

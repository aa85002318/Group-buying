/**
 * Remove CHIMEIDIY smart-recipe DEMO by demo_key only.
 * Usage: npm run seed:demo-recipe:remove
 */
import { loadEnvLocal } from "./load-env";
import { removeDemoSmartRecipe, DEMO_KEY } from "../src/lib/demo/smart-recipe-demo";

loadEnvLocal();

async function main() {
  console.log(`Removing demo smart recipe (${DEMO_KEY})…`);
  const result = await removeDemoSmartRecipe();
  console.log(
    JSON.stringify(
      {
        ok: true,
        deleted: result.deleted,
        recipeId: result.recipeId,
        demoKey: DEMO_KEY,
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

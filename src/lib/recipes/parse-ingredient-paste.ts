export type ParsedIngredientLine = {
  name: string;
  amount: string;
  unit: string;
};

const UNIT_PATTERN =
  /(g|kg|ml|l|cc|tsp|tbsp|杯|大匙|小匙|茶匙|湯匙|粒|顆|片|條|根|個|包|罐|匙|适量|適量)$/i;

/**
 * Parse batch-paste lines like:
 * 無鹽奶油 100g
 * 細砂糖 60 g
 * 全蛋液 50g
 */
export function parseIngredientPaste(text: string): ParsedIngredientLine[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseOneLine)
    .filter((row): row is ParsedIngredientLine => Boolean(row?.name));
}

function parseOneLine(line: string): ParsedIngredientLine | null {
  // "name 100g" | "name 100 g" | "name 100"
  const spaced = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z%\u4e00-\u9fff]+)?$/);
  if (spaced) {
    return {
      name: spaced[1].trim(),
      amount: spaced[2],
      unit: (spaced[3] ?? "").trim(),
    };
  }

  // "name100g"
  const glued = line.match(/^(.+?)(\d+(?:\.\d+)?)([a-zA-Z%\u4e00-\u9fff]+)$/);
  if (glued && UNIT_PATTERN.test(glued[3])) {
    return {
      name: glued[1].trim(),
      amount: glued[2],
      unit: glued[3].trim(),
    };
  }

  return { name: line, amount: "", unit: "" };
}

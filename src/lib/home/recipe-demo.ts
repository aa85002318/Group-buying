export type DemoRecipe = {
  id: string;
  title: string;
  description: string;
  time: string;
  difficulty: string;
  image: string;
};

/** Demo data — swap this array when API is ready. */
export const demoRecipes: DemoRecipe[] = [
  {
    id: "1",
    title: "草莓鮮奶油蛋糕",
    description: "鬆軟蛋糕體 × 新鮮草莓 × 清爽鮮奶油",
    time: "30 分鐘",
    difficulty: "初級",
    image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e",
  },
  {
    id: "2",
    title: "蒜香奶油餐包",
    description: "外酥內軟，每一口都有濃郁奶油香",
    time: "40 分鐘",
    difficulty: "中級",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff",
  },
  {
    id: "3",
    title: "經典布朗尼",
    description: "濃厚巧克力風味，外酥內濕潤",
    time: "50 分鐘",
    difficulty: "簡單",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c",
  },
];

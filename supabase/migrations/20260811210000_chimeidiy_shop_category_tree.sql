-- Copy CHIMEIDIY shop category tree into baking-materials:
-- 食材 + 烘焙器具 + 烘焙包裝 + 紙類包裝 + 裝飾品 (nav bar on chimeidiy.shop).
-- Idempotent by (catalog, parent, name).

CREATE OR REPLACE FUNCTION public.ensure_baking_category(
  p_root uuid,
  p_parent uuid,
  p_name text,
  p_slug text,
  p_sort int
) RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  cid uuid;
  final_slug text;
  n int := 0;
BEGIN
  SELECT id INTO cid
  FROM public.product_categories
  WHERE catalog_root_id = p_root
    AND name = p_name
    AND parent_id IS NOT DISTINCT FROM p_parent
  LIMIT 1;

  IF cid IS NOT NULL THEN
    RETURN cid;
  END IF;

  final_slug := p_slug;
  WHILE EXISTS (SELECT 1 FROM public.product_categories WHERE slug = final_slug) LOOP
    n := n + 1;
    final_slug := p_slug || '-' || n::text;
  END LOOP;

  INSERT INTO public.product_categories (
    catalog_root_id, parent_id, name, slug, sort_order, is_active
  ) VALUES (
    p_root, p_parent, p_name, final_slug, p_sort, true
  )
  RETURNING id INTO cid;

  RETURN cid;
END;
$$;

DO $$
DECLARE
  root_id uuid;
  ing_id uuid;
  flours_id uuid;
  additives_id uuid;
  seasonings_id uuid;
  fillings_id uuid;
  canned_id uuid;
  choco_id uuid;
  coloring_id uuid;
  tea_id uuid;
  dairy_id uuid;
  frozen_id uuid;
  grocery_id uuid;
  spices_id uuid;
  premix_id uuid;
  tools_id uuid;
  molds_id uuid;
  small_id uuid;
  pans_id uuid;
  pkg_id uuid;
  paper_id uuid;
  deco_id uuid;
BEGIN
  SELECT id INTO root_id FROM public.catalog_roots WHERE slug = 'baking-materials';
  IF root_id IS NULL THEN
    RAISE EXCEPTION 'catalog_roots.baking-materials not found';
  END IF;

  -- 0) 食材
  ing_id := public.ensure_baking_category(root_id, NULL, '食材', 'chimei-ingredients', 5);

  -- Reuse existing flat L1 rows that match shop mid-level names
  UPDATE public.product_categories
  SET parent_id = ing_id
  WHERE catalog_root_id = root_id
    AND parent_id IS NULL
    AND name IN ('乳製品', '巧克力', '預拌粉');

  flours_id := public.ensure_baking_category(root_id, ing_id, '烘焙用粉', 'ing-baking-flours', 10);
  PERFORM public.ensure_baking_category(root_id, flours_id, '高筋麵粉', 'ing-high-gluten-flour', 10);
  PERFORM public.ensure_baking_category(root_id, flours_id, '中筋麵粉', 'ing-medium-gluten-flour', 20);
  PERFORM public.ensure_baking_category(root_id, flours_id, '低筋麵粉', 'ing-low-gluten-flour', 30);
  PERFORM public.ensure_baking_category(root_id, flours_id, '全麥/黑麥/裸麥/法國麵粉', 'ing-wholegrain-flours', 40);
  PERFORM public.ensure_baking_category(root_id, flours_id, '無麩質麵粉', 'ing-gluten-free-flours', 50);
  PERFORM public.ensure_baking_category(root_id, flours_id, '其他粉類', 'ing-other-flours', 60);
  PERFORM public.ensure_baking_category(root_id, flours_id, '家用澱粉', 'ing-home-starches', 70);

  additives_id := public.ensure_baking_category(root_id, ing_id, '烘焙添加物', 'ing-additives', 20);
  PERFORM public.ensure_baking_category(root_id, additives_id, '泡打粉/小蘇打', 'ing-baking-powder', 10);
  PERFORM public.ensure_baking_category(root_id, additives_id, '塔塔粉', 'ing-cream-of-tartar', 20);
  PERFORM public.ensure_baking_category(root_id, additives_id, '檸檬酸', 'ing-citric-acid', 30);
  PERFORM public.ensure_baking_category(root_id, additives_id, '調味劑', 'ing-flavor-agents', 40);
  PERFORM public.ensure_baking_category(root_id, additives_id, '酵母粉', 'ing-yeast', 50);
  PERFORM public.ensure_baking_category(root_id, additives_id, '果膠/凝膠', 'ing-pectin-gel', 60);

  seasonings_id := public.ensure_baking_category(root_id, ing_id, '調味品', 'ing-seasonings', 30);
  PERFORM public.ensure_baking_category(root_id, seasonings_id, '糖', 'ing-sugars', 10);
  PERFORM public.ensure_baking_category(root_id, seasonings_id, '鹽', 'ing-salts', 20);
  PERFORM public.ensure_baking_category(root_id, seasonings_id, '茶粉', 'ing-tea-powders', 30);
  PERFORM public.ensure_baking_category(root_id, seasonings_id, '西餐調味', 'ing-western-seasonings', 40);
  PERFORM public.ensure_baking_category(root_id, seasonings_id, '蜂蜜/楓糖/糖漿', 'ing-honey-maple', 50);
  PERFORM public.ensure_baking_category(root_id, seasonings_id, '飲品糖漿', 'ing-drink-syrups', 60);
  PERFORM public.ensure_baking_category(root_id, seasonings_id, '烘焙糖漿', 'ing-baking-syrups', 70);
  PERFORM public.ensure_baking_category(root_id, seasonings_id, '料理酒/醋', 'ing-wine-vinegar', 80);
  PERFORM public.ensure_baking_category(root_id, seasonings_id, '番茄製品', 'ing-tomato-products', 90);
  PERFORM public.ensure_baking_category(root_id, seasonings_id, '調味醬', 'ing-sauces', 100);
  PERFORM public.ensure_baking_category(root_id, seasonings_id, '油脂', 'ing-fats-oils', 110);
  PERFORM public.ensure_baking_category(root_id, seasonings_id, '香草類', 'ing-vanillas', 120);
  PERFORM public.ensure_baking_category(root_id, seasonings_id, '天然蔬果製品', 'ing-fruit-veg-products', 130);

  fillings_id := public.ensure_baking_category(root_id, ing_id, '餡料/果醬', 'ing-fillings', 40);
  PERFORM public.ensure_baking_category(root_id, fillings_id, '內餡', 'ing-fillings-inner', 10);
  PERFORM public.ensure_baking_category(root_id, fillings_id, '果醬/抹醬', 'ing-jams', 20);
  PERFORM public.ensure_baking_category(root_id, fillings_id, '冷凍果泥/果粒', 'ing-frozen-puree', 30);

  canned_id := public.ensure_baking_category(root_id, ing_id, '罐頭/醃漬物', 'ing-canned', 50);
  PERFORM public.ensure_baking_category(root_id, canned_id, '蔬菜罐頭', 'ing-canned-veg', 10);
  PERFORM public.ensure_baking_category(root_id, canned_id, '水果罐頭', 'ing-canned-fruit', 20);
  PERFORM public.ensure_baking_category(root_id, canned_id, '栗子罐頭', 'ing-canned-chestnut', 30);
  PERFORM public.ensure_baking_category(root_id, canned_id, '番茄罐頭', 'ing-canned-tomato', 40);
  PERFORM public.ensure_baking_category(root_id, canned_id, '穀物/豆類罐頭', 'ing-canned-beans', 50);

  choco_id := public.ensure_baking_category(root_id, ing_id, '巧克力', 'ing-chocolate', 60);
  PERFORM public.ensure_baking_category(root_id, choco_id, '調溫巧克力', 'ing-tempering-chocolate', 10);
  PERFORM public.ensure_baking_category(root_id, choco_id, '非調溫巧克力', 'ing-compound-chocolate', 20);
  PERFORM public.ensure_baking_category(root_id, choco_id, '巧克力淋醬', 'ing-chocolate-sauce', 30);
  PERFORM public.ensure_baking_category(root_id, choco_id, '可可粉', 'ing-cocoa-powder', 40);

  coloring_id := public.ensure_baking_category(root_id, ing_id, '裝飾／調色', 'ing-coloring', 70);
  PERFORM public.ensure_baking_category(root_id, coloring_id, '裝飾用', 'ing-decorating', 10);
  PERFORM public.ensure_baking_category(root_id, coloring_id, '調色用', 'ing-colorants', 20);

  tea_id := public.ensure_baking_category(root_id, ing_id, '茶包／茶葉／花草釀', 'ing-tea', 80);
  PERFORM public.ensure_baking_category(root_id, tea_id, '茶包', 'ing-tea-bags', 10);
  PERFORM public.ensure_baking_category(root_id, tea_id, '茶葉', 'ing-tea-leaves', 20);
  PERFORM public.ensure_baking_category(root_id, tea_id, '花釀', 'ing-floral-brew', 30);

  dairy_id := public.ensure_baking_category(root_id, ing_id, '乳製品', 'ing-dairy', 90);
  PERFORM public.ensure_baking_category(root_id, dairy_id, '保久乳', 'ing-uht-milk', 10);
  PERFORM public.ensure_baking_category(root_id, dairy_id, '煉乳', 'ing-condensed-milk', 20);
  PERFORM public.ensure_baking_category(root_id, dairy_id, '奶水', 'ing-evaporated-milk', 30);
  PERFORM public.ensure_baking_category(root_id, dairy_id, '奶油 BUTTER', 'ing-butter', 40);
  PERFORM public.ensure_baking_category(root_id, dairy_id, 'cream cheese', 'ing-cream-cheese', 50);
  PERFORM public.ensure_baking_category(root_id, dairy_id, '鮮奶油', 'ing-whipping-cream', 60);
  PERFORM public.ensure_baking_category(root_id, dairy_id, '芝士片', 'ing-cheese-slices', 70);
  PERFORM public.ensure_baking_category(root_id, dairy_id, '乳酪絲', 'ing-shredded-cheese', 80);
  PERFORM public.ensure_baking_category(root_id, dairy_id, 'MASCARPONE', 'ing-mascarpone', 90);
  PERFORM public.ensure_baking_category(root_id, dairy_id, '其他乳製品', 'ing-other-dairy', 100);

  frozen_id := public.ensure_baking_category(root_id, ing_id, '冷凍品', 'ing-frozen', 100);
  PERFORM public.ensure_baking_category(root_id, frozen_id, '冷凍塔皮/派皮', 'ing-frozen-pastry', 10);
  PERFORM public.ensure_baking_category(root_id, frozen_id, '冷凍食品', 'ing-frozen-foods', 20);

  grocery_id := public.ensure_baking_category(root_id, ing_id, '南北雜貨', 'ing-grocery', 110);
  PERFORM public.ensure_baking_category(root_id, grocery_id, '堅果', 'ing-nuts', 10);
  PERFORM public.ensure_baking_category(root_id, grocery_id, '果乾', 'ing-dried-fruit', 20);
  PERFORM public.ensure_baking_category(root_id, grocery_id, '五穀雜糧', 'ing-grains', 30);
  PERFORM public.ensure_baking_category(root_id, grocery_id, '餅乾零食', 'ing-snacks', 40);
  PERFORM public.ensure_baking_category(root_id, grocery_id, '其他', 'ing-grocery-other', 50);

  spices_id := public.ensure_baking_category(root_id, ing_id, '中西式香料系列', 'ing-spices', 120);
  PERFORM public.ensure_baking_category(root_id, spices_id, '瓶', 'ing-spices-bottle', 10);
  PERFORM public.ensure_baking_category(root_id, spices_id, '罐', 'ing-spices-can', 20);
  PERFORM public.ensure_baking_category(root_id, spices_id, '盒', 'ing-spices-box', 30);
  PERFORM public.ensure_baking_category(root_id, spices_id, '香料包/湯包', 'ing-spice-packs', 40);
  PERFORM public.ensure_baking_category(root_id, spices_id, '袋裝', 'ing-spices-bag', 50);

  PERFORM public.ensure_baking_category(root_id, ing_id, '農產品專區', 'ing-produce', 130);

  premix_id := public.ensure_baking_category(root_id, ing_id, '預拌粉', 'ing-premix', 140);
  PERFORM public.ensure_baking_category(root_id, premix_id, '果凍粉', 'ing-jelly-powder', 10);
  PERFORM public.ensure_baking_category(root_id, premix_id, '鬆餅粉', 'ing-pancake-mix', 20);
  PERFORM public.ensure_baking_category(root_id, premix_id, '麵包粉', 'ing-bread-mix', 30);
  PERFORM public.ensure_baking_category(root_id, premix_id, '其他', 'ing-premix-other', 40);

  PERFORM public.ensure_baking_category(root_id, ing_id, '進口食品', 'ing-imported', 150);
  PERFORM public.ensure_baking_category(root_id, ing_id, '義大利麵／義大利米', 'ing-pasta-rice', 160);

  -- 1) 烘焙器具
  tools_id := public.ensure_baking_category(root_id, NULL, '烘焙器具', 'tools', 160);

  UPDATE public.product_categories
  SET parent_id = tools_id, sort_order = 10
  WHERE catalog_root_id = root_id
    AND parent_id IS NULL
    AND name = '烘焙模具';

  molds_id := public.ensure_baking_category(root_id, tools_id, '烘焙模具', 'tool-molds', 10);
  PERFORM public.ensure_baking_category(root_id, molds_id, '小蛋糕模具', 'tool-small-cake-molds', 10);
  PERFORM public.ensure_baking_category(root_id, molds_id, '派盤', 'tool-pie-pans', 20);
  PERFORM public.ensure_baking_category(root_id, molds_id, '水果條/磅蛋糕模具', 'tool-pound-cake-molds', 30);
  PERFORM public.ensure_baking_category(root_id, molds_id, '吐司模具', 'tool-loaf-pans', 40);
  PERFORM public.ensure_baking_category(root_id, molds_id, '麵包器具', 'tool-bread-tools', 50);
  PERFORM public.ensure_baking_category(root_id, molds_id, '餅乾模具', 'tool-cookie-cutters', 60);
  PERFORM public.ensure_baking_category(root_id, molds_id, '蛋糕模具', 'tool-cake-pans', 70);
  PERFORM public.ensure_baking_category(root_id, molds_id, '布丁模具/容器', 'tool-pudding-molds', 80);
  PERFORM public.ensure_baking_category(root_id, molds_id, '塔模/塔圈', 'tool-tart-rings', 90);
  PERFORM public.ensure_baking_category(root_id, molds_id, '烤盤布／矽膠模/墊', 'tool-silicone-mats', 100);
  PERFORM public.ensure_baking_category(root_id, molds_id, '發酵籐籃', 'tool-bannetons', 110);
  PERFORM public.ensure_baking_category(root_id, molds_id, '達克瓦茲模', 'tool-dacquoise-molds', 120);
  PERFORM public.ensure_baking_category(root_id, molds_id, '月餅/鳳梨酥模具', 'tool-mooncake-molds', 130);

  small_id := public.ensure_baking_category(root_id, tools_id, '小型器具', 'tool-small-tools', 20);
  PERFORM public.ensure_baking_category(root_id, small_id, '擠花袋/花嘴', 'tool-piping-tips', 10);
  PERFORM public.ensure_baking_category(root_id, small_id, '韓式擠花', 'tool-korean-piping', 20);
  PERFORM public.ensure_baking_category(root_id, small_id, '打蛋器', 'tool-whisks', 30);
  PERFORM public.ensure_baking_category(root_id, small_id, '刮刀/刮平刀', 'tool-spatulas', 40);
  PERFORM public.ensure_baking_category(root_id, small_id, '刮板', 'tool-dough-scrapers', 50);
  PERFORM public.ensure_baking_category(root_id, small_id, '麵包夾', 'tool-bread-tongs', 60);
  PERFORM public.ensure_baking_category(root_id, small_id, '打蛋盆', 'tool-mixing-bowls', 70);
  PERFORM public.ensure_baking_category(root_id, small_id, '溫度計/計時器', 'tool-thermometers', 80);
  PERFORM public.ensure_baking_category(root_id, small_id, '毛刷', 'tool-brushes', 90);
  PERFORM public.ensure_baking_category(root_id, small_id, '量杯/量匙', 'tool-measuring', 100);
  PERFORM public.ensure_baking_category(root_id, small_id, '粉篩', 'tool-sifters', 110);
  PERFORM public.ensure_baking_category(root_id, small_id, '桿麵棍', 'tool-rolling-pins', 120);
  PERFORM public.ensure_baking_category(root_id, small_id, '慕斯圈/圓形圈/切模', 'tool-mousse-rings', 130);
  PERFORM public.ensure_baking_category(root_id, small_id, '電子秤', 'tool-scales', 140);
  PERFORM public.ensure_baking_category(root_id, small_id, '咖啡器具', 'tool-coffee', 150);

  pans_id := public.ensure_baking_category(root_id, tools_id, '烤盤類', 'tool-sheet-pans', 30);
  PERFORM public.ensure_baking_category(root_id, pans_id, '烤盤', 'tool-baking-sheets', 10);
  PERFORM public.ensure_baking_category(root_id, pans_id, '蛋糕連模', 'tool-linked-cake-pans', 20);
  PERFORM public.ensure_baking_category(root_id, pans_id, '平網盤', 'tool-cooling-racks', 30);

  PERFORM public.ensure_baking_category(root_id, tools_id, '刀具', 'tool-knives', 40);
  PERFORM public.ensure_baking_category(root_id, tools_id, '特殊器具', 'tool-specialty', 50);
  PERFORM public.ensure_baking_category(root_id, tools_id, '廚房用具', 'tool-kitchenware', 60);
  PERFORM public.ensure_baking_category(root_id, tools_id, '其他器具', 'tool-other', 70);

  -- 2) 烘焙包裝
  pkg_id := public.ensure_baking_category(root_id, NULL, '烘焙包裝', 'chimei-baking-packaging', 210);
  PERFORM public.ensure_baking_category(root_id, pkg_id, '蛋糕盒/派盒', 'bpkg-cake-boxes', 10);
  PERFORM public.ensure_baking_category(root_id, pkg_id, '禮盒', 'bpkg-gift-boxes', 20);
  PERFORM public.ensure_baking_category(root_id, pkg_id, '塑膠杯子類', 'bpkg-plastic-cups', 30);
  PERFORM public.ensure_baking_category(root_id, pkg_id, '麵包袋', 'bpkg-bread-bags', 40);
  PERFORM public.ensure_baking_category(root_id, pkg_id, '吐司袋', 'bpkg-toast-bags', 50);
  PERFORM public.ensure_baking_category(root_id, pkg_id, '餅乾袋', 'bpkg-cookie-bags', 60);
  PERFORM public.ensure_baking_category(root_id, pkg_id, '西點袋/點心袋', 'bpkg-pastry-bags', 70);
  PERFORM public.ensure_baking_category(root_id, pkg_id, '糖果袋', 'bpkg-candy-bags', 80);
  PERFORM public.ensure_baking_category(root_id, pkg_id, '餐盒', 'bpkg-meal-boxes', 90);
  PERFORM public.ensure_baking_category(root_id, pkg_id, '塑膠盒', 'bpkg-plastic-boxes', 100);
  PERFORM public.ensure_baking_category(root_id, pkg_id, '玻璃', 'bpkg-glass', 110);
  PERFORM public.ensure_baking_category(root_id, pkg_id, '鋁箔盒', 'bpkg-foil-pans', 120);
  PERFORM public.ensure_baking_category(root_id, pkg_id, '其他', 'bpkg-other', 130);

  -- 3) 紙類包裝
  paper_id := public.ensure_baking_category(root_id, NULL, '紙類包裝', 'chimei-paper-packaging', 220);
  PERFORM public.ensure_baking_category(root_id, paper_id, '油力士/烘烤杯/防油紙杯', 'ppkg-oilproof-cups', 10);
  PERFORM public.ensure_baking_category(root_id, paper_id, '圍邊紙/蛋糕底襯', 'ppkg-cake-boards', 20);
  PERFORM public.ensure_baking_category(root_id, paper_id, '饅頭紙/蒸籠紙/氣炸鍋紙', 'ppkg-steamer-paper', 30);
  PERFORM public.ensure_baking_category(root_id, paper_id, '包裝紙/袋', 'ppkg-wrap-bags', 40);
  PERFORM public.ensure_baking_category(root_id, paper_id, '烘焙紙/白報紙', 'ppkg-baking-paper', 50);
  PERFORM public.ensure_baking_category(root_id, paper_id, '吸油紙', 'ppkg-oil-paper', 60);

  -- 4) 裝飾品
  deco_id := public.ensure_baking_category(root_id, NULL, '裝飾品', 'chimei-ornaments', 230);
  PERFORM public.ensure_baking_category(root_id, deco_id, '蛋糕盤叉組', 'deco-fork-sets', 10);
  PERFORM public.ensure_baking_category(root_id, deco_id, '蛋糕插牌', 'deco-cake-toppers', 20);
  PERFORM public.ensure_baking_category(root_id, deco_id, '蠟燭', 'deco-candles', 30);
  PERFORM public.ensure_baking_category(root_id, deco_id, '盤叉配件', 'deco-cutlery-accessories', 40);
  PERFORM public.ensure_baking_category(root_id, deco_id, '包裝束口', 'deco-ties', 50);
END $$;

DROP FUNCTION public.ensure_baking_category(uuid, uuid, text, text, int);

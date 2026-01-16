-- ===========================================
-- 006: Menu Seed Data
-- Idempotent: Uses ON CONFLICT DO UPDATE for re-runs
-- Source: data/menul.seed.yaml
-- ===========================================

-- ===========================================
-- 1. MENU CATEGORIES
-- ===========================================
INSERT INTO menu_categories (slug, name, sort_order, is_active) VALUES
  ('all-day-breakfast', 'All-Day Breakfast', 10, true),
  ('rice-noodles-soups', 'Rice / Noodles / Soups', 20, true),
  ('sides', 'Sides', 30, true),
  ('curries-a-la-carte', 'Curries (A la Carte)', 40, true),
  ('vegetables', 'Vegetables', 50, true),
  ('seafood-curries', 'Seafood Curries', 60, true),
  ('appetizers-salads', 'Appetizers / Salads', 70, true),
  ('drinks', 'Drinks', 80, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- ===========================================
-- 2. MODIFIER GROUPS
-- ===========================================
INSERT INTO modifier_groups (slug, name, selection_type, min_select, max_select) VALUES
  ('kyay_o_style', 'Style', 'single', 1, 1),
  ('kyay_o_protein', 'Protein Option', 'single', 1, 1),
  ('kyay_o_addons', 'Add-ons', 'multiple', 0, 5),
  ('goat_curry_cut', 'Goat Choice', 'single', 1, 1),
  ('beef_curry_style', 'Beef Curry Style', 'single', 1, 1),
  ('chicken_curry_style', 'Chicken Curry Style', 'single', 1, 1),
  ('tom_yum_base', 'Choose Base', 'single', 1, 1)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  selection_type = EXCLUDED.selection_type,
  min_select = EXCLUDED.min_select,
  max_select = EXCLUDED.max_select;

-- ===========================================
-- 3. MODIFIER OPTIONS
-- ===========================================

-- kyay_o_style options
INSERT INTO modifier_options (slug, group_id, name, price_delta_cents, sort_order, is_active) VALUES
  ('soup', (SELECT id FROM modifier_groups WHERE slug = 'kyay_o_style'), 'Kyay-O (Soup)', 0, 1, true),
  ('si_chat', (SELECT id FROM modifier_groups WHERE slug = 'kyay_o_style'), 'Si-Chat (Dry)', 0, 2, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_delta_cents = EXCLUDED.price_delta_cents,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- kyay_o_protein options
INSERT INTO modifier_options (slug, group_id, name, price_delta_cents, sort_order, is_active) VALUES
  ('pork_default', (SELECT id FROM modifier_groups WHERE slug = 'kyay_o_protein'), 'Pork (default)', 0, 1, true),
  ('chicken_plus_egg', (SELECT id FROM modifier_groups WHERE slug = 'kyay_o_protein'), 'Chicken + egg', 0, 2, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_delta_cents = EXCLUDED.price_delta_cents,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- kyay_o_addons options
INSERT INTO modifier_options (slug, group_id, name, price_delta_cents, sort_order, is_active) VALUES
  ('brains', (SELECT id FROM modifier_groups WHERE slug = 'kyay_o_addons'), 'Brains add-on', 200, 1, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_delta_cents = EXCLUDED.price_delta_cents,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- goat_curry_cut options
INSERT INTO modifier_options (slug, group_id, name, price_delta_cents, sort_order, is_active) VALUES
  ('goat_original', (SELECT id FROM modifier_groups WHERE slug = 'goat_curry_cut'), 'Original', 0, 1, true),
  ('goat_offal', (SELECT id FROM modifier_groups WHERE slug = 'goat_curry_cut'), 'Offal', 0, 2, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_delta_cents = EXCLUDED.price_delta_cents,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- beef_curry_style options
INSERT INTO modifier_options (slug, group_id, name, price_delta_cents, sort_order, is_active) VALUES
  ('beef_spiced', (SELECT id FROM modifier_groups WHERE slug = 'beef_curry_style'), 'Spiced', 0, 1, true),
  ('beef_non_spicy_braised', (SELECT id FROM modifier_groups WHERE slug = 'beef_curry_style'), 'Non-spicy braised', 0, 2, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_delta_cents = EXCLUDED.price_delta_cents,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- chicken_curry_style options
INSERT INTO modifier_options (slug, group_id, name, price_delta_cents, sort_order, is_active) VALUES
  ('chicken_original', (SELECT id FROM modifier_groups WHERE slug = 'chicken_curry_style'), 'Original', 0, 1, true),
  ('chicken_masala', (SELECT id FROM modifier_groups WHERE slug = 'chicken_curry_style'), 'Masala', 0, 2, true),
  ('chicken_coconut', (SELECT id FROM modifier_groups WHERE slug = 'chicken_curry_style'), 'Coconut', 0, 3, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_delta_cents = EXCLUDED.price_delta_cents,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- tom_yum_base options
INSERT INTO modifier_options (slug, group_id, name, price_delta_cents, sort_order, is_active) VALUES
  ('fried_rice', (SELECT id FROM modifier_groups WHERE slug = 'tom_yum_base'), 'Fried Rice', 0, 1, true),
  ('fried_noodles', (SELECT id FROM modifier_groups WHERE slug = 'tom_yum_base'), 'Fried Noodles', 0, 2, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_delta_cents = EXCLUDED.price_delta_cents,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- ===========================================
-- 4. MENU ITEMS
-- ===========================================

-- All-Day Breakfast
INSERT INTO menu_items (slug, category_id, name_en, name_my, description_en, base_price_cents, is_active, is_sold_out, allergens, tags) VALUES
  ('kyay-o', (SELECT id FROM menu_categories WHERE slug = 'all-day-breakfast'),
   'Kyay-O / Si-Chat', 'ကြေးအိုး/ဆီချက်',
   'Rice vermicelli noodle soup (or dry) with pork, meatballs, intestines, eggs, bok choy. Chicken + egg option available.',
   1800, true, false, ARRAY['egg'], ARRAY['contains_egg', 'contains_gluten_wheat_optional']),

  ('nan-gyi-mont-ti', (SELECT id FROM menu_categories WHERE slug = 'all-day-breakfast'),
   'Nan-Gyi Mont Ti', 'နန်းကြီးမုန့်တီ',
   'Rice noodles with fish cake, garnishes, and crunch tossed in Mandalay chicken curry sauce.',
   1300, true, false, ARRAY[]::TEXT[], ARRAY['popular']),

  ('mee-shay', (SELECT id FROM menu_categories WHERE slug = 'all-day-breakfast'),
   'Mee-Shay', 'မြှီးရှည်',
   'Mandalay specialty rice noodles in sweet soybean sauce with pork, crunchy rind, pickled mustard.',
   1400, true, false, ARRAY['soy'], ARRAY['contains_soy']),

  ('ohno-khao-swe', (SELECT id FROM menu_categories WHERE slug = 'all-day-breakfast'),
   'Ohno Khao-Swe', 'အုန်းနို့ခေါက်ဆွဲ',
   'Coconut cream + chickpea curry broth with wheat noodles, chicken drum, egg, garnishes.',
   1500, true, false, ARRAY['egg', 'gluten_wheat'], ARRAY['contains_egg', 'contains_gluten_wheat']),

  ('shan-noodles', (SELECT id FROM menu_categories WHERE slug = 'all-day-breakfast'),
   'Shan Noodles', 'ရှမ်းခေါက်ဆွဲ',
   'Rice noodles with savory tomato-based sauce (pork) + peanuts, fried garlic, pickled mustard, chili paste.',
   1300, true, false, ARRAY['peanuts'], ARRAY['contains_peanuts']),

  ('mohinga', (SELECT id FROM menu_categories WHERE slug = 'all-day-breakfast'),
   'Mohinga', 'မုန့်ဟင်းခါး',
   'Traditional fish broth soup with rice noodles, garnishes, bean fritters, egg slices.',
   1400, true, false, ARRAY['fish', 'egg'], ARRAY['contains_fish', 'contains_egg'])
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name_en = EXCLUDED.name_en,
  name_my = EXCLUDED.name_my,
  description_en = EXCLUDED.description_en,
  base_price_cents = EXCLUDED.base_price_cents,
  is_active = EXCLUDED.is_active,
  is_sold_out = EXCLUDED.is_sold_out,
  allergens = EXCLUDED.allergens,
  tags = EXCLUDED.tags;

-- Rice / Noodles / Soups
INSERT INTO menu_items (slug, category_id, name_en, name_my, description_en, base_price_cents, is_active, is_sold_out, allergens, tags) VALUES
  ('burmese-fried-rice', (SELECT id FROM menu_categories WHERE slug = 'rice-noodles-soups'),
   'Burmese Fried Rice', 'ပဲပြုတ်ထမင်းကြော်',
   'Stir-fried rice with eggs, onion, garlic, and boiled yellow peas.',
   1900, true, false, ARRAY['egg'], ARRAY['contains_egg']),

  ('goat-marrow-soup', (SELECT id FROM menu_categories WHERE slug = 'rice-noodles-soups'),
   'Goat-Marrow Soup', 'ဆိတ်ရိုးစွပ်ပြုတ်',
   'Goat stew + bone marrow infused soup with chickpeas and potatoes. Best paired with Parata.',
   1200, true, false, ARRAY[]::TEXT[], ARRAY[]::TEXT[]),

  ('coconut-chicken-and-rice', (SELECT id FROM menu_categories WHERE slug = 'rice-noodles-soups'),
   'Coconut Chicken & Rice', 'ကြက်အုန်းထမင်း',
   'Coconut rice with balachaung + Burmese chicken curry cooked in coconut oil.',
   1400, true, false, ARRAY['shellfish'], ARRAY['contains_shellfish_optional']),

  ('ngapi-rice-salad', (SELECT id FROM menu_categories WHERE slug = 'rice-noodles-soups'),
   'Ngapi-Rice Salad', 'ငပိထမင်း',
   'Rice tossed in fermented fish paste curry (Nga-Pi), served with sunny-side-up egg.',
   1300, true, false, ARRAY['fish', 'egg'], ARRAY['contains_fish', 'contains_egg']),

  ('rice-with-pickled-tea-salad', (SELECT id FROM menu_categories WHERE slug = 'rice-noodles-soups'),
   'Rice with Pickled Tea Salad', 'လက်ဖက်ထမင်း',
   'Rice tossed in pickled tea salad + garnishes, served with sunny-side-up egg.',
   1300, true, false, ARRAY['egg'], ARRAY['contains_egg']),

  ('tom-yum-fried-rice-or-noodles', (SELECT id FROM menu_categories WHERE slug = 'rice-noodles-soups'),
   'Tom-Yum Fried Rice / Noodles', 'တုန်ရန်းထမင်းကြော်/ခေါက်ဆွဲကြော်',
   'Stir-fry with shrimp + vegetables + tom yum aromatics (lemongrass/galangal/kaffir lime).',
   1600, true, false, ARRAY['shellfish'], ARRAY['contains_shellfish'])
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name_en = EXCLUDED.name_en,
  name_my = EXCLUDED.name_my,
  description_en = EXCLUDED.description_en,
  base_price_cents = EXCLUDED.base_price_cents,
  is_active = EXCLUDED.is_active,
  is_sold_out = EXCLUDED.is_sold_out,
  allergens = EXCLUDED.allergens,
  tags = EXCLUDED.tags;

-- Sides
INSERT INTO menu_items (slug, category_id, name_en, name_my, description_en, base_price_cents, is_active, is_sold_out, allergens, tags) VALUES
  ('parata', (SELECT id FROM menu_categories WHERE slug = 'sides'),
   'Parata (2 pcs)', 'ပလာတာ',
   'Two pieces. Great with goat marrow soup/curries.',
   500, true, false, ARRAY['gluten_wheat'], ARRAY['contains_gluten_wheat']),

  ('coconut-rice', (SELECT id FROM menu_categories WHERE slug = 'sides'),
   'Coconut Rice', 'အုန်းထမင်း',
   'Coconut-cream cooked rice.',
   300, true, false, ARRAY[]::TEXT[], ARRAY[]::TEXT[]),

  ('rice', (SELECT id FROM menu_categories WHERE slug = 'sides'),
   'Rice', 'ထမင်းဖြူ',
   'Steamed plain white rice.',
   200, true, false, ARRAY[]::TEXT[], ARRAY[]::TEXT[]),

  ('balachaung', (SELECT id FROM menu_categories WHERE slug = 'sides'),
   'Balachaung', 'ဘာလချောင်ကြော်',
   'Shrimp condiment with fried onions, shrimp, garlic, ginger & red chilies.',
   300, true, false, ARRAY['shellfish'], ARRAY['contains_shellfish'])
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name_en = EXCLUDED.name_en,
  name_my = EXCLUDED.name_my,
  description_en = EXCLUDED.description_en,
  base_price_cents = EXCLUDED.base_price_cents,
  is_active = EXCLUDED.is_active,
  is_sold_out = EXCLUDED.is_sold_out,
  allergens = EXCLUDED.allergens,
  tags = EXCLUDED.tags;

-- Curries (A la Carte)
INSERT INTO menu_items (slug, category_id, name_en, name_my, description_en, base_price_cents, is_active, is_sold_out, allergens, tags) VALUES
  ('goat-curry', (SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'),
   'Goat Curry [Original/Offal]', 'ဆိတ်သားဟင်း/ဆိတ်ကလီစာ',
   'Braised goat in Burmese-Indian masala curry (choice of meat or offal).',
   3000, true, false, ARRAY[]::TEXT[], ARRAY['spicy_optional']),

  ('beef-curry', (SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'),
   'Beef Curry', 'အမဲသားဟင်း/အမဲကြော်နှပ်',
   'Slow-cooked Burmese-Indian beef curry; non-spicy braised option available.',
   1900, true, false, ARRAY['soy'], ARRAY[]::TEXT[]),

  ('beef-pounded-deep-fried', (SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'),
   'Beef Pounded Deep Fried', 'အမဲထောင်းကြော်',
   'Pulled braised beef cooked in spicy chili oil.',
   1900, true, false, ARRAY[]::TEXT[], ARRAY['spicy']),

  ('chicken-curry', (SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'),
   'Chicken Curry (Original / Masala / Coconut)', 'ကြက်သားဟင်း',
   'Farm-raised chicken curry; masala spicy or sweet coconut option available.',
   1400, true, false, ARRAY['soy'], ARRAY[]::TEXT[]),

  ('chicken-giblets-curry', (SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'),
   'Chicken Giblets Curry', 'ကြက်အသဲမြစ်',
   'Chicken gizzards and liver in traditional Burmese curry.',
   1400, true, false, ARRAY[]::TEXT[], ARRAY[]::TEXT[]),

  ('pork-curry', (SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'),
   'Pork Curry', 'ဝက်သနီ',
   'Classic pork curry in sweet, mildly spiced sauce.',
   1400, true, false, ARRAY['soy'], ARRAY[]::TEXT[]),

  ('pork-horsegram-bean-curry', (SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'),
   'Pork Horsegram Bean Curry', 'ဝက်ပုန်းရည်ကြီး',
   'Pork curry with horse gram beans; mildly spiced, earthy/nutty.',
   1400, true, false, ARRAY['soy'], ARRAY[]::TEXT[]),

  ('pork-skewers', (SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'),
   'Pork Skewers', 'ဝက်သားဒုတ်ထိုး',
   'Slow-cooked pork + intestines + liver in herbal spices; served with dipping sauce.',
   1500, true, false, ARRAY[]::TEXT[], ARRAY[]::TEXT[]),

  ('bamboo-shoot-with-pork-soup', (SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'),
   'Bamboo Shoot with Pork Soup', 'ဝက်မျှစ်ချဥ်',
   'Pork in mildly spiced tamarind broth infused with bamboo shoots.',
   1400, true, false, ARRAY['fish'], ARRAY[]::TEXT[]),

  ('pork-offals-curry', (SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'),
   'Pork Offals Curry', 'ဝက်ကလီစာ',
   'Pork offal + intestines + liver in mildly spiced sauce.',
   1400, true, false, ARRAY['soy'], ARRAY[]::TEXT[]),

  ('duck-egg-curry', (SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'),
   'Duck Egg', 'ဘဲဥဟင်း',
   'Boiled duck eggs cooked in tomato-based curry.',
   1400, true, false, ARRAY['egg'], ARRAY['contains_egg'])
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name_en = EXCLUDED.name_en,
  name_my = EXCLUDED.name_my,
  description_en = EXCLUDED.description_en,
  base_price_cents = EXCLUDED.base_price_cents,
  is_active = EXCLUDED.is_active,
  is_sold_out = EXCLUDED.is_sold_out,
  allergens = EXCLUDED.allergens,
  tags = EXCLUDED.tags;

-- Vegetables
INSERT INTO menu_items (slug, category_id, name_en, name_my, description_en, base_price_cents, is_active, is_sold_out, allergens, tags) VALUES
  ('roselle-with-shrimp-curry', (SELECT id FROM menu_categories WHERE slug = 'vegetables'),
   'Roselle with Shrimp Curry', 'ချဥ်ပေါင်ကြော်',
   'Roselle sour leaf curry with shrimp.',
   1400, true, false, ARRAY['shellfish'], ARRAY['contains_shellfish']),

  ('acacia-with-shrimp-curry', (SELECT id FROM menu_categories WHERE slug = 'vegetables'),
   'Acacia with Shrimp Curry', 'ကင်ပွန်းချဥ်ကြော်',
   'Acacia sour leaf curry with shrimp.',
   1400, true, false, ARRAY['shellfish'], ARRAY['contains_shellfish']),

  ('bamboo-shoot-mushroom-soup', (SELECT id FROM menu_categories WHERE slug = 'vegetables'),
   'Bamboo Shoot Mushroom Soup', 'မျှစ်တောချက်',
   'Young bamboo shoots cooked with mushrooms in savory soup.',
   1400, true, false, ARRAY[]::TEXT[], ARRAY['vegetarian']),

  ('mixed-veggie-soup', (SELECT id FROM menu_categories WHERE slug = 'vegetables'),
   'Mixed Veggie Soup', 'သီးစုံပဲကုလားဟင်း',
   'Burmese Indian-style assorted vegetables in savory, mildly spicy soup.',
   1400, true, false, ARRAY[]::TEXT[], ARRAY['vegetarian', 'spicy_optional'])
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name_en = EXCLUDED.name_en,
  name_my = EXCLUDED.name_my,
  description_en = EXCLUDED.description_en,
  base_price_cents = EXCLUDED.base_price_cents,
  is_active = EXCLUDED.is_active,
  is_sold_out = EXCLUDED.is_sold_out,
  allergens = EXCLUDED.allergens,
  tags = EXCLUDED.tags;

-- Seafood Curries
INSERT INTO menu_items (slug, category_id, name_en, name_my, description_en, base_price_cents, is_active, is_sold_out, allergens, tags) VALUES
  ('crab-masala-curry', (SELECT id FROM menu_categories WHERE slug = 'seafood-curries'),
   'Crab Masala Curry', 'ဂဏန်းမဆလာ',
   'Whole Dungeness crab simmered in masala chili curry with tamarind.',
   3000, true, false, ARRAY['shellfish'], ARRAY['spicy_optional']),

  ('swai-fish-curry', (SELECT id FROM menu_categories WHERE slug = 'seafood-curries'),
   'Swai Fish Curry', 'ငါးမြင်းဟင်း',
   'Swai fish in mildly spiced sauce.',
   1900, true, false, ARRAY['fish'], ARRAY[]::TEXT[]),

  ('hilsa-fish', (SELECT id FROM menu_categories WHERE slug = 'seafood-curries'),
   'Hilsa Fish', 'ငါးသလောက်ပေါင်း',
   'Hilsa fish in tomato-based curry.',
   2400, true, false, ARRAY['fish'], ARRAY[]::TEXT[]),

  ('river-prawns-curry', (SELECT id FROM menu_categories WHERE slug = 'seafood-curries'),
   'River Prawns Curry', 'ပုဇွန်ထုပ်ဟင်း',
   'Whole river prawns curry with aromatics + prawn oil.',
   2400, true, false, ARRAY['shellfish'], ARRAY[]::TEXT[]),

  ('sweet-shrimps-curry', (SELECT id FROM menu_categories WHERE slug = 'seafood-curries'),
   'Sweet Shrimps Curry', 'ပုဇွန်ကြော်နှပ်',
   'Shrimp in mildly spiced sauce.',
   1900, true, false, ARRAY['shellfish'], ARRAY[]::TEXT[]),

  ('snakehead-innards-curry', (SELECT id FROM menu_categories WHERE slug = 'seafood-curries'),
   'Snakehead Innards Curry', 'ငါးရံအူဟင်း',
   'Snakehead intestines curry in spiced sauce.',
   1400, true, false, ARRAY['fish'], ARRAY[]::TEXT[]),

  ('fried-fish-cake-curry', (SELECT id FROM menu_categories WHERE slug = 'seafood-curries'),
   'Fried Fish Cake Curry', 'ငါးဖယ်ချက်',
   'Crispy fish cakes simmered in mildly spiced tamarind sauce.',
   1400, true, false, ARRAY['fish'], ARRAY[]::TEXT[]),

  ('boneless-catfish-curry', (SELECT id FROM menu_categories WHERE slug = 'seafood-curries'),
   'Boneless Catfish Curry', 'ငါးခူမွှေချက်',
   'Boneless catfish in mildly spiced tamarind sauce.',
   1400, true, false, ARRAY['fish'], ARRAY[]::TEXT[]),

  ('fermented-fish-paste-ngapi', (SELECT id FROM menu_categories WHERE slug = 'seafood-curries'),
   'Fermented Fish Paste Nga-Pi', 'ငပိရည်ကျို',
   'Platter of vegetables with fermented fish paste dip.',
   1400, true, false, ARRAY['fish'], ARRAY['contains_fish']),

  ('fried-catfish-curry', (SELECT id FROM menu_categories WHERE slug = 'seafood-curries'),
   'Fried Catfish Curry', 'ငါးခူကြော်နှပ်',
   'Fried catfish curry.',
   1900, true, false, ARRAY['fish'], ARRAY[]::TEXT[]),

  ('fish-paste-tomato-curry', (SELECT id FROM menu_categories WHERE slug = 'seafood-curries'),
   'Fish Paste Tomato Curry', 'ခရမ်းချဥ်သီးငါးပိချက်',
   'Fish paste in tomato curry with ginger/onions/garlic.',
   1400, true, false, ARRAY['fish'], ARRAY['contains_fish'])
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name_en = EXCLUDED.name_en,
  name_my = EXCLUDED.name_my,
  description_en = EXCLUDED.description_en,
  base_price_cents = EXCLUDED.base_price_cents,
  is_active = EXCLUDED.is_active,
  is_sold_out = EXCLUDED.is_sold_out,
  allergens = EXCLUDED.allergens,
  tags = EXCLUDED.tags;

-- Appetizers / Salads
INSERT INTO menu_items (slug, category_id, name_en, name_my, description_en, base_price_cents, is_active, is_sold_out, allergens, tags) VALUES
  ('pickled-tea-salad', (SELECT id FROM menu_categories WHERE slug = 'appetizers-salads'),
   'Pickled Tea Salad', 'လက်ဖတ်သုပ်',
   'Pickled tea leaves + lettuce + crispy beans/nuts; includes peanuts + dried shrimp powder.',
   1200, true, false, ARRAY['peanuts', 'shellfish'], ARRAY['contains_peanuts', 'contains_shellfish']),

  ('tomato-salad', (SELECT id FROM menu_categories WHERE slug = 'appetizers-salads'),
   'Tomato Salad', 'ခရမ်းချဥ်သီးသုပ်',
   'Organic tomatoes + shallots + chickpea powder + lettuce + Thai chili.',
   1200, true, false, ARRAY[]::TEXT[], ARRAY[]::TEXT[]),

  ('everything-salad', (SELECT id FROM menu_categories WHERE slug = 'appetizers-salads'),
   'Everything Salad', 'အသုပ်စုံ',
   'Seaweed, noodles, potato, banana shoots, papaya, lettuce; includes peanuts + dried shrimp powder.',
   1200, true, false, ARRAY['peanuts', 'shellfish'], ARRAY['contains_peanuts', 'contains_shellfish']),

  ('century-egg-salad', (SELECT id FROM menu_categories WHERE slug = 'appetizers-salads'),
   'Century Egg Salad', 'ဆေးဘဲဥသုပ်',
   'Century egg + tomato + shallot + chickpea powder; includes peanuts + dried shrimp powder.',
   1200, true, false, ARRAY['peanuts', 'shellfish', 'egg'], ARRAY['contains_peanuts', 'contains_shellfish', 'contains_egg']),

  ('grilled-aubergine-salad', (SELECT id FROM menu_categories WHERE slug = 'appetizers-salads'),
   'Grilled Aubergine Salad', 'ခရမ်းသီးမီးဖုတ်သုပ်',
   'Grilled eggplant with shallot, chili, lime, peanuts; crispy shallots + coriander.',
   1200, true, false, ARRAY['peanuts'], ARRAY['contains_peanuts'])
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name_en = EXCLUDED.name_en,
  name_my = EXCLUDED.name_my,
  description_en = EXCLUDED.description_en,
  base_price_cents = EXCLUDED.base_price_cents,
  is_active = EXCLUDED.is_active,
  is_sold_out = EXCLUDED.is_sold_out,
  allergens = EXCLUDED.allergens,
  tags = EXCLUDED.tags;

-- Drinks
INSERT INTO menu_items (slug, category_id, name_en, name_my, description_en, base_price_cents, is_active, is_sold_out, allergens, tags) VALUES
  ('burmese-milk-tea', (SELECT id FROM menu_categories WHERE slug = 'drinks'),
   'Burmese Milk Tea', 'လက်ဖတ်ရည်',
   'Burmese roasted black tea with evaporated + condensed milk.',
   400, true, false, ARRAY['dairy'], ARRAY['contains_dairy']),

  ('faluda', (SELECT id FROM menu_categories WHERE slug = 'drinks'),
   'Faluda', 'ဖါလူဒါ',
   'Burmese sundae with pudding, jelly, assorted nuts.',
   900, true, false, ARRAY['tree_nuts', 'dairy'], ARRAY['contains_tree_nuts_optional', 'contains_dairy_optional'])
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name_en = EXCLUDED.name_en,
  name_my = EXCLUDED.name_my,
  description_en = EXCLUDED.description_en,
  base_price_cents = EXCLUDED.base_price_cents,
  is_active = EXCLUDED.is_active,
  is_sold_out = EXCLUDED.is_sold_out,
  allergens = EXCLUDED.allergens,
  tags = EXCLUDED.tags;

-- ===========================================
-- 5. ITEM-MODIFIER GROUP RELATIONSHIPS
-- ===========================================

-- Clear existing relationships for items with modifiers (idempotent)
DELETE FROM item_modifier_groups WHERE item_id IN (
  SELECT id FROM menu_items WHERE slug IN (
    'kyay-o', 'goat-curry', 'beef-curry', 'chicken-curry', 'tom-yum-fried-rice-or-noodles'
  )
);

-- Kyay-O modifiers
INSERT INTO item_modifier_groups (item_id, group_id) VALUES
  ((SELECT id FROM menu_items WHERE slug = 'kyay-o'), (SELECT id FROM modifier_groups WHERE slug = 'kyay_o_style')),
  ((SELECT id FROM menu_items WHERE slug = 'kyay-o'), (SELECT id FROM modifier_groups WHERE slug = 'kyay_o_protein')),
  ((SELECT id FROM menu_items WHERE slug = 'kyay-o'), (SELECT id FROM modifier_groups WHERE slug = 'kyay_o_addons'));

-- Goat Curry modifiers
INSERT INTO item_modifier_groups (item_id, group_id) VALUES
  ((SELECT id FROM menu_items WHERE slug = 'goat-curry'), (SELECT id FROM modifier_groups WHERE slug = 'goat_curry_cut'));

-- Beef Curry modifiers
INSERT INTO item_modifier_groups (item_id, group_id) VALUES
  ((SELECT id FROM menu_items WHERE slug = 'beef-curry'), (SELECT id FROM modifier_groups WHERE slug = 'beef_curry_style'));

-- Chicken Curry modifiers
INSERT INTO item_modifier_groups (item_id, group_id) VALUES
  ((SELECT id FROM menu_items WHERE slug = 'chicken-curry'), (SELECT id FROM modifier_groups WHERE slug = 'chicken_curry_style'));

-- Tom Yum modifiers
INSERT INTO item_modifier_groups (item_id, group_id) VALUES
  ((SELECT id FROM menu_items WHERE slug = 'tom-yum-fried-rice-or-noodles'), (SELECT id FROM modifier_groups WHERE slug = 'tom_yum_base'));

-- ===========================================
-- 6. VERIFY COUNTS
-- ===========================================
DO $$
DECLARE
  cat_count INTEGER;
  item_count INTEGER;
  mod_group_count INTEGER;
  mod_option_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO cat_count FROM menu_categories;
  SELECT COUNT(*) INTO item_count FROM menu_items;
  SELECT COUNT(*) INTO mod_group_count FROM modifier_groups;
  SELECT COUNT(*) INTO mod_option_count FROM modifier_options;

  RAISE NOTICE 'Menu seed complete: % categories, % items, % modifier groups, % modifier options',
    cat_count, item_count, mod_group_count, mod_option_count;
END $$;

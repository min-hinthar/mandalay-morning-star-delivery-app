-- ===========================================
-- Menu Seed Data (generated from menul.seed.yaml)
-- Idempotent: uses ON CONFLICT DO UPDATE
-- Run in Supabase SQL Editor
-- ===========================================

BEGIN;

-- ===========================================
-- 1. CATEGORIES
-- ===========================================
INSERT INTO menu_categories (slug, name, sort_order) VALUES
  ('all-day-breakfast',    'All-Day Breakfast',        10),
  ('rice-noodles-soups',   'Rice / Noodles / Soups',   20),
  ('sides',                'Sides',                    30),
  ('curries-a-la-carte',   'Curries (A la Carte)',     40),
  ('vegetables',           'Vegetables',               50),
  ('seafood-curries',      'Seafood Curries',          60),
  ('appetizers-salads',    'Appetizers / Salads',      70),
  ('drinks',               'Drinks',                   80)
ON CONFLICT (slug) DO UPDATE SET
  name       = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- ===========================================
-- 2. MODIFIER GROUPS
-- ===========================================
INSERT INTO modifier_groups (slug, name, selection_type, min_select, max_select) VALUES
  ('kyay_o_style',        'Style',              'single',   1, 1),
  ('kyay_o_protein',      'Protein Option',     'single',   1, 1),
  ('kyay_o_addons',       'Add-ons',            'multiple', 0, 5),
  ('goat_curry_cut',      'Goat Choice',        'single',   1, 1),
  ('beef_curry_style',    'Beef Curry Style',   'single',   1, 1),
  ('chicken_curry_style', 'Chicken Curry Style','single',   1, 1),
  ('tom_yum_base',        'Choose Base',        'single',   1, 1)
ON CONFLICT (slug) DO UPDATE SET
  name           = EXCLUDED.name,
  selection_type = EXCLUDED.selection_type,
  min_select     = EXCLUDED.min_select,
  max_select     = EXCLUDED.max_select;

-- ===========================================
-- 3. MODIFIER OPTIONS
-- ===========================================

-- Slugs use {groupSlug}__{optionSlug} convention (matches seed-menu.ts buildOptionSlug)

-- kyay_o_style
INSERT INTO modifier_options (group_id, slug, name, price_delta_cents, sort_order) VALUES
  ((SELECT id FROM modifier_groups WHERE slug = 'kyay_o_style'), 'kyay_o_style__soup',     'Kyay-O (Soup)', 0, 0),
  ((SELECT id FROM modifier_groups WHERE slug = 'kyay_o_style'), 'kyay_o_style__si_chat',  'Si-Chat (Dry)', 0, 1)
ON CONFLICT (slug) DO UPDATE SET
  name              = EXCLUDED.name,
  price_delta_cents = EXCLUDED.price_delta_cents,
  sort_order        = EXCLUDED.sort_order;

-- kyay_o_protein
INSERT INTO modifier_options (group_id, slug, name, price_delta_cents, sort_order) VALUES
  ((SELECT id FROM modifier_groups WHERE slug = 'kyay_o_protein'), 'kyay_o_protein__pork_default',    'Pork (default)',  0, 0),
  ((SELECT id FROM modifier_groups WHERE slug = 'kyay_o_protein'), 'kyay_o_protein__chicken_plus_egg', 'Chicken + egg',  0, 1)
ON CONFLICT (slug) DO UPDATE SET
  name              = EXCLUDED.name,
  price_delta_cents = EXCLUDED.price_delta_cents,
  sort_order        = EXCLUDED.sort_order;

-- kyay_o_addons
INSERT INTO modifier_options (group_id, slug, name, price_delta_cents, sort_order) VALUES
  ((SELECT id FROM modifier_groups WHERE slug = 'kyay_o_addons'), 'kyay_o_addons__brains', 'Brains add-on', 200, 0)
ON CONFLICT (slug) DO UPDATE SET
  name              = EXCLUDED.name,
  price_delta_cents = EXCLUDED.price_delta_cents,
  sort_order        = EXCLUDED.sort_order;

-- goat_curry_cut
INSERT INTO modifier_options (group_id, slug, name, price_delta_cents, sort_order) VALUES
  ((SELECT id FROM modifier_groups WHERE slug = 'goat_curry_cut'), 'goat_curry_cut__original', 'Original', 0, 0),
  ((SELECT id FROM modifier_groups WHERE slug = 'goat_curry_cut'), 'goat_curry_cut__offal',    'Offal',    0, 1)
ON CONFLICT (slug) DO UPDATE SET
  name              = EXCLUDED.name,
  price_delta_cents = EXCLUDED.price_delta_cents,
  sort_order        = EXCLUDED.sort_order;

-- beef_curry_style
INSERT INTO modifier_options (group_id, slug, name, price_delta_cents, sort_order) VALUES
  ((SELECT id FROM modifier_groups WHERE slug = 'beef_curry_style'), 'beef_curry_style__spiced',            'Spiced',            0, 0),
  ((SELECT id FROM modifier_groups WHERE slug = 'beef_curry_style'), 'beef_curry_style__non_spicy_braised', 'Non-spicy braised', 0, 1)
ON CONFLICT (slug) DO UPDATE SET
  name              = EXCLUDED.name,
  price_delta_cents = EXCLUDED.price_delta_cents,
  sort_order        = EXCLUDED.sort_order;

-- chicken_curry_style
INSERT INTO modifier_options (group_id, slug, name, price_delta_cents, sort_order) VALUES
  ((SELECT id FROM modifier_groups WHERE slug = 'chicken_curry_style'), 'chicken_curry_style__original', 'Original', 0, 0),
  ((SELECT id FROM modifier_groups WHERE slug = 'chicken_curry_style'), 'chicken_curry_style__masala',   'Masala',   0, 1),
  ((SELECT id FROM modifier_groups WHERE slug = 'chicken_curry_style'), 'chicken_curry_style__coconut',  'Coconut',  0, 2)
ON CONFLICT (slug) DO UPDATE SET
  name              = EXCLUDED.name,
  price_delta_cents = EXCLUDED.price_delta_cents,
  sort_order        = EXCLUDED.sort_order;

-- tom_yum_base
INSERT INTO modifier_options (group_id, slug, name, price_delta_cents, sort_order) VALUES
  ((SELECT id FROM modifier_groups WHERE slug = 'tom_yum_base'), 'tom_yum_base__fried_rice',    'Fried Rice',    0, 0),
  ((SELECT id FROM modifier_groups WHERE slug = 'tom_yum_base'), 'tom_yum_base__fried_noodles', 'Fried Noodles', 0, 1)
ON CONFLICT (slug) DO UPDATE SET
  name              = EXCLUDED.name,
  price_delta_cents = EXCLUDED.price_delta_cents,
  sort_order        = EXCLUDED.sort_order;

-- ===========================================
-- 4. MENU ITEMS
-- ===========================================

-- All-Day Breakfast
INSERT INTO menu_items (category_id, slug, name_en, name_my, description_en, base_price_cents, is_active, is_sold_out, tags, allergens) VALUES
  ((SELECT id FROM menu_categories WHERE slug = 'all-day-breakfast'), 'kyay-o', 'Kyay-O / Si-Chat', 'ကြေးအိုး/ဆီချက်', 'Rice vermicelli noodle soup (or dry) with pork, meatballs, intestines, eggs, bok choy. Chicken + egg option available.', 1800, true, false, '{}', '{egg}'),
  ((SELECT id FROM menu_categories WHERE slug = 'all-day-breakfast'), 'nan-gyi-mont-ti', 'Nan-Gyi Mont Ti', 'နန်းကြီးမုန့်တီ', 'Rice noodles with fish cake, garnishes, and crunch tossed in Mandalay chicken curry sauce.', 1300, true, false, '{popular}', '{}'),
  ((SELECT id FROM menu_categories WHERE slug = 'all-day-breakfast'), 'mee-shay', 'Mee-Shay', 'မြှီးရှည်', 'Mandalay specialty rice noodles in sweet soybean sauce with pork, crunchy rind, pickled mustard.', 1400, true, false, '{}', '{soy}'),
  ((SELECT id FROM menu_categories WHERE slug = 'all-day-breakfast'), 'ohno-khao-swe', 'Ohno Khao-Swe', 'အုန်းနို့ခေါက်ဆွဲ', 'Coconut cream + chickpea curry broth with wheat noodles, chicken drum, egg, garnishes.', 1500, true, false, '{}', '{egg,gluten_wheat}'),
  ((SELECT id FROM menu_categories WHERE slug = 'all-day-breakfast'), 'shan-noodles', 'Shan Noodles', 'ရှမ်းခေါက်ဆွဲ', 'Rice noodles with savory tomato-based sauce (pork) + peanuts, fried garlic, pickled mustard, chili paste.', 1300, true, false, '{}', '{peanuts}'),
  ((SELECT id FROM menu_categories WHERE slug = 'all-day-breakfast'), 'mohinga', 'Mohinga', 'မုန့်ဟင်းခါး', 'Traditional fish broth soup with rice noodles, garnishes, bean fritters, egg slices.', 1400, true, false, '{}', '{fish,egg}')
ON CONFLICT (slug) DO UPDATE SET
  category_id      = EXCLUDED.category_id,
  name_en          = EXCLUDED.name_en,
  name_my          = EXCLUDED.name_my,
  description_en   = EXCLUDED.description_en,
  base_price_cents = EXCLUDED.base_price_cents,
  is_active        = EXCLUDED.is_active,
  is_sold_out      = EXCLUDED.is_sold_out,
  tags             = EXCLUDED.tags,
  allergens        = EXCLUDED.allergens,
  updated_at       = NOW();

-- Rice / Noodles / Soups
INSERT INTO menu_items (category_id, slug, name_en, name_my, description_en, base_price_cents, is_active, is_sold_out, tags, allergens) VALUES
  ((SELECT id FROM menu_categories WHERE slug = 'rice-noodles-soups'), 'burmese-fried-rice', 'Burmese Fried Rice', 'ပဲပြုတ်ထမင်းကြော်', 'Stir-fried rice with eggs, onion, garlic, and boiled yellow peas.', 1300, true, false, '{}', '{egg}'),
  ((SELECT id FROM menu_categories WHERE slug = 'rice-noodles-soups'), 'goat-marrow-soup', 'Goat-Marrow Soup', 'ဆိတ်ရိုးစွပ်ပြုတ်', 'Goat stew + bone marrow infused soup with chickpeas and potatoes. Best paired with Parata.', 1900, true, false, '{}', '{}'),
  ((SELECT id FROM menu_categories WHERE slug = 'rice-noodles-soups'), 'coconut-chicken-and-rice', 'Coconut Chicken & Rice', 'ကြက်အုန်းထမင်း', 'Coconut rice with balachaung + Burmese chicken curry cooked in coconut oil.', 1400, true, false, '{}', '{shellfish}'),
  ((SELECT id FROM menu_categories WHERE slug = 'rice-noodles-soups'), 'ngapi-rice-salad', 'Ngapi-Rice Salad', 'ငပိထမင်း', 'Rice tossed in fermented fish paste curry (Nga-Pi), served with sunny-side-up egg.', 1300, true, false, '{}', '{fish,egg}'),
  ((SELECT id FROM menu_categories WHERE slug = 'rice-noodles-soups'), 'rice-with-pickled-tea-salad', 'Rice with Pickled Tea Salad', 'လက်ဖက်ထမင်း', 'Rice tossed in pickled tea salad + garnishes, served with sunny-side-up egg.', 1300, true, false, '{}', '{egg}'),
  ((SELECT id FROM menu_categories WHERE slug = 'rice-noodles-soups'), 'mixed-veggie-shrimp-stir-fry-rice', 'Mixed Veggie & Shrimp Stir Fry Over Rice', 'ရန်ကုန်ထမင်းပေါင်း', 'Crisp, fresh vegetables and tender quail eggs with succulent shrimp, stir-fried and served over a bed of steamed rice.', 2000, true, false, '{}', '{egg,shellfish}'),
  ((SELECT id FROM menu_categories WHERE slug = 'rice-noodles-soups'), 'tom-yum-fried-rice-or-noodles', 'Tom-Yum Fried Rice / Noodles', 'တုန်ရန်းထမင်းကြော်/ခေါက်ဆွဲကြော်', 'Stir-fry with shrimp + vegetables + tom yum aromatics (lemongrass/galangal/kaffir lime).', 1600, true, false, '{}', '{shellfish}')
ON CONFLICT (slug) DO UPDATE SET
  category_id      = EXCLUDED.category_id,
  name_en          = EXCLUDED.name_en,
  name_my          = EXCLUDED.name_my,
  description_en   = EXCLUDED.description_en,
  base_price_cents = EXCLUDED.base_price_cents,
  is_active        = EXCLUDED.is_active,
  is_sold_out      = EXCLUDED.is_sold_out,
  tags             = EXCLUDED.tags,
  allergens        = EXCLUDED.allergens,
  updated_at       = NOW();

-- Sides
INSERT INTO menu_items (category_id, slug, name_en, name_my, description_en, base_price_cents, is_active, is_sold_out, tags, allergens) VALUES
  ((SELECT id FROM menu_categories WHERE slug = 'sides'), 'parata', 'Parata (2 pcs)', 'ပလာတာ', 'Two pieces. Great with goat marrow soup/curries.', 500, true, false, '{}', '{gluten_wheat}'),
  ((SELECT id FROM menu_categories WHERE slug = 'sides'), 'coconut-rice', 'Coconut Rice', 'အုန်းထမင်း', 'Coconut-cream cooked rice.', 300, true, false, '{}', '{}'),
  ((SELECT id FROM menu_categories WHERE slug = 'sides'), 'rice', 'Rice', 'ထမင်းဖြူ', 'Steamed plain white rice.', 200, true, false, '{}', '{}'),
  ((SELECT id FROM menu_categories WHERE slug = 'sides'), 'balachaung', 'Balachaung', 'ဘာလချောင်ကြော်', 'Shrimp condiment with fried onions, shrimp, garlic, ginger & red chilies.', 300, true, false, '{}', '{shellfish}')
ON CONFLICT (slug) DO UPDATE SET
  category_id      = EXCLUDED.category_id,
  name_en          = EXCLUDED.name_en,
  name_my          = EXCLUDED.name_my,
  description_en   = EXCLUDED.description_en,
  base_price_cents = EXCLUDED.base_price_cents,
  is_active        = EXCLUDED.is_active,
  is_sold_out      = EXCLUDED.is_sold_out,
  tags             = EXCLUDED.tags,
  allergens        = EXCLUDED.allergens,
  updated_at       = NOW();

-- Curries (A la Carte)
INSERT INTO menu_items (category_id, slug, name_en, name_my, description_en, base_price_cents, is_active, is_sold_out, tags, allergens) VALUES
  ((SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'), 'goat-curry', 'Goat Curry [Original/Offal]', 'ဆိတ်သားဟင်း/ဆိတ်ကလီစာ', 'Braised goat in Burmese-Indian masala curry (choice of meat or offal).', 3000, true, false, '{spicy_optional}', '{}'),
  ((SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'), 'beef-curry', 'Beef Curry', 'အမဲသားဟင်း/အမဲကြော်နှပ်', 'Slow-cooked Burmese-Indian beef curry; non-spicy braised option available.', 1900, true, false, '{}', '{soy}'),
  ((SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'), 'beef-pounded-deep-fried', 'Beef Pounded Deep Fried', 'အမဲထောင်းကြော်', 'Pulled braised beef cooked in spicy chili oil.', 1900, true, false, '{spicy}', '{}'),
  ((SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'), 'chicken-curry', 'Chicken Curry (Original / Masala / Coconut)', 'ကြက်သားဟင်း', 'Farm-raised chicken curry; masala spicy or sweet coconut option available.', 1400, true, false, '{}', '{soy}'),
  ((SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'), 'chicken-giblets-curry', 'Chicken Giblets Curry', 'ကြက်အသဲမြစ်', 'Chicken gizzards and liver in traditional Burmese curry.', 1400, true, false, '{}', '{}'),
  ((SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'), 'pork-curry', 'Pork Curry', 'ဝက်သနီ', 'Classic pork curry in sweet, mildly spiced sauce.', 1400, true, false, '{}', '{soy}'),
  ((SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'), 'pork-horsegram-bean-curry', 'Pork Horsegram Bean Curry', 'ဝက်ပုန်းရည်ကြီး', 'Pork curry with horse gram beans; mildly spiced, earthy/nutty.', 1400, true, false, '{}', '{soy}'),
  ((SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'), 'pork-skewers', 'Pork Skewers', 'ဝက်သားဒုတ်ထိုး', 'Slow-cooked pork + intestines + liver in herbal spices; served with dipping sauce.', 1500, true, false, '{}', '{}'),
  ((SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'), 'bamboo-shoot-with-pork-soup', 'Bamboo Shoot with Pork Soup', 'ဝက်မျှစ်ချဥ်', 'Pork in mildly spiced tamarind broth infused with bamboo shoots.', 1400, true, false, '{}', '{fish}'),
  ((SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'), 'pork-offals-curry', 'Pork Offals Curry', 'ဝက်ကလီစာ', 'Pork offal + intestines + liver in mildly spiced sauce.', 1400, true, false, '{}', '{soy}'),
  ((SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'), 'duck-egg-curry', 'Duck Egg', 'ဘဲဥဟင်း', 'Boiled duck eggs cooked in tomato-based curry.', 1400, true, false, '{}', '{egg}'),
  ((SELECT id FROM menu_categories WHERE slug = 'curries-a-la-carte'), 'chicken-gourd-curry', 'Chicken Gourd Curry', 'ကြက်ဗူးသီး', 'Chicken curry cooked with bottle gourd in traditional Burmese style.', 1400, true, false, '{}', '{}')
ON CONFLICT (slug) DO UPDATE SET
  category_id      = EXCLUDED.category_id,
  name_en          = EXCLUDED.name_en,
  name_my          = EXCLUDED.name_my,
  description_en   = EXCLUDED.description_en,
  base_price_cents = EXCLUDED.base_price_cents,
  is_active        = EXCLUDED.is_active,
  is_sold_out      = EXCLUDED.is_sold_out,
  tags             = EXCLUDED.tags,
  allergens        = EXCLUDED.allergens,
  updated_at       = NOW();

-- Vegetables
INSERT INTO menu_items (category_id, slug, name_en, name_my, description_en, base_price_cents, is_active, is_sold_out, tags, allergens) VALUES
  ((SELECT id FROM menu_categories WHERE slug = 'vegetables'), 'pinto-beans', 'Pinto Beans', 'ပဲရေပွကြော်', 'Pinto beans stir-fried in Burmese style with onions, garlic, and spices.', 1400, true, false, '{vegetarian}', '{}'),
  ((SELECT id FROM menu_categories WHERE slug = 'vegetables'), 'roselle-with-shrimp-curry', 'Roselle with Shrimp Curry', 'ချဥ်ပေါင်ကြော်', 'Roselle sour leaf curry with shrimp.', 1400, true, false, '{}', '{shellfish}'),
  ((SELECT id FROM menu_categories WHERE slug = 'vegetables'), 'acacia-with-shrimp-curry', 'Acacia with Shrimp Curry', 'ကင်ပွန်းချဥ်ကြော်', 'Acacia sour leaf curry with shrimp.', 1400, true, false, '{}', '{shellfish}'),
  ((SELECT id FROM menu_categories WHERE slug = 'vegetables'), 'bamboo-shoot-mushroom-soup', 'Bamboo Shoot Mushroom Soup', 'မျှစ်တောချက်', 'Young bamboo shoots cooked with mushrooms in savory soup.', 1400, true, false, '{vegetarian}', '{}'),
  ((SELECT id FROM menu_categories WHERE slug = 'vegetables'), 'mixed-veggie-soup', 'Mixed Veggie Soup', 'သီးစုံပဲကုလားဟင်း', 'Burmese Indian-style assorted vegetables in savory, mildly spicy soup.', 1400, true, false, '{vegetarian,spicy_optional}', '{}')
ON CONFLICT (slug) DO UPDATE SET
  category_id      = EXCLUDED.category_id,
  name_en          = EXCLUDED.name_en,
  name_my          = EXCLUDED.name_my,
  description_en   = EXCLUDED.description_en,
  base_price_cents = EXCLUDED.base_price_cents,
  is_active        = EXCLUDED.is_active,
  is_sold_out      = EXCLUDED.is_sold_out,
  tags             = EXCLUDED.tags,
  allergens        = EXCLUDED.allergens,
  updated_at       = NOW();

-- Seafood Curries
INSERT INTO menu_items (category_id, slug, name_en, name_my, description_en, base_price_cents, is_active, is_sold_out, tags, allergens) VALUES
  ((SELECT id FROM menu_categories WHERE slug = 'seafood-curries'), 'crab-masala-curry', 'Crab Masala Curry', 'ဂဏန်းမဆလာ', 'Whole Dungeness crab simmered in masala chili curry with tamarind.', 3000, true, false, '{spicy_optional}', '{shellfish}'),
  ((SELECT id FROM menu_categories WHERE slug = 'seafood-curries'), 'swai-fish-curry', 'Swai Fish Curry', 'ငါးမြင်းဟင်း', 'Swai fish in mildly spiced sauce.', 1900, true, false, '{}', '{fish}'),
  ((SELECT id FROM menu_categories WHERE slug = 'seafood-curries'), 'hilsa-fish', 'Hilsa Fish', 'ငါးသလောက်ပေါင်း', 'Hilsa fish in tomato-based curry.', 2400, true, false, '{}', '{fish}'),
  ((SELECT id FROM menu_categories WHERE slug = 'seafood-curries'), 'river-prawns-curry', 'River Prawns Curry', 'ပုဇွန်ထုပ်ဟင်း', 'Whole river prawns curry with aromatics + prawn oil.', 2400, true, false, '{}', '{shellfish}'),
  ((SELECT id FROM menu_categories WHERE slug = 'seafood-curries'), 'sweet-shrimps-curry', 'Sweet Shrimps Curry', 'ပုဇွန်ကြော်နှပ်', 'Shrimp in mildly spiced sauce.', 1900, true, false, '{}', '{shellfish}'),
  ((SELECT id FROM menu_categories WHERE slug = 'seafood-curries'), 'snakehead-innards-curry', 'Snakehead Innards Curry', 'ငါးရံအူဟင်း', 'Snakehead intestines curry in spiced sauce.', 1900, true, false, '{}', '{fish}'),
  ((SELECT id FROM menu_categories WHERE slug = 'seafood-curries'), 'fried-fish-cake-curry', 'Fried Fish Cake Curry', 'ငါးဖယ်ချက်', 'Crispy fish cakes simmered in mildly spiced tamarind sauce.', 1400, true, false, '{}', '{fish}'),
  ((SELECT id FROM menu_categories WHERE slug = 'seafood-curries'), 'boneless-catfish-curry', 'Boneless Catfish Curry', 'ငါးခူမွှေချက်', 'Boneless catfish in mildly spiced tamarind sauce.', 1400, true, false, '{}', '{fish}'),
  ((SELECT id FROM menu_categories WHERE slug = 'seafood-curries'), 'fermented-fish-paste-ngapi', 'Fermented Fish Paste Nga-Pi', 'ငပိရည်ကျို', 'Platter of vegetables with fermented fish paste dip.', 1400, true, false, '{}', '{fish}'),
  ((SELECT id FROM menu_categories WHERE slug = 'seafood-curries'), 'fried-catfish-curry', 'Fried Catfish Curry', 'ငါးခူကြော်နှပ်', 'Fried catfish curry.', 1400, true, false, '{}', '{fish}'),
  ((SELECT id FROM menu_categories WHERE slug = 'seafood-curries'), 'fish-paste-tomato-curry', 'Fish Paste Tomato Curry', 'ခရမ်းချဥ်သီးငါးပိချက်', 'Fish paste in tomato curry with ginger/onions/garlic.', 1400, true, false, '{}', '{fish}')
ON CONFLICT (slug) DO UPDATE SET
  category_id      = EXCLUDED.category_id,
  name_en          = EXCLUDED.name_en,
  name_my          = EXCLUDED.name_my,
  description_en   = EXCLUDED.description_en,
  base_price_cents = EXCLUDED.base_price_cents,
  is_active        = EXCLUDED.is_active,
  is_sold_out      = EXCLUDED.is_sold_out,
  tags             = EXCLUDED.tags,
  allergens        = EXCLUDED.allergens,
  updated_at       = NOW();

-- Appetizers / Salads
INSERT INTO menu_items (category_id, slug, name_en, name_my, description_en, base_price_cents, is_active, is_sold_out, tags, allergens) VALUES
  ((SELECT id FROM menu_categories WHERE slug = 'appetizers-salads'), 'pickled-tea-salad', 'Pickled Tea Salad', 'လက်ဖတ်သုပ်', 'Pickled tea leaves + lettuce + crispy beans/nuts; includes peanuts + dried shrimp powder.', 1200, true, false, '{}', '{peanuts,shellfish}'),
  ((SELECT id FROM menu_categories WHERE slug = 'appetizers-salads'), 'tomato-salad', 'Tomato Salad', 'ခရမ်းချဥ်သီးသုပ်', 'Organic tomatoes + shallots + chickpea powder + lettuce + Thai chili.', 1200, true, false, '{}', '{}'),
  ((SELECT id FROM menu_categories WHERE slug = 'appetizers-salads'), 'everything-salad', 'Everything Salad', 'အသုပ်စုံ', 'Seaweed, noodles, potato, banana shoots, papaya, lettuce; includes peanuts + dried shrimp powder.', 1200, true, false, '{}', '{peanuts,shellfish}'),
  ((SELECT id FROM menu_categories WHERE slug = 'appetizers-salads'), 'century-egg-salad', 'Century Egg Salad', 'ဆေးဘဲဥသုပ်', 'Century egg + tomato + shallot + chickpea powder; includes peanuts + dried shrimp powder.', 1200, true, false, '{}', '{peanuts,shellfish,egg}'),
  ((SELECT id FROM menu_categories WHERE slug = 'appetizers-salads'), 'grilled-aubergine-salad', 'Grilled Aubergine Salad', 'ခရမ်းသီးမီးဖုတ်သုပ်', 'Grilled eggplant with shallot, chili, lime, peanuts; crispy shallots + coriander.', 1200, true, false, '{}', '{peanuts}')
ON CONFLICT (slug) DO UPDATE SET
  category_id      = EXCLUDED.category_id,
  name_en          = EXCLUDED.name_en,
  name_my          = EXCLUDED.name_my,
  description_en   = EXCLUDED.description_en,
  base_price_cents = EXCLUDED.base_price_cents,
  is_active        = EXCLUDED.is_active,
  is_sold_out      = EXCLUDED.is_sold_out,
  tags             = EXCLUDED.tags,
  allergens        = EXCLUDED.allergens,
  updated_at       = NOW();

-- Drinks
INSERT INTO menu_items (category_id, slug, name_en, name_my, description_en, base_price_cents, is_active, is_sold_out, tags, allergens) VALUES
  ((SELECT id FROM menu_categories WHERE slug = 'drinks'), 'burmese-milk-tea', 'Burmese Milk Tea', 'လက်ဖတ်ရည်', 'Burmese roasted black tea with evaporated + condensed milk.', 400, true, false, '{}', '{dairy}'),
  ((SELECT id FROM menu_categories WHERE slug = 'drinks'), 'coffee', 'Coffee', 'ကော်ဖီ', 'Hot or cold coffee, 10 oz.', 650, true, false, '{}', '{}'),
  ((SELECT id FROM menu_categories WHERE slug = 'drinks'), 'faluda', 'Faluda', 'ဖါလူဒါ', 'Burmese sundae with pudding, jelly, assorted nuts.', 900, true, false, '{}', '{tree_nuts,dairy}')
ON CONFLICT (slug) DO UPDATE SET
  category_id      = EXCLUDED.category_id,
  name_en          = EXCLUDED.name_en,
  name_my          = EXCLUDED.name_my,
  description_en   = EXCLUDED.description_en,
  base_price_cents = EXCLUDED.base_price_cents,
  is_active        = EXCLUDED.is_active,
  is_sold_out      = EXCLUDED.is_sold_out,
  tags             = EXCLUDED.tags,
  allergens        = EXCLUDED.allergens,
  updated_at       = NOW();

-- ===========================================
-- 5. ITEM ↔ MODIFIER GROUP LINKS
-- ===========================================

-- Clear existing links for items that have modifiers, then re-insert
DELETE FROM item_modifier_groups WHERE item_id IN (
  SELECT id FROM menu_items WHERE slug IN (
    'kyay-o', 'tom-yum-fried-rice-or-noodles',
    'goat-curry', 'beef-curry', 'chicken-curry'
  )
);

INSERT INTO item_modifier_groups (item_id, group_id) VALUES
  -- kyay-o: style + protein + addons
  ((SELECT id FROM menu_items WHERE slug = 'kyay-o'), (SELECT id FROM modifier_groups WHERE slug = 'kyay_o_style')),
  ((SELECT id FROM menu_items WHERE slug = 'kyay-o'), (SELECT id FROM modifier_groups WHERE slug = 'kyay_o_protein')),
  ((SELECT id FROM menu_items WHERE slug = 'kyay-o'), (SELECT id FROM modifier_groups WHERE slug = 'kyay_o_addons')),
  -- tom-yum: base choice
  ((SELECT id FROM menu_items WHERE slug = 'tom-yum-fried-rice-or-noodles'), (SELECT id FROM modifier_groups WHERE slug = 'tom_yum_base')),
  -- goat-curry: cut choice
  ((SELECT id FROM menu_items WHERE slug = 'goat-curry'), (SELECT id FROM modifier_groups WHERE slug = 'goat_curry_cut')),
  -- beef-curry: style choice
  ((SELECT id FROM menu_items WHERE slug = 'beef-curry'), (SELECT id FROM modifier_groups WHERE slug = 'beef_curry_style')),
  -- chicken-curry: style choice
  ((SELECT id FROM menu_items WHERE slug = 'chicken-curry'), (SELECT id FROM modifier_groups WHERE slug = 'chicken_curry_style'))
ON CONFLICT (item_id, group_id) DO NOTHING;

COMMIT;

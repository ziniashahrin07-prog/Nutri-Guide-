import { BANGLADESH_FOOD_DATABASE } from './data/bangladeshFoodDatabase';
import { generateMealPlan, getMealSwapAlternatives } from './utils/mealPlanner';
import { clearRotationMemory, getRecentFoodFrequencies, recordUsedFoods, getFoodDiversityScore } from './utils/foodRotationMemory';
import { isDietaryCompliant, isAllergyCompliant } from './utils/mealCoherence';
import { PersonalHealthProfile } from './types';

console.log('================================================================');
console.log('   NUTRI GUIDE FOOD DIVERSITY & ROTATION ENGINE TEST SUITE');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(category: string, description: string, success: boolean, info: string = '') {
  if (success) {
    passCount++;
    console.log(`[PASS] [${category}] ${description} ${info ? `(${info})` : ''}`);
  } else {
    failCount++;
    console.error(`[FAIL] [${category}] ${description} ${info ? `(${info})` : ''}`);
  }
}

// 1. Food Database Expansion Validation
console.log('\n--- 1. FOOD DATABASE INTEGRITY & ENRICHMENT ---');
assert('Database', 'Database contains at least 50 authentic Bangladeshi foods', BANGLADESH_FOOD_DATABASE.length >= 50, `Found ${BANGLADESH_FOOD_DATABASE.length} foods`);

const requiredFoodIds = [
  'grain-08', // Whole-Wheat Roti
  'grain-09', // Porota
  'fish-13',  // Shing Fish
  'poultry-01', // Chicken Curry
  'veg-18',   // Begun Bhaji
  'veg-20',   // Potol Bhaji
  'veg-28',   // Tomato Salad
  'veg-27',   // Jhinga Tarkari
  'fruit-07', // Papaya
  'nuts-07',  // Chia Seeds
  'nuts-08',  // Pumpkin Seeds
  'nuts-10',  // Borboti Bichi
  'snack-03', // Roasted Moong Dal
  'oil-04',   // Soybean Oil
  'oil-05'    // Olive Oil
];

for (const id of requiredFoodIds) {
  const item = BANGLADESH_FOOD_DATABASE.find(f => f.id === id);
  assert('Database', `Food item ${id} is present with complete nutrition`, !!item && item.calories > 0 && !!item.banglaName, item?.englishName);
}

// Validation of Removed / Renamed Food Items
assert('Database', 'Boal Fish (fish-12) is completely removed from database', BANGLADESH_FOOD_DATABASE.every(f => f.id !== 'fish-12'));
assert('Database', 'Chicken Stew (poultry-02) is completely removed from database', BANGLADESH_FOOD_DATABASE.every(f => f.id !== 'poultry-02'));
assert('Database', 'Begun Bhorta (veg-31) is completely removed from database', BANGLADESH_FOOD_DATABASE.every(f => f.id !== 'veg-31'));
assert('Database', 'Mustard Seed (nuts-09) is completely removed from database', BANGLADESH_FOOD_DATABASE.every(f => f.id !== 'nuts-09'));
assert('Database', 'Lau Chingri (trad-06) is completely removed from database', BANGLADESH_FOOD_DATABASE.every(f => f.id !== 'trad-06'));
assert('Database', 'Coconut Oil (oil-03) is completely removed from database', BANGLADESH_FOOD_DATABASE.every(f => f.id !== 'oil-03'));
const shingFish = BANGLADESH_FOOD_DATABASE.find(f => f.id === 'fish-13');
assert('Database', 'Shing fish entry is strictly "Shing Fish" (শিং মাছ)', !!shingFish && shingFish.englishName === 'Shing Fish' && shingFish.banglaName === 'শিং মাছ' && !shingFish.banglaName.includes('মাগুর'));
const borbotiBichi = BANGLADESH_FOOD_DATABASE.find(f => f.id === 'nuts-10');
assert('Database', 'Borboti Bichi is categorized under Nuts & Seeds', !!borbotiBichi && borbotiBichi.category === 'Nuts & Seeds');
const tomatoSalad = BANGLADESH_FOOD_DATABASE.find(f => f.id === 'veg-28');
assert('Database', 'veg-28 is Tomato Salad (টমেটো সালাদ)', !!tomatoSalad && tomatoSalad.englishName === 'Tomato Salad' && tomatoSalad.banglaName === 'টমেটো সালাদ');

// 2. Vegan & Vegetarian Strict Safety
console.log('\n--- 2. DIETARY PREFERENCE STRICT SAFETY ---');
const veganProfile: PersonalHealthProfile = {
  name: 'Strict Vegan User',
  age: 28,
  sex: 'female',
  heightCm: 162,
  weightKg: 54,
  activityLevel: 'lightly_active',
  dietaryPreference: 'vegan',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'maintain_weight',
};

const veganPlanRes = generateMealPlan(veganProfile, { seed: 101 });
assert('Vegan Safety', 'Vegan meal plan generation succeeds', veganPlanRes.success && !!veganPlanRes.plan);

if (veganPlanRes.plan) {
  const allVeganItems = veganPlanRes.plan.meals.flatMap(m => m.items.map(i => i.foodItem));
  const nonVeganFound = allVeganItems.filter(f => !f.isVegan);
  assert('Vegan Safety', 'All planned foods are strictly 100% vegan certified', nonVeganFound.length === 0, 
    nonVeganFound.length === 0 ? 'Zero animal/dairy products found' : `VIOLATION: ${nonVeganFound.map(f => f.englishName).join(', ')}`);
}

const vegProfile: PersonalHealthProfile = {
  name: 'Vegetarian User',
  age: 35,
  sex: 'male',
  heightCm: 172,
  weightKg: 70,
  activityLevel: 'moderately_active',
  dietaryPreference: 'vegetarian',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'maintain_weight',
};

const vegPlanRes = generateMealPlan(vegProfile, { seed: 202 });
assert('Vegetarian Safety', 'Vegetarian meal plan generation succeeds', vegPlanRes.success && !!vegPlanRes.plan);

if (vegPlanRes.plan) {
  const allVegItems = vegPlanRes.plan.meals.flatMap(m => m.items.map(i => i.foodItem));
  const nonVegFound = allVegItems.filter(f => !f.isVegetarian);
  assert('Vegetarian Safety', 'All planned foods are strictly 100% vegetarian', nonVegFound.length === 0,
    nonVegFound.length === 0 ? 'Zero meat/fish products found' : `VIOLATION: ${nonVegFound.map(f => f.englishName).join(', ')}`);
}

// 3. Allergy Safety
console.log('\n--- 3. ALLERGY STRICT SAFETY ---');
const fishAllergyProfile: PersonalHealthProfile = {
  name: 'Fish Allergy User',
  age: 30,
  sex: 'male',
  heightCm: 178,
  weightKg: 75,
  activityLevel: 'moderately_active',
  dietaryPreference: 'no_preference',
  allergies: ['Fish', 'Mustard'],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'maintain_weight',
};

const fishAllergyPlan = generateMealPlan(fishAllergyProfile, { seed: 303 });
assert('Allergy Safety', 'Allergy-restricted meal plan generates successfully', fishAllergyPlan.success && !!fishAllergyPlan.plan);

if (fishAllergyPlan.plan) {
  const allItems = fishAllergyPlan.plan.meals.flatMap(m => m.items.map(i => i.foodItem));
  const allergicFound = allItems.filter(f => !isAllergyCompliant(f, fishAllergyProfile.allergies));
  assert('Allergy Safety', 'No fish or mustard containing foods in meal plan', allergicFound.length === 0,
    allergicFound.length === 0 ? 'Zero allergens found' : `VIOLATION: ${allergicFound.map(f => f.englishName).join(', ')}`);
}

// 4. Food Rotation Memory & Diversity Engine
console.log('\n--- 4. FOOD ROTATION MEMORY & DIVERSITY ENGINE ---');
clearRotationMemory();

const standardProfile: PersonalHealthProfile = {
  name: 'Diversity Test User',
  age: 26,
  sex: 'female',
  heightCm: 165,
  weightKg: 58,
  activityLevel: 'moderately_active',
  dietaryPreference: 'no_preference',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'maintain_weight',
};

// Generate plans for Day 1, Day 2, Day 3
const day1 = generateMealPlan(standardProfile, { seed: 1 });
const day2 = generateMealPlan(standardProfile, { seed: 2 });
const day3 = generateMealPlan(standardProfile, { seed: 3 });

assert('Rotation Engine', 'Day 1 plan generated', day1.success && !!day1.plan);
assert('Rotation Engine', 'Day 2 plan generated', day2.success && !!day2.plan);
assert('Rotation Engine', 'Day 3 plan generated', day3.success && !!day3.plan);

if (day1.plan && day2.plan && day3.plan) {
  const day1Foods = new Set(day1.plan.meals.flatMap(m => m.items.map(i => i.foodItem.id)));
  const day2Foods = new Set(day2.plan.meals.flatMap(m => m.items.map(i => i.foodItem.id)));
  const day3Foods = new Set(day3.plan.meals.flatMap(m => m.items.map(i => i.foodItem.id)));

  const combinedUniqueFoods = new Set([...day1Foods, ...day2Foods, ...day3Foods]);
  assert('Diversity Engine', 'Across 3 days, multi-day variety includes at least 15 unique foods', combinedUniqueFoods.size >= 15, `Found ${combinedUniqueFoods.size} unique foods`);

  // Check that Day 2 is not identical to Day 1
  let identicalCount = 0;
  for (const id of day2Foods) {
    if (day1Foods.has(id)) identicalCount++;
  }
  const overlapPct = (identicalCount / day2Foods.size) * 100;
  assert('Diversity Engine', 'Day 2 introduces new distinct food items compared to Day 1', overlapPct < 75, `${overlapPct.toFixed(1)}% overlap`);
}

// 5. Calorie Proximity Validation
console.log('\n--- 5. CALORIE PROXIMITY & MACRO ACCURACY ---');
if (day1.plan) {
  const target = day1.plan.targetTotalCalories;
  const actual = day1.plan.actualTotalCalories;
  const diffPct = (Math.abs(actual - target) / target) * 100;
  assert('Calorie Accuracy', 'Plan calories are within 5% of target', diffPct <= 5.0, `Target: ${target} kcal, Actual: ${actual} kcal (${diffPct.toFixed(2)}% diff)`);
}

// 6. Roti vs Porota Distinction
console.log('\n--- 6. ROTI VS POROTA CULINARY DISTINCTION ---');
const roti = BANGLADESH_FOOD_DATABASE.find(f => f.id === 'grain-08');
const porota = BANGLADESH_FOOD_DATABASE.find(f => f.id === 'grain-09');

assert('Culinary Distinction', 'Roti exists as staple whole-grain bread', !!roti && roti.fatGrams < 3.0, `Roti Fat: ${roti?.fatGrams}g`);
assert('Culinary Distinction', 'Porota exists with realistic higher fat profile', !!porota && porota.fatGrams > 5.0, `Porota Fat: ${porota?.fatGrams}g`);

// 7. Yogurt / Tok Doi Canonicalization & Semantic Group Integrity
console.log('\n--- 7. YOGURT / TOK DOI CANONICALIZATION & SEMANTIC GROUP INTEGRITY ---');
const tokDoi = BANGLADESH_FOOD_DATABASE.find(f => f.id === 'dairy-02');
const duplicateYogurt = BANGLADESH_FOOD_DATABASE.find(f => f.id === 'dairy-03');

assert('Canonicalization', 'Tok Doi is the canonical yogurt entry (dairy-02)', !!tokDoi, `Found: ${tokDoi?.englishName}`);
assert('Canonicalization', 'Tok Doi English name is "Plain Unsweetened Yogurt (Tok Doi)"', tokDoi?.englishName === 'Plain Unsweetened Yogurt (Tok Doi)', tokDoi?.englishName);
assert('Canonicalization', 'Tok Doi Bangla name is "টক দই"', tokDoi?.banglaName === 'টক দই', tokDoi?.banglaName);
assert('Canonicalization', 'Tok Doi has foodGroup "plain_yogurt_curd"', tokDoi?.foodGroup === 'plain_yogurt_curd', tokDoi?.foodGroup);
assert('Canonicalization', 'Tok Doi description mentions naturally fermented with no added sugar', 
  !!tokDoi?.description?.toLowerCase().includes('naturally fermented') && !!tokDoi?.description?.toLowerCase().includes('no added sugar'), 
  tokDoi?.description);
assert('Canonicalization', 'Duplicate Unsweetened Yogurt (dairy-03) is removed from selectable food pool', duplicateYogurt === undefined, 
  duplicateYogurt ? 'dairy-03 still exists' : 'dairy-03 successfully removed');
assert('Canonicalization', 'Tok Doi is non-vegan (dairy safety preserved)', tokDoi?.isVegan === false && tokDoi?.isVegetarian === true, 
  `isVegan: ${tokDoi?.isVegan}, isVegetarian: ${tokDoi?.isVegetarian}`);

// Test Legacy ID Migration & Resolution
import { getCanonicalFoodId, getFoodById, migratePlannedFoodItem, migrateDailyMealPlan } from './data/bangladeshFoodDatabase';
import { checkFoodPairCompatibility } from './utils/mealCoherence';

assert('Migration Engine', 'Legacy ID dairy-03 resolves to canonical dairy-02', getCanonicalFoodId('dairy-03') === 'dairy-02');
const resolvedFromLegacy = getFoodById('dairy-03');
assert('Migration Engine', 'getFoodById("dairy-03") returns canonical Tok Doi item', resolvedFromLegacy?.id === 'dairy-02' && resolvedFromLegacy?.englishName === 'Plain Unsweetened Yogurt (Tok Doi)');

// Test pairwise semantic duplicate rejection
const dummyYogurtB = { ...tokDoi!, id: 'dairy-custom-copy' };
const duplicatePairCheck = checkFoodPairCompatibility(tokDoi!, dummyYogurtB, 'Breakfast');
assert('Semantic Duplicates', 'Pairwise check rejects two foods sharing plain_yogurt_curd group in the same meal', 
  duplicatePairCheck.compatible === false, duplicatePairCheck.reason);

// Test legacy meal plan migration
if (day1.plan) {
  const mockLegacyPlan = JSON.parse(JSON.stringify(day1.plan));
  // Inject a legacy dairy-03 item into mock plan
  mockLegacyPlan.meals[0].items[0].foodItem = {
    id: 'dairy-03',
    englishName: 'Unsweetened Yogurt',
    banglaName: 'চিনি ছাড়া দই',
    category: 'Dairy',
    calories: 85,
  };
  const migratedPlan = migrateDailyMealPlan(mockLegacyPlan);
  const migratedItem = migratedPlan.meals[0].items[0];
  assert('Migration Engine', 'migrateDailyMealPlan smoothly upgrades legacy dairy-03 to canonical Tok Doi (dairy-02)',
    migratedItem.foodItem.id === 'dairy-02' && migratedItem.foodItem.englishName === 'Plain Unsweetened Yogurt (Tok Doi)',
    `Migrated to: ${migratedItem.foodItem.englishName} (${migratedItem.foodItem.id})`);
}

console.log('\n================================================================');
console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
}

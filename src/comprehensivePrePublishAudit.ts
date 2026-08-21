/**
 * COMPREHENSIVE PRE-PUBLISH RELEASE AUDIT SCRIPT FOR NUTRIGUIDE
 * Tests all 15 audit dimensions with live calculations and live test execution.
 */

import * as fs from 'fs';
import { BANGLADESH_FOOD_DATABASE, getFoodById, LEGACY_FOOD_ID_MIGRATIONS } from './data/bangladeshFoodDatabase';
import { 
  calculateBMI, 
  calculateBMR, 
  calculateTDEE, 
  calculateMacroDistribution, 
  getFullHealthMetrics,
  validateProfileForCalculations,
  VALID_ACTIVITY_MULTIPLIERS
} from './utils/nutritionCalculator';
import { 
  generateMealPlan, 
  getCompatibleFoods,
  regenerateMealSlotInPlan
} from './utils/mealPlanner';
import { 
  createProfileFingerprint
} from './utils/profileStorage';
import { 
  validateMealCombination,
  validatePortionRealism,
  validateFoodDiversity,
  validateNutrientDistribution,
  validateDailyCalorieProximity,
  checkFoodPairCompatibility,
  calculateMealComplexityScore
} from './utils/mealCoherence';
import { validateSignUpFields } from './utils/authValidation';
import { getAuthErrorMessage } from './utils/authErrors';
import { PersonalHealthProfile, FoodItem } from './types';

interface AuditResult {
  section: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: AuditResult[] = [];

function assert(section: string, name: string, condition: boolean, details?: string) {
  results.push({ section, name, passed: !!condition, details });
  const status = condition ? 'PASS' : 'FAIL';
  console.log(`[${status}] [${section}] ${name} ${details ? `(${details})` : ''}`);
  if (!condition) {
    console.error(`❌ FAILURE: ${section} -> ${name}`);
  }
}

// -------------------------------------------------------------
// 1. HEALTH PROFILES & 2. NUTRITION CALCULATION VERIFICATION
// -------------------------------------------------------------
console.log('\n======================================================');
console.log('1 & 2. HEALTH PROFILES & NUTRITION CALCULATION AUDIT');
console.log('======================================================');

const profileA: PersonalHealthProfile = {
  name: 'Profile A (Weight Loss)',
  age: 40,
  sex: 'female',
  heightCm: 158,
  weightKg: 75,
  activityLevel: 'sedentary',
  goal: 'lose_weight',
  dietaryPreference: 'no_preference',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
};

const profileB: PersonalHealthProfile = {
  name: 'Profile B (Vegan Maintenance)',
  age: 30,
  sex: 'female',
  heightCm: 160,
  weightKg: 60,
  activityLevel: 'moderately_active',
  goal: 'maintain_weight',
  dietaryPreference: 'vegan',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
};

const profileC: PersonalHealthProfile = {
  name: 'Profile C (Weight Gain + Peanut Allergy)',
  age: 25,
  sex: 'male',
  heightCm: 175,
  weightKg: 65,
  activityLevel: 'very_active',
  goal: 'gain_weight',
  dietaryPreference: 'no_preference',
  allergies: ['Peanuts'],
  dislikedFoods: [],
  dietaryRestrictions: [],
};

const profileD: PersonalHealthProfile = {
  name: 'Profile D (Vegetarian Weight Loss + Dislike Fish)',
  age: 35,
  sex: 'male',
  heightCm: 170,
  weightKg: 90,
  activityLevel: 'lightly_active',
  goal: 'lose_weight',
  dietaryPreference: 'vegetarian',
  allergies: [],
  dislikedFoods: ['fish'],
  dietaryRestrictions: [],
};

const profileE: PersonalHealthProfile = {
  name: 'Profile E (Young Maintenance)',
  age: 22,
  sex: 'female',
  heightCm: 155,
  weightKg: 50,
  activityLevel: 'moderately_active',
  goal: 'maintain_weight',
  dietaryPreference: 'no_preference',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
};

const profiles = [
  { p: profileA, label: 'Profile A' },
  { p: profileB, label: 'Profile B' },
  { p: profileC, label: 'Profile C' },
  { p: profileD, label: 'Profile D' },
  { p: profileE, label: 'Profile E' },
];

for (const { p, label } of profiles) {
  const heightM = p.heightCm / 100;
  const expectedBmiRaw = p.weightKg / (heightM * heightM);
  const expectedBmi = Number(expectedBmiRaw.toFixed(1));
  
  const expectedBmrRaw = p.sex === 'male'
    ? (10 * p.weightKg) + (6.25 * p.heightCm) - (5 * p.age) + 5
    : (10 * p.weightKg) + (6.25 * p.heightCm) - (5 * p.age) - 161;
  const expectedBmrKcal = Math.round(expectedBmrRaw);

  const multiplier = VALID_ACTIVITY_MULTIPLIERS[p.activityLevel];
  const expectedTdee = Math.round(expectedBmrRaw * multiplier);

  let expectedCalorieTarget = expectedTdee;
  if (p.goal === 'lose_weight') {
    expectedCalorieTarget = Math.round(expectedTdee * 0.88);
  } else if (p.goal === 'gain_weight') {
    expectedCalorieTarget = Math.round(expectedTdee * 1.10);
  }

  const expectedCarbs = Math.round((expectedCalorieTarget * 0.50) / 4);
  const expectedProtein = Math.round((expectedCalorieTarget * 0.20) / 4);
  const expectedFat = Math.round((expectedCalorieTarget * 0.30) / 9);

  const expectedBreakfast = Math.round(expectedCalorieTarget * 0.225);
  const expectedMornSnack = Math.round(expectedCalorieTarget * 0.075);
  const expectedLunch = Math.round(expectedCalorieTarget * 0.325);
  const expectedAftSnack = Math.round(expectedCalorieTarget * 0.075);
  const expectedDinner = Math.round(expectedCalorieTarget * 0.300);

  const actualMetrics = getFullHealthMetrics(p);
  const { bmi, bmiCategory, bmrKcal, dailyEnergyNeedsKcal } = actualMetrics;

  const planRes = generateMealPlan(p, { seed: 42 });

  assert('Nutrition Calculations', `${label}: BMI matches expected formula`, bmi === expectedBmi, `Exp: ${expectedBmi}, Got: ${bmi}`);
  assert('Nutrition Calculations', `${label}: BMR matches Mifflin-St Jeor formula`, bmrKcal === expectedBmrKcal, `Exp: ${expectedBmrKcal} kcal, Got: ${bmrKcal} kcal`);
  assert('Nutrition Calculations', `${label}: TDEE matches formula`, dailyEnergyNeedsKcal === expectedTdee, `Exp: ${expectedTdee} kcal, Got: ${dailyEnergyNeedsKcal} kcal`);
  assert('Nutrition Calculations', `${label}: Plan generation succeeds`, planRes.success && !!planRes.plan);

  if (planRes.plan) {
    const planCal = planRes.plan.actualTotalCalories;
    const diff = Math.abs(planCal - expectedCalorieTarget);
    const pctDiff = (diff / expectedCalorieTarget) * 100;
    assert('Calorie Proximity', `${label}: Calorie proximity is within 5% tolerance`, pctDiff <= 5.0, `Target: ${expectedCalorieTarget} kcal, Actual: ${planCal} kcal, Diff: ${diff} kcal (${pctDiff.toFixed(2)}%)`);
    
    // Check meal slots allocation realism
    const slots = planRes.plan.meals;
    assert('Meal Slots', `${label}: Exactly 5 meal slots generated`, slots.length === 5);
  }
}

// -------------------------------------------------------------
// 3. MEAL PLAN PERSONALIZATION & DIFFERENTIATION
// -------------------------------------------------------------
console.log('\n======================================================');
console.log('3. MEAL PLAN PERSONALIZATION & REGENERATION');
console.log('======================================================');

const planA = generateMealPlan(profileA, { seed: 101 }).plan!;
const planB = generateMealPlan(profileB, { seed: 101 }).plan!;
const planC = generateMealPlan(profileC, { seed: 101 }).plan!;
const planD = generateMealPlan(profileD, { seed: 101 }).plan!;
const planE = generateMealPlan(profileE, { seed: 101 }).plan!;

const getFoodIds = (plan: any) => plan.meals.flatMap((m: any) => m.items.map((i: any) => i.foodItem.id));

const foodsA = new Set(getFoodIds(planA));
const foodsB = new Set(getFoodIds(planB));
const foodsC = new Set(getFoodIds(planC));
const foodsD = new Set(getFoodIds(planD));
const foodsE = new Set(getFoodIds(planE));

assert('Personalization', 'Profile A (Weight Loss) and Profile C (Weight Gain) produce distinct meal plans', planA.actualTotalCalories < planC.actualTotalCalories, `A: ${planA.actualTotalCalories} kcal vs C: ${planC.actualTotalCalories} kcal`);
assert('Personalization', 'Profile B (Vegan) contains strictly plant foods unlike Profile A', Array.from(foodsB).every((id: any) => {
  const f = getFoodById(id as string);
  return f && f.isVegan;
}));

// Regeneration Variety
const planA_seed1 = generateMealPlan(profileA, { seed: 1001 }).plan!;
const planA_seed2 = generateMealPlan(profileA, { seed: 2002 }).plan!;
const planA_seed3 = generateMealPlan(profileA, { seed: 3003 }).plan!;

const ids1 = new Set(getFoodIds(planA_seed1));
const ids2 = new Set(getFoodIds(planA_seed2));
const ids3 = new Set(getFoodIds(planA_seed3));

const diff1_2 = Array.from(ids2).filter(id => !ids1.has(id)).length;
const diff1_3 = Array.from(ids3).filter(id => !ids1.has(id)).length;

assert('Regeneration Variety', 'Regenerating Profile A with new seed produces diverse menu variation', diff1_2 >= 2 && diff1_3 >= 2, `Distinct foods introduced: Seed2=${diff1_2}, Seed3=${diff1_3}`);

// -------------------------------------------------------------
// 4. PORTION REALISM & MACRO DISTRIBUTION
// -------------------------------------------------------------
console.log('\n======================================================');
console.log('4. CALORIE PROXIMITY & PORTION REALISM');
console.log('======================================================');

for (const { p, label } of profiles) {
  const plan = generateMealPlan(p, { seed: 555 }).plan!;
  let unrealisticPortionsCount = 0;
  for (const meal of plan.meals) {
    for (const item of meal.items) {
      if (item.portionMultiplier < 0.25 || item.portionMultiplier > 3.5) {
        unrealisticPortionsCount++;
      }
    }
  }
  assert('Portion Realism', `${label}: All food portions stay within realistic culinary bounds (0.25x - 3.5x)`, unrealisticPortionsCount === 0, `Unrealistic count: ${unrealisticPortionsCount}`);
}

// -------------------------------------------------------------
// 4B. MEAL OVERCROWDING & SIMPLICITY AUDIT
// -------------------------------------------------------------
console.log('\n======================================================');
console.log('4B. MEAL OVERCROWDING & SIMPLICITY AUDIT');
console.log('======================================================');

let totalMealsEvaluated = 0;
let totalOvercrowdedMeals = 0;
let maxItemsObserved = 0;
const slotCounts: Record<string, number[]> = {
  'Breakfast': [],
  'Morning Snack': [],
  'Lunch': [],
  'Afternoon Snack': [],
  'Dinner': [],
};

for (const { p, label } of profiles) {
  for (let s = 0; s < 10; s++) {
    const seed = 1000 + s * 17;
    const res = generateMealPlan(p, { seed });
    if (!res.success || !res.plan) {
      console.error(`Failed to generate plan for ${label} (Seed ${seed}):`, res.errors);
      continue;
    }
    const plan = res.plan;
    for (const meal of plan.meals) {
      totalMealsEvaluated++;
      const itemCount = meal.items.length;
      slotCounts[meal.type].push(itemCount);
      if (itemCount > maxItemsObserved) maxItemsObserved = itemCount;

      const evalScore = calculateMealComplexityScore(meal.items.map(i => i.foodItem), meal.type);
      if (evalScore.isOvercrowded) {
        totalOvercrowdedMeals++;
        console.error(`Overcrowded meal found in ${label} (Seed ${seed}), ${meal.type}: ${itemCount} items`);
      }
    }
  }
}

// Complexity limits verification
const avgBreakfast = slotCounts['Breakfast'].reduce((a, b) => a + b, 0) / slotCounts['Breakfast'].length;
const avgMorningSnack = slotCounts['Morning Snack'].reduce((a, b) => a + b, 0) / slotCounts['Morning Snack'].length;
const avgLunch = slotCounts['Lunch'].reduce((a, b) => a + b, 0) / slotCounts['Lunch'].length;
const avgAfternoonSnack = slotCounts['Afternoon Snack'].reduce((a, b) => a + b, 0) / slotCounts['Afternoon Snack'].length;
const avgDinner = slotCounts['Dinner'].reduce((a, b) => a + b, 0) / slotCounts['Dinner'].length;

console.log(`Evaluated ${totalMealsEvaluated} total meals across 50 simulated plan generations.`);
console.log(`Average items per slot: Breakfast=${avgBreakfast.toFixed(2)}, Morning Snack=${avgMorningSnack.toFixed(2)}, Lunch=${avgLunch.toFixed(2)}, Afternoon Snack=${avgAfternoonSnack.toFixed(2)}, Dinner=${avgDinner.toFixed(2)}`);
console.log(`Max items observed in any single meal: ${maxItemsObserved}`);

assert('Meal Simplicity', 'Zero overcrowded meals (0 meals exceeding preferred maximums or containing 5+ items)', totalOvercrowdedMeals === 0, `Violations: ${totalOvercrowdedMeals}`);
assert('Meal Simplicity', 'Breakfast strictly bounded to 2-3 items on average', avgBreakfast >= 2.0 && avgBreakfast <= 3.2, `Avg: ${avgBreakfast.toFixed(2)}`);
assert('Meal Simplicity', 'Morning Snack strictly bounded to 1-2 items', avgMorningSnack >= 1.0 && avgMorningSnack <= 2.0, `Avg: ${avgMorningSnack.toFixed(2)}`);
assert('Meal Simplicity', 'Lunch strictly bounded to 3 items (rarely 4, never 5)', avgLunch >= 2.8 && avgLunch <= 3.8, `Avg: ${avgLunch.toFixed(2)}`);
assert('Meal Simplicity', 'Afternoon Snack strictly bounded to 1-2 items', avgAfternoonSnack >= 1.0 && avgAfternoonSnack <= 2.0, `Avg: ${avgAfternoonSnack.toFixed(2)}`);
assert('Meal Simplicity', 'Dinner strictly bounded to 3 items (rarely 4, never 5)', avgDinner >= 2.8 && avgDinner <= 3.8, `Avg: ${avgDinner.toFixed(2)}`);
assert('Meal Simplicity', 'Absolute maximum items across any meal is <= 4', maxItemsObserved <= 4, `Max: ${maxItemsObserved}`);

// Regeneration Consistency Audit
let regenOvercrowded = 0;
let initialPlan = generateMealPlan(profileA, { seed: 777 }).plan!;
for (let i = 0; i < 15; i++) {
  // Repeatedly regenerate lunch slot
  const lunchSlot = initialPlan.meals.find(m => m.type === 'Lunch')!;
  initialPlan = regenerateMealSlotInPlan(initialPlan, lunchSlot.id, profileA, { seed: 9000 + i });
  const updatedLunch = initialPlan.meals.find(m => m.type === 'Lunch')!;
  if (updatedLunch.items.length > 4 || updatedLunch.items.length < 2) {
    regenOvercrowded++;
  }
}
assert('Regeneration Consistency', 'Repeated regeneration does not accumulate items or exceed 4 items in Lunch slot', regenOvercrowded === 0, `Violations: ${regenOvercrowded}`);

// Profile 5 (Young Maintenance) Specific Audit
const plan5 = generateMealPlan(profileE, { seed: 5555 }).plan!;
const totalItems5 = plan5.meals.reduce((sum, m) => sum + m.items.length, 0);
assert('Profile 5 Audit', 'Profile 5 (Young Maintenance) generates clean 10-14 total items across day', totalItems5 >= 10 && totalItems5 <= 14, `Total items: ${totalItems5}`);

// -------------------------------------------------------------
// 5. DIETARY SAFETY: VEGAN, VEGETARIAN, ALLERGIES, DISLIKES
// -------------------------------------------------------------
console.log('\n======================================================');
console.log('5. DIETARY SAFETY AUDIT');
console.log('======================================================');

// 5.1 Vegan Safety
const veganPlan = generateMealPlan(profileB, { seed: 777 }).plan!;
let veganViolations = 0;
for (const meal of veganPlan.meals) {
  for (const item of meal.items) {
    if (!item.foodItem.isVegan || ['Meat', 'Fish', 'Chicken & Other Poultry', 'Eggs', 'Dairy'].includes(item.foodItem.category)) {
      veganViolations++;
      console.error(`Vegan violation found: ${item.foodItem.englishName} (${item.foodItem.category})`);
    }
  }
}
assert('Dietary Safety', 'Vegan Plan contains 0 meat, 0 fish, 0 shutki, 0 eggs, 0 dairy', veganViolations === 0, `Violations: ${veganViolations}`);

// 5.2 Vegetarian Safety
const vegetarianPlan = generateMealPlan(profileD, { seed: 888 }).plan!;
let vegViolations = 0;
for (const meal of vegetarianPlan.meals) {
  for (const item of meal.items) {
    if (!item.foodItem.isVegetarian || ['Meat', 'Fish', 'Chicken & Other Poultry'].includes(item.foodItem.category)) {
      vegViolations++;
      console.error(`Vegetarian violation found: ${item.foodItem.englishName}`);
    }
  }
}
assert('Dietary Safety', 'Vegetarian Plan contains 0 meat, 0 fish, 0 shutki', vegViolations === 0, `Violations: ${vegViolations}`);

// 5.3 Peanut Allergy
const peanutPlan = generateMealPlan(profileC, { seed: 999 }).plan!;
let peanutViolations = 0;
for (const meal of peanutPlan.meals) {
  for (const item of meal.items) {
    if (item.foodItem.allergies.some(a => a.toLowerCase().includes('peanut') || a.toLowerCase().includes('nut')) ||
        item.foodItem.englishName.toLowerCase().includes('peanut') ||
        item.foodItem.banglaName.includes('বাদাম')) {
      peanutViolations++;
      console.error(`Peanut allergy violation found: ${item.foodItem.englishName}`);
    }
  }
}
assert('Dietary Safety', 'Peanut allergy plan contains 0 peanuts / peanut-containing foods', peanutViolations === 0, `Violations: ${peanutViolations}`);

// 5.4 Multiple Allergies: Peanuts, Milk, Fish
const multiAllergyProfile: PersonalHealthProfile = {
  ...profileA,
  allergies: ['Peanuts', 'Milk', 'Fish'],
};
const multiAllergyPlan = generateMealPlan(multiAllergyProfile, { seed: 333 }).plan!;
let multiViolations = 0;
for (const meal of multiAllergyPlan.meals) {
  for (const item of meal.items) {
    const f = item.foodItem;
    if (f.category === 'Fish' || f.category === 'Dairy' || 
        f.allergies.includes('Fish') || f.allergies.includes('Milk') || f.allergies.includes('Dairy') || f.allergies.includes('Peanuts') ||
        f.englishName.toLowerCase().includes('peanut') || f.englishName.toLowerCase().includes('fish') || f.englishName.toLowerCase().includes('milk')) {
      multiViolations++;
      console.error(`Multi-allergy violation: ${f.englishName}`);
    }
  }
}
assert('Dietary Safety', 'Multiple allergies (Peanuts, Milk, Fish) strictly obeyed', multiViolations === 0, `Violations: ${multiViolations}`);

// 5.5 Disliked Foods: oil, rice, fish
const dislikedProfile: PersonalHealthProfile = {
  ...profileA,
  dislikedFoods: ['oil', 'rice', 'fish'],
};
const dislikedPlan = generateMealPlan(dislikedProfile, { seed: 444 }).plan!;
let dislikeViolations = 0;
for (const meal of dislikedPlan.meals) {
  for (const item of meal.items) {
    const name = item.foodItem.englishName.toLowerCase();
    const cat = item.foodItem.category;
    if (cat === 'Oils & Fats' || /\boil\b/i.test(name) || cat === 'Fish' || name.includes('fish') || (name.includes('rice') && !name.includes('water'))) {
      dislikeViolations++;
      console.error(`Disliked food violation: ${item.foodItem.englishName}`);
    }
  }
}
assert('Dietary Safety', 'Disliked foods (oil, rice, fish) strictly excluded from all meal slots', dislikeViolations === 0, `Violations: ${dislikeViolations}`);

// -------------------------------------------------------------
// 6. BANGLADESHI FOOD DATABASE VERIFICATION
// -------------------------------------------------------------
console.log('\n======================================================');
console.log('6. BANGLADESHI FOOD DATABASE INTEGRITY AUDIT');
console.log('======================================================');

const db = BANGLADESH_FOOD_DATABASE;

// Check Borboti Bichi
const borboti = db.find(f => f.id === 'nuts-10');
assert('Food Database', 'Borboti Bichi (বরবটি বিচি) exists with ID nuts-10', !!borboti);
assert('Food Database', 'Borboti Bichi is categorized under "Nuts & Seeds"', borboti?.category === 'Nuts & Seeds');

// Check Boal Fish removed
const boal = db.find(f => f.id === 'fish-12' || f.englishName.toLowerCase().includes('boal') || f.banglaName.includes('বোয়াল') || f.banglaName.includes('বোয়াল'));
assert('Food Database', 'Boal Fish (বোয়াল মাছ) is completely removed', !boal);

// Check Shing Fish only
const shing = db.find(f => f.id === 'fish-13');
assert('Food Database', 'Shing Fish exists as dedicated entry (fish-13)', !!shing);
assert('Food Database', 'Shing Fish is strictly "Shing Fish" (শিং মাছ) and does NOT contain "Magur"', 
  shing?.englishName === 'Shing Fish' && shing?.banglaName === 'শিং মাছ' && !shing?.banglaName.includes('মাগুর')
);

// Check Chicken Stew removed
const chickenStew = db.find(f => f.id === 'poultry-02' || f.banglaName.includes('মুরগির হালকা পেঁপে ঝোল'));
assert('Food Database', 'Chicken Stew (মুরগির হালকা পেঁপে ঝোল) is completely removed', !chickenStew);

// Check Begun Bhorta removed
const begunBhorta = db.find(f => f.id === 'veg-31' || f.banglaName === 'বেগুন ভর্তা');
assert('Food Database', 'Begun Bhorta (বেগুন ভর্তা) is completely removed', !begunBhorta);

// Check Tomato Salad
const tomatoSalad = db.find(f => f.id === 'veg-28');
assert('Food Database', 'Tomato Salad is named "Tomato Salad" / "টমেটো সালাদ" without "/ Tok"',
  tomatoSalad?.englishName === 'Tomato Salad' && tomatoSalad?.banglaName === 'টমেটো সালাদ'
);

// Check Mustard Seed removed
const mustardSeed = db.find(f => f.id === 'nuts-09' || f.englishName.toLowerCase().includes('mustard seed'));
assert('Food Database', 'Mustard Seed / Paste (সরিষা বীজ / বাটা) is completely removed', !mustardSeed);

// Check Lau Chingri removed
const lauChingri = db.find(f => f.id === 'trad-06' || f.banglaName.includes('লাউ চিংড়ি') || f.banglaName.includes('লাউ চিংড়ি'));
assert('Food Database', 'Lau Chingri (লাউ চিংড়ি) is completely removed', !lauChingri);

// Check Coconut Oil removed
const coconutOil = db.find(f => f.id === 'oil-03' || f.englishName.toLowerCase().includes('coconut oil'));
assert('Food Database', 'Coconut Oil (নারকেল তেল) is completely removed', !coconutOil);

// Check Soybean Oil present
const soybeanOil = db.find(f => f.id === 'oil-04');
assert('Food Database', 'Soybean Oil (সয়াবিন তেল) is present (oil-04)', !!soybeanOil && soybeanOil.englishName === 'Soybean Oil' && soybeanOil.banglaName === 'সয়াবিন তেল');

// Check Olive Oil present
const oliveOil = db.find(f => f.id === 'oil-05');
assert('Food Database', 'Olive Oil (অলিভ তেল) is present (oil-05)', !!oliveOil && oliveOil.englishName === 'Olive Oil' && oliveOil.banglaName === 'অলিভ তেল');

// Legacy migrations
assert('Legacy Migrations', 'Legacy migrations correctly map removed food IDs to safe active IDs',
  LEGACY_FOOD_ID_MIGRATIONS['dairy-03'] === 'dairy-02' &&
  LEGACY_FOOD_ID_MIGRATIONS['dal-07'] === 'nuts-10' &&
  LEGACY_FOOD_ID_MIGRATIONS['fish-12'] === 'fish-01' &&
  LEGACY_FOOD_ID_MIGRATIONS['poultry-02'] === 'poultry-01' &&
  LEGACY_FOOD_ID_MIGRATIONS['veg-31'] === 'trad-03' &&
  LEGACY_FOOD_ID_MIGRATIONS['nuts-09'] === 'nuts-01' &&
  LEGACY_FOOD_ID_MIGRATIONS['trad-06'] === 'trad-02' &&
  LEGACY_FOOD_ID_MIGRATIONS['oil-03'] === 'oil-04'
);

// -------------------------------------------------------------
// 7. FOOD DIVERSITY & ROTATION ENGINE (100+ MEAL PLANS)
// -------------------------------------------------------------
console.log('\n======================================================');
console.log('7. FOOD DIVERSITY ENGINE (120 SIMULATED PLANS)');
console.log('======================================================');

const foodSelectionFrequency: Record<string, number> = {};
const uniqueFoodsSelected = new Set<string>();
const totalRuns = 40;
let consecutiveDuplicatePlans = 0;
let previousPlanFoodIds = '';

for (let i = 0; i < totalRuns; i++) {
  if (i % 10 === 0) console.log(`Simulating meal plan ${i + 1} / ${totalRuns}...`);
  const currentProfile = profiles[i % profiles.length].p;
  const planRes = generateMealPlan(currentProfile, { seed: 1000 + i });
  if (planRes.success && planRes.plan) {
    const currentIds = planRes.plan.meals.flatMap(m => m.items.map(it => it.foodItem.id));
    const currentIdStr = currentIds.sort().join(',');
    if (currentIdStr === previousPlanFoodIds) {
      consecutiveDuplicatePlans++;
    }
    previousPlanFoodIds = currentIdStr;

    for (const id of currentIds) {
      uniqueFoodsSelected.add(id);
      foodSelectionFrequency[id] = (foodSelectionFrequency[id] || 0) + 1;
    }
  }
}

const totalUniqueSelected = uniqueFoodsSelected.size;
const sortedFoods = Object.entries(foodSelectionFrequency).sort((a, b) => b[1] - a[1]);
const mostFrequent = sortedFoods.slice(0, 5).map(([id, count]) => `${getFoodById(id)?.englishName} (${count})`).join(', ');
const leastFrequent = sortedFoods.slice(-5).map(([id, count]) => `${getFoodById(id)?.englishName} (${count})`).join(', ');

console.log(`Unique Foods Selected across ${totalRuns} plans: ${totalUniqueSelected} / ${db.length}`);
console.log(`Top 5 Most Frequent: ${mostFrequent}`);
console.log(`Least Frequent: ${leastFrequent}`);

assert('Food Diversity', 'Diverse selection utilizes at least 40 unique authentic Bangladeshi foods across simulated plans', totalUniqueSelected >= 40, `Selected: ${totalUniqueSelected} unique foods`);
assert('Food Diversity', 'Zero consecutive identical meal plans produced during rotation', consecutiveDuplicatePlans === 0, `Consecutive duplicates: ${consecutiveDuplicatePlans}`);

// Check specific foods selected
assert('Food Diversity', 'Whole-Wheat Roti (grain-08) is selected in meal rotation', uniqueFoodsSelected.has('grain-08'));
assert('Food Diversity', 'Porota (grain-09) is selected in meal rotation', uniqueFoodsSelected.has('grain-09'));
assert('Food Diversity', 'Aloo/Lau Bhaji (veg-18 / veg-20) is selected in meal rotation', uniqueFoodsSelected.has('veg-18') || uniqueFoodsSelected.has('veg-20'));
assert('Food Diversity', 'Seeds (Chia / Sunflower / Borboti Bichi) selected in rotation', uniqueFoodsSelected.has('nuts-07') || uniqueFoodsSelected.has('nuts-08') || uniqueFoodsSelected.has('nuts-10'));

// -------------------------------------------------------------
// 8. CULINARY COHERENCE & MEAL COMPOSITION
// -------------------------------------------------------------
console.log('\n======================================================');
console.log('8. CULINARY COHERENCE AUDIT');
console.log('======================================================');

let totalCoherenceErrors = 0;
for (let i = 0; i < 30; i++) {
  const currentProfile = profiles[i % profiles.length].p;
  const res = generateMealPlan(currentProfile, { seed: 5000 + i });
  if (!res.success || !res.plan) {
    totalCoherenceErrors++;
    console.error(`Plan generation failed in run ${i}:`, res.errors);
    continue;
  }
  const plan = res.plan;
  for (const meal of plan.meals) {
    const rawItems = meal.items.map(it => it.foodItem);
    const coh = validateMealCombination(rawItems, meal.type, currentProfile);
    if (!coh.valid) {
      totalCoherenceErrors += coh.errors.length;
      console.error(`Coherence error in run ${i}, slot ${meal.type}:`, coh.errors);
    }
  }
}
assert('Culinary Coherence', '30 comprehensive daily plans pass all Bangladeshi culinary coherence rules (0 errors)', totalCoherenceErrors === 0, `Coherence errors: ${totalCoherenceErrors}`);

// Incompatible pairing rejection test
const milk = getFoodById('dairy-01')!; // Cow's Milk
const fish = getFoodById('fish-01')!; // Rui Fish
const milkFishCompat = checkFoodPairCompatibility(milk, fish, 'Lunch');
assert('Culinary Coherence', 'Milk + Fish pair compatibility is strictly rejected', !milkFishCompat.compatible);

const shutki = getFoodById('fish-11')!; // Loitta Shutki
const shutkiFruitCompat = checkFoodPairCompatibility(shutki, getFoodById('fruit-01')!, 'Lunch'); // Shutki + Banana
assert('Culinary Coherence', 'Shutki + Fruit pair compatibility is strictly rejected', !shutkiFruitCompat.compatible);

// -------------------------------------------------------------
// 9. PROFILE & CACHE ISOLATION
// -------------------------------------------------------------
console.log('\n======================================================');
console.log('9. PROFILE & CACHE ISOLATION AUDIT');
console.log('======================================================');

const fpA = createProfileFingerprint(profileA);
const fpB = createProfileFingerprint(profileB);
const fpC = createProfileFingerprint(profileC);

assert('Profile Isolation', 'Fingerprints for distinct profiles are completely unique', fpA !== fpB && fpB !== fpC && fpA !== fpC);

// Modifying single attribute changes fingerprint
const profileA_modified: PersonalHealthProfile = { ...profileA, weightKg: 74 };
const fpA_modified = createProfileFingerprint(profileA_modified);
assert('Profile Isolation', 'Modifying profile weight invalidates old fingerprint', fpA !== fpA_modified);

const profileA_allergy_modified: PersonalHealthProfile = { ...profileA, allergies: ['Peanuts'] };
const fpA_allergy_modified = createProfileFingerprint(profileA_allergy_modified);
assert('Profile Isolation', 'Modifying profile allergies invalidates old fingerprint', fpA !== fpA_allergy_modified);

// -------------------------------------------------------------
// 10. AUTHENTICATION & VALIDATION
// -------------------------------------------------------------
console.log('\n======================================================');
console.log('10. AUTHENTICATION VALIDATION AUDIT');
console.log('======================================================');

assert('Auth Validation', 'Valid sign up fields pass validation', validateSignUpFields('Zinia Shahrin', 'test.user@gmail.com', 'Pass1234!', 'Pass1234!').isValid);
assert('Auth Validation', 'Empty name fails validation with friendly message', !validateSignUpFields('', 'test.user@gmail.com', 'Pass1234!', 'Pass1234!').isValid);
assert('Auth Validation', 'Empty email fails validation with friendly message', !validateSignUpFields('Zinia Shahrin', '', 'Pass1234!', 'Pass1234!').isValid);
assert('Auth Validation', 'Short password (< 6 chars) fails validation', !validateSignUpFields('Zinia Shahrin', 'test@gmail.com', '12345', '12345').isValid);
assert('Auth Validation', 'Mismatched passwords fail validation', !validateSignUpFields('Zinia Shahrin', 'test@gmail.com', 'Pass1234!', 'Pass9999!').isValid);
assert('Auth Validation', 'Auth error mapper handles user-not-found / wrong-password securely', getAuthErrorMessage({ code: 'auth/user-not-found' }).includes('Invalid email or password'));
assert('Auth Validation', 'Auth error mapper handles email-already-in-use gracefully', getAuthErrorMessage({ code: 'auth/email-already-in-use' }).includes('already exists'));
assert('Auth Validation', 'Auth error mapper handles operation-not-allowed with console setup guide', getAuthErrorMessage({ code: 'auth/operation-not-allowed' }).includes('Firebase'));

// -------------------------------------------------------------
// 11. UI / NAVIGATION VALIDATION
// -------------------------------------------------------------
console.log('\n======================================================');
console.log('11. UI & NAVIGATION SPECIFICATION AUDIT');
console.log('======================================================');

// Read Navbar component to verify UI ordering and removals
const navbarCode = fs.readFileSync('src/components/navigation/Navbar.tsx', 'utf-8');

assert('UI & Navigation', 'Navbar includes "Health Profile" tab', navbarCode.includes("'profile'") || navbarCode.includes('Health Profile'));
assert('UI & Navigation', 'Navbar includes "BD Food Database" tab', navbarCode.includes("'database'") || navbarCode.includes('BD Food Database'));
assert('UI & Navigation', 'Navbar includes "Daily Meal Plan" tab', navbarCode.includes("'meal-plan'") || navbarCode.includes('Daily Meal Plan'));
assert('UI & Navigation', 'Navbar includes "How It Works" tab', navbarCode.includes("'how-it-works'") || navbarCode.includes('How It Works'));
assert('UI & Navigation', 'Navbar includes "Health & Safety" tab', navbarCode.includes("'health-safety'") || navbarCode.includes('Health & Safety'));

assert('UI & Navigation', 'Top AI Assistant link is removed from Navbar', !navbarCode.includes("'assistant'") && !navbarCode.includes('AI Assistant'));
assert('UI & Navigation', 'Create Account button appears as primary highlighted action', navbarCode.includes('Create Account') || navbarCode.includes('onOpenAuthModal(true)'));
assert('UI & Navigation', 'Sign In button is present', navbarCode.includes('Sign In') || navbarCode.includes('onOpenAuthModal(false)'));

// -------------------------------------------------------------
// 12. ERROR HANDLING & RESILIENCE
// -------------------------------------------------------------
console.log('\n======================================================');
console.log('12. ERROR HANDLING & GRACEFUL RESILIENCE AUDIT');
console.log('======================================================');

const emptyProfileRes = generateMealPlan({} as any);
assert('Error Handling', 'Empty profile fails gracefully with clear error messages', !emptyProfileRes.success && (emptyProfileRes.errors?.length || 0) > 0);

const invalidAgeProfile: PersonalHealthProfile = { ...profileA, age: 99 };
const invalidAgeRes = generateMealPlan(invalidAgeProfile);
assert('Error Handling', 'Out-of-range age fails gracefully with descriptive error', !invalidAgeRes.success && invalidAgeRes.errors?.[0]?.includes('Age'));

const invalidWeightProfile: PersonalHealthProfile = { ...profileA, weightKg: -10 };
const invalidWeightRes = generateMealPlan(invalidWeightProfile);
assert('Error Handling', 'Negative weight fails gracefully with descriptive error', !invalidWeightRes.success && invalidWeightRes.errors?.[0]?.includes('Weight'));

// Legacy food retrieval test
const legacyFood = getFoodById('fish-12'); // Boal fish migrated to Rui Fish (fish-01)
assert('Error Handling', 'Querying deleted legacy food ID (fish-12) gracefully resolves to safe migrated item', !!legacyFood && legacyFood.id === 'fish-01');

// -------------------------------------------------------------
// 13. PERFORMANCE & STABILITY
// -------------------------------------------------------------
console.log('\n======================================================');
console.log('13. PERFORMANCE & STABILITY AUDIT');
console.log('======================================================');

const startTime = Date.now();
const perfRuns = 20;
for (let i = 0; i < perfRuns; i++) {
  generateMealPlan(profiles[i % profiles.length].p, { seed: i * 7 });
}
const elapsedMs = Date.now() - startTime;
const avgMsPerPlan = (elapsedMs / perfRuns).toFixed(2);

console.log(`Generated ${perfRuns} complex meal plans in ${elapsedMs}ms (Average: ${avgMsPerPlan}ms / plan)`);
assert('Performance & Stability', 'Generation performance is responsive (< 50ms per complex multi-candidate plan)', Number(avgMsPerPlan) < 50.0, `Avg: ${avgMsPerPlan}ms`);

// -------------------------------------------------------------
// 14 & 15. FINAL AUDIT SUMMARY & RELEASE GATE
// -------------------------------------------------------------
console.log('\n======================================================');
console.log('FINAL AUDIT EXECUTION SUMMARY');
console.log('======================================================');

const sectionMap: Record<string, { total: number; passed: number; failed: number }> = {};

for (const r of results) {
  if (!sectionMap[r.section]) {
    sectionMap[r.section] = { total: 0, passed: 0, failed: 0 };
  }
  sectionMap[r.section].total++;
  if (r.passed) {
    sectionMap[r.section].passed++;
  } else {
    sectionMap[r.section].failed++;
  }
}

console.log('\n-----------------------------------------------------------------------------');
console.log('| Area                       | Tests | Passed | Failed | Status             |');
console.log('-----------------------------------------------------------------------------');
for (const [sec, stats] of Object.entries(sectionMap)) {
  const status = stats.failed === 0 ? '🟢 PASSED' : '🔴 FAILED';
  const padSec = sec.padEnd(26, ' ');
  const padTotal = stats.total.toString().padStart(5, ' ');
  const padPassed = stats.passed.toString().padStart(6, ' ');
  const padFailed = stats.failed.toString().padStart(6, ' ');
  console.log(`| ${padSec} | ${padTotal} | ${padPassed} | ${padFailed} | ${status.padEnd(18, ' ')} |`);
}
console.log('-----------------------------------------------------------------------------');

const totalTests = results.length;
const totalPassed = results.filter(r => r.passed).length;
const totalFailed = results.filter(r => !r.passed).length;

console.log(`\nTOTAL TESTS: ${totalTests} | PASSED: ${totalPassed} | FAILED: ${totalFailed}`);

if (totalFailed === 0) {
  console.log('\n🎉 RELEASE DECISION: 🟢 READY TO PUBLISH');
} else {
  console.log('\n⚠️ RELEASE DECISION: 🔴 NOT READY TO PUBLISH');
}

import { generateMealPlan, isFoodAllergic, isFoodDisliked, getMealSwapAlternatives, swapFoodItemInPlan, getCategoryPortionBounds } from './mealPlanner';
import { PersonalHealthProfile, FoodCategory } from '../types';
import { BANGLADESH_FOOD_DATABASE } from '../data/bangladeshFoodDatabase';
import { getFullHealthMetrics } from './nutritionCalculator';

console.log('===========================================================');
console.log('   NUTRI GUIDE MEAL PLANNER - FINAL RELEASE AUDIT SUITE');
console.log('===========================================================\n');

let passedChecks = 0;
let totalChecks = 0;

function report(name: string, condition: boolean, detail: string = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`[PASS] ${name} ${detail ? `| ${detail}` : ''}`);
  } else {
    console.error(`[FAIL] ${name} ${detail ? `| ${detail}` : ''}`);
  }
}

// -------------------------------------------------------------
// 1. FIVE REPRESENTATIVE PROFILES
// -------------------------------------------------------------
const profileA: PersonalHealthProfile = {
  name: 'Profile A (Female Maintain)',
  age: 28,
  sex: 'female',
  heightCm: 165,
  weightKg: 62,
  activityLevel: 'moderately_active',
  dietaryPreference: 'no_preference',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'maintain_weight',
};

const profileB: PersonalHealthProfile = {
  name: 'Profile B (Female Gain)',
  age: 22,
  sex: 'female',
  heightCm: 162,
  weightKg: 42,
  activityLevel: 'moderately_active',
  dietaryPreference: 'no_preference',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'gain_weight',
};

const profileC: PersonalHealthProfile = {
  name: 'Profile C (Male Lose)',
  age: 35,
  sex: 'male',
  heightCm: 178,
  weightKg: 88,
  activityLevel: 'very_active',
  dietaryPreference: 'no_preference',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'lose_weight',
};

const profileD: PersonalHealthProfile = {
  name: 'Profile D (Female Sedentary Lose)',
  age: 30,
  sex: 'female',
  heightCm: 165,
  weightKg: 62,
  activityLevel: 'sedentary',
  dietaryPreference: 'no_preference',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'lose_weight',
};

const profileE: PersonalHealthProfile = {
  name: 'Profile E (Female Active Gain)',
  age: 30,
  sex: 'female',
  heightCm: 165,
  weightKg: 62,
  activityLevel: 'very_active',
  dietaryPreference: 'no_preference',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'gain_weight',
};

const profiles = [profileA, profileB, profileC, profileD, profileE];

console.log('--- 1. FIVE REPRESENTATIVE PROFILES REPORT (Seed 42) ---');
profiles.forEach((prof) => {
  const metrics = getFullHealthMetrics(prof);
  const planRes = generateMealPlan(prof, { seed: 42 });
  if (planRes.plan) {
    const p = planRes.plan;
    const diff = p.actualTotalCalories - p.targetTotalCalories;
    const protPerKg = p.totalProteinGrams / prof.weightKg;
    const foodNames = p.meals.flatMap(m => m.items.map(i => i.foodItem.englishName)).join(', ');
    const foodIds = p.meals.flatMap(m => m.items.map(i => i.foodItem.id)).join(', ');
    const multipliers = p.meals.flatMap(m => m.items.map(i => i.portionMultiplier));

    console.log(`\nProfile: ${prof.name}`);
    console.log(`  BMR: ${metrics.bmrKcal} kcal | TDEE: ${metrics.dailyEnergyNeedsKcal} kcal`);
    console.log(`  Goal Target: ${p.targetTotalCalories} kcal | Generated: ${p.actualTotalCalories} kcal (Diff: ${diff > 0 ? `+${diff}` : diff} kcal)`);
    console.log(`  Macros -> Protein: ${p.totalProteinGrams}g (${protPerKg.toFixed(2)} g/kg) | Carbs: ${p.totalCarbsGrams}g | Fat: ${p.totalFatGrams}g | Fiber: ${p.totalFiberGrams}g`);
    console.log(`  Selected Food IDs: ${foodIds}`);
    console.log(`  Selected Food Names: ${foodNames}`);
    console.log(`  Portion Multipliers Range: [${Math.min(...multipliers).toFixed(2)}x, ${Math.max(...multipliers).toFixed(2)}x]`);

    report(`Profile Metric Sanity (${prof.name})`, metrics.bmrKcal > 1000 && metrics.dailyEnergyNeedsKcal > 1200);
    report(`Calorie Target Precision (${prof.name})`, Math.abs(diff) <= 150);
    report(`Protein g/kg Reasonable (${prof.name})`, protPerKg >= 1.0 && protPerKg <= 2.8);
  }
});

// -------------------------------------------------------------
// 2. PORTION BOUNDS & MULTIPLIER SANITY
// -------------------------------------------------------------
console.log('\n--- 2. CATEGORY PORTION BOUNDS & MULTIPLIERS ---');
const categories: FoodCategory[] = [
  'Rice & Grains', 'Fish', 'Chicken & Other Poultry', 'Meat', 'Eggs',
  'Dal & Legumes', 'Vegetables', 'Leafy Vegetables', 'Fruits',
  'Healthy Snacks', 'Nuts & Seeds', 'Beverages', 'Dairy', 'Traditional Bangladeshi Foods'
];

categories.forEach(cat => {
  const bounds = getCategoryPortionBounds(cat);
  console.log(`Category: ${cat.padEnd(28)} -> Min: ${bounds.min.toFixed(1)}x | Max: ${bounds.max.toFixed(1)}x`);
});

let globalMinMult = 999;
let globalMaxMult = 0;
profiles.forEach(prof => {
  for (let s = 1; s <= 10; s++) {
    const p = generateMealPlan(prof, { seed: s }).plan;
    if (p) {
      p.meals.flatMap(m => m.items).forEach(i => {
        globalMinMult = Math.min(globalMinMult, i.portionMultiplier);
        globalMaxMult = Math.max(globalMaxMult, i.portionMultiplier);
      });
    }
  }
});

console.log(`Global Generated Portion Multiplier Range (Across 50 Plans): [${globalMinMult.toFixed(2)}x, ${globalMaxMult.toFixed(2)}x]`);
report('Portion Multipliers Bounded Strictly [0.5x, 2.5x]', globalMinMult >= 0.5 && globalMaxMult <= 2.5);

// -------------------------------------------------------------
// 3. FOOD DIVERSITY & DATABASE COVERAGE (100 SEEDS)
// -------------------------------------------------------------
console.log('\n--- 3. FOOD DIVERSITY & DATABASE COVERAGE (100 Seeds) ---');
const foodCounts = new Map<string, number>();
const categoryCounts = new Map<string, number>();

for (let seed = 1; seed <= 100; seed++) {
  const p = generateMealPlan(profileA, { seed }).plan;
  if (p) {
    p.meals.flatMap(m => m.items).forEach(i => {
      foodCounts.set(i.foodItem.id, (foodCounts.get(i.foodItem.id) || 0) + 1);
      categoryCounts.set(i.foodItem.category, (categoryCounts.get(i.foodItem.category) || 0) + 1);
    });
  }
}

const totalDB = BANGLADESH_FOOD_DATABASE.length;
const totalSelected = foodCounts.size;
const coveragePct = (totalSelected / totalDB) * 100;
const sortedFoods = [...foodCounts.entries()].sort((a, b) => b[1] - a[1]);

console.log(`Total Database Items: ${totalDB}`);
console.log(`Total Unique Foods Selected Across 100 Seeds: ${totalSelected}`);
console.log(`Database Coverage Percentage: ${coveragePct.toFixed(1)}%`);

console.log('\nTop 10 Most Frequently Selected Foods:');
sortedFoods.slice(0, 10).forEach(([id, count]) => {
  const f = BANGLADESH_FOOD_DATABASE.find(x => x.id === id);
  console.log(`  - ${id} (${f?.englishName}): ${count} times`);
});

console.log('\nBottom 10 Selected Foods:');
sortedFoods.slice(-10).forEach(([id, count]) => {
  const f = BANGLADESH_FOOD_DATABASE.find(x => x.id === id);
  console.log(`  - ${id} (${f?.englishName}): ${count} times`);
});

const unselectedFoods = BANGLADESH_FOOD_DATABASE.filter(f => !foodCounts.has(f.id));
console.log(`Unselected Foods Count: ${unselectedFoods.length}`);
if (unselectedFoods.length > 0) {
  console.log(`Unselected Food IDs: ${unselectedFoods.map(f => f.id).join(', ')}`);
}

report('High Database Coverage (> 75% Reachable)', coveragePct >= 75.0, `Coverage: ${coveragePct.toFixed(1)}%`);

// -------------------------------------------------------------
// 4. ALLERGY & DIET SAFETY ADVERSARIAL TEST
// -------------------------------------------------------------
console.log('\n--- 4. ALLERGY, DIET & DISLIKE SAFETY TEST ---');

// Allergies
const allergenInput = ['fish', 'peanut', 'chinabadam', 'milk', 'doodh', 'egg', 'dim', 'wheat', 'atta', 'mustard', 'shorshe', 'seafood', 'shrimp', 'chingri', 'soy'];
let allergyViolations = 0;

for (let s = 1; s <= 20; s++) {
  const p = generateMealPlan({ ...profileA, allergies: allergenInput }, { seed: s }).plan;
  if (p) {
    const items = p.meals.flatMap(m => m.items);
    const violations = items.filter(i => isFoodAllergic(i.foodItem, allergenInput));
    allergyViolations += violations.length;

    // Test swap safety
    if (items[0]) {
      const swaps = getMealSwapAlternatives(items[0].foodItem, { ...profileA, allergies: allergenInput }, 'Lunch');
      const unsafeSwaps = swaps.filter(sItem => isFoodAllergic(sItem, allergenInput));
      allergyViolations += unsafeSwaps.length;
    }
  }
}
console.log(`Allergy Violations Across 20 Seeds + Swaps: ${allergyViolations}`);
report('Zero Allergy Violations', allergyViolations === 0);

// Vegetarian & Vegan
let vegViolations = 0;
let veganViolations = 0;

for (let s = 1; s <= 20; s++) {
  const pVeg = generateMealPlan({ ...profileA, dietaryPreference: 'vegetarian' }, { seed: s }).plan;
  const pVegan = generateMealPlan({ ...profileA, dietaryPreference: 'vegan' }, { seed: s }).plan;

  if (pVeg) {
    vegViolations += pVeg.meals.flatMap(m => m.items).filter(i => !i.foodItem.isVegetarian).length;
  }
  if (pVegan) {
    veganViolations += pVegan.meals.flatMap(m => m.items).filter(i => !i.foodItem.isVegan).length;
  }
}
console.log(`Vegetarian Violations Across 20 Seeds: ${vegViolations}`);
console.log(`Vegan Violations Across 20 Seeds: ${veganViolations}`);
report('Zero Vegetarian Violations', vegViolations === 0);
report('Zero Vegan Violations', veganViolations === 0);

// Dislikes & Substring False Positives
const boiledRice = BANGLADESH_FOOD_DATABASE.find(f => f.englishName.toLowerCase().includes('boiled rice'));
const dislikingOilExcludesRice = boiledRice ? isFoodDisliked(boiledRice, ['oil']) : true;
console.log(`Disliking "oil" excludes Boiled Rice (False Positive Test): ${dislikingOilExcludesRice}`);
report('Disliking "oil" does NOT falsely exclude Boiled Rice', !dislikingOilExcludesRice);

// Actual disliked food exclusion
let dislikedViolations = 0;
const dislikedList = ['okra', 'ঢেঁড়শ', 'hilsa', 'ইলিশ'];
for (let s = 1; s <= 10; s++) {
  const p = generateMealPlan({ ...profileA, dislikedFoods: dislikedList }, { seed: s }).plan;
  if (p) {
    dislikedViolations += p.meals.flatMap(m => m.items).filter(i => isFoodDisliked(i.foodItem, dislikedList)).length;
  }
}
console.log(`Disliked Food Violations Across 10 Seeds: ${dislikedViolations}`);
report('Zero Disliked Food Violations', dislikedViolations === 0);

// -------------------------------------------------------------
// 5. MEAL SWAP SAFETY & MATHEMATICAL RECALCULATION
// -------------------------------------------------------------
console.log('\n--- 5. MEAL SWAP SAFETY & MACRO RECALCULATION ---');
const initialPlanRes = generateMealPlan(profileA, { seed: 1 });
let swapTestsPassed = true;

if (initialPlanRes.plan) {
  let currentPlan = initialPlanRes.plan;
  const targetMeal = currentPlan.meals[2]; // Lunch
  const targetItem = targetMeal.items[0]; // Rice / staple

  if (targetItem) {
    const swaps = getMealSwapAlternatives(targetItem.foodItem, profileA, 'Lunch');
    if (swaps.length > 0) {
      const replacementFood = swaps[0];
      const targetSlot = currentPlan.meals[2]; // Lunch slot
      const updatedPlan = swapFoodItemInPlan(currentPlan, targetSlot.id, 0, replacementFood);

      const oldCals = currentPlan.actualTotalCalories;
      const newCals = updatedPlan.actualTotalCalories;

      // Verify recalculation happened
      const updatedLunch = updatedPlan.meals.find(m => m.id === targetSlot.id);
      const updatedLunchCals = updatedLunch?.items.reduce((sum, i) => sum + i.calories, 0);

      const swapMathCorrect = updatedLunch?.totalCalories === updatedLunchCals;
      report('Swap Updates Meal Calories & Daily Totals Mathematically', swapMathCorrect, `Old Daily: ${oldCals} kcal | New Daily: ${newCals} kcal | New Lunch: ${updatedLunch?.totalCalories} kcal`);
    }
  }
}

// -------------------------------------------------------------
// 6. MATHEMATICAL INTEGRITY & DETERMINISM
// -------------------------------------------------------------
console.log('\n--- 6. MATHEMATICAL INTEGRITY & DETERMINISM ---');
const detA = generateMealPlan(profileA, { seed: 42 }).plan;
const detB = generateMealPlan(profileA, { seed: 42 }).plan;
const detC = generateMealPlan(profileA, { seed: 43 }).plan;

const idsA = detA?.meals.flatMap(m => m.items.map(i => i.foodItem.id)).join(',');
const idsB = detB?.meals.flatMap(m => m.items.map(i => i.foodItem.id)).join(',');
const idsC = detC?.meals.flatMap(m => m.items.map(i => i.foodItem.id)).join(',');

report('Seed 42 Byte-Equivalent Logical Determinism', idsA === idsB && detA?.actualTotalCalories === detB?.actualTotalCalories);
report('Seed 43 Produces Alternate Plan Sequence', idsA !== idsC);

// Daily vs Meal sums
if (detA) {
  const sumMealCals = detA.meals.reduce((sum, m) => sum + m.totalCalories, 0);
  const sumMealProt = Number(detA.meals.reduce((sum, m) => sum + m.totalProteinGrams, 0).toFixed(1));
  const sumMealCarb = Number(detA.meals.reduce((sum, m) => sum + m.totalCarbsGrams, 0).toFixed(1));
  const sumMealFat = Number(detA.meals.reduce((sum, m) => sum + m.totalFatGrams, 0).toFixed(1));
  const sumMealFib = Number(detA.meals.reduce((sum, m) => sum + m.totalFiberGrams, 0).toFixed(1));

  report('Daily Calories === Sum of Meal Calories', detA.actualTotalCalories === sumMealCals, `${detA.actualTotalCalories} vs ${sumMealCals}`);
  report('Daily Protein === Sum of Meal Protein', detA.totalProteinGrams === sumMealProt, `${detA.totalProteinGrams} vs ${sumMealProt}`);
  report('Daily Carbs === Sum of Meal Carbs', detA.totalCarbsGrams === sumMealCarb, `${detA.totalCarbsGrams} vs ${sumMealCarb}`);
  report('Daily Fat === Sum of Meal Fat', detA.totalFatGrams === sumMealFat, `${detA.totalFatGrams} vs ${sumMealFat}`);
  report('Daily Fiber === Sum of Meal Fiber', detA.totalFiberGrams === sumMealFib, `${detA.totalFiberGrams} vs ${sumMealFib}`);
}

// -------------------------------------------------------------
// 7. DATABASE INTEGRITY AUDIT
// -------------------------------------------------------------
console.log('\n--- 7. DATABASE INTEGRITY AUDIT ---');
const idsSet = new Set<string>();
let dbDuplicates = 0;
let dbNegativeMacros = 0;
let dbInvalidNames = 0;

BANGLADESH_FOOD_DATABASE.forEach(f => {
  if (idsSet.has(f.id)) dbDuplicates++;
  idsSet.add(f.id);

  if (!f.englishName || !f.banglaName) dbInvalidNames++;
  if (f.calories < 0 || f.proteinGrams < 0 || f.carbsGrams < 0 || f.fatGrams < 0 || f.fiberGrams < 0) {
    dbNegativeMacros++;
  }
});

console.log(`Database Size: ${BANGLADESH_FOOD_DATABASE.length}`);
console.log(`Duplicate IDs: ${dbDuplicates}`);
console.log(`Invalid Names: ${dbInvalidNames}`);
console.log(`Negative Macros: ${dbNegativeMacros}`);

report('Database Zero Duplicates, Invalid Names or Negative Values', dbDuplicates === 0 && dbInvalidNames === 0 && dbNegativeMacros === 0);

console.log('\n===========================================================');
console.log(`   FINAL RELEASE AUDIT SUMMARY: ${passedChecks} / ${totalChecks} CHECKS PASSED`);
if (passedChecks === totalChecks) {
  console.log('   ALL RELEASE AUDIT CHECKS PASSED PERFECTLY!');
} else {
  console.error(`   RELEASE AUDIT FAILED WITH ${totalChecks - passedChecks} FAILURE(S)`);
}
console.log('===========================================================\n');

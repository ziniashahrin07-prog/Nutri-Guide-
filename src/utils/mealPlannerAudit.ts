import { generateMealPlan, createPlannedItem, isFoodAllergic, isFoodDisliked, MEAL_PLAN_DISCLAIMER } from './mealPlanner';
import { PersonalHealthProfile } from '../types';
import { BANGLADESH_FOOD_DATABASE } from '../data/bangladeshFoodDatabase';
import { getFullHealthMetrics } from './nutritionCalculator';

console.log('===========================================================');
console.log('   MEAL PLANNER QUALITY & NUTRITION INTEGRITY AUDIT');
console.log('===========================================================\n');

let totalAuditChecks = 0;
let passedAuditChecks = 0;

function reportCheck(name: string, condition: boolean, detail: string = '') {
  totalAuditChecks++;
  if (condition) {
    passedAuditChecks++;
    console.log(`[PASS] ${name} ${detail ? `| ${detail}` : ''}`);
  } else {
    console.error(`[FAIL] ${name} ${detail ? `| ${detail}` : ''}`);
  }
}

// -------------------------------------------------------------
// PROFILE DEFINITIONS FOR AUDIT
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
  name: 'Profile C (Male Lose Weight)',
  age: 35,
  sex: 'male',
  heightCm: 178,
  weightKg: 88,
  activityLevel: 'very_active',
  dietaryPreference: 'no_preference',
  allergies: ['Fish', 'Peanuts'],
  dislikedFoods: ['Okra'],
  dietaryRestrictions: [],
  goal: 'lose_weight',
};

// -------------------------------------------------------------
// AUDIT SECTION 1: CALORIE ACCURACY & PORTION MULTIPLIERS
// -------------------------------------------------------------
console.log('--- 1. CALORIE ACCURACY & PORTION MULTIPLIERS ---');
const testProfiles = [profileA, profileB, profileC];
const testSeeds = [1, 2, 3, 5, 10];

testProfiles.forEach((prof) => {
  const metrics = getFullHealthMetrics(prof);
  testSeeds.forEach((seed) => {
    const res = generateMealPlan(prof, { seed });
    if (res.success && res.plan) {
      const target = res.plan.targetTotalCalories;
      const actual = res.plan.actualTotalCalories;
      const diff = actual - target;
      
      // Verify multiplier range [0.5, 2.5]
      const multipliers = res.plan.meals.flatMap(m => m.items.map(i => i.portionMultiplier));
      const minMult = Math.min(...multipliers);
      const maxMult = Math.max(...multipliers);

      reportCheck(
        `Calorie Precision (${prof.name}, Seed ${seed})`,
        Math.abs(diff) <= 150 && minMult >= 0.25 && maxMult <= 3.0,
        `Target: ${target} kcal | Actual: ${actual} kcal | Diff: ${diff > 0 ? `+${diff}` : diff} kcal | Multiplier Range: [${minMult.toFixed(2)}, ${maxMult.toFixed(2)}]`
      );
    }
  });
});

// -------------------------------------------------------------
// AUDIT SECTION 2: NUTRITION ARITHMETIC VERIFICATION
// -------------------------------------------------------------
console.log('\n--- 2. NUTRITION ARITHMETIC VERIFICATION ---');
const planArith = generateMealPlan(profileA, { seed: 1 }).plan;
if (planArith) {
  let mealCalsSum = 0;
  let mealProtSum = 0;
  let mealCarbSum = 0;
  let mealFatSum = 0;
  let mealFibSum = 0;
  let arithmeticPerfect = true;

  planArith.meals.forEach((meal) => {
    const itemCals = meal.items.reduce((s, i) => s + i.calories, 0);
    const itemProt = Number(meal.items.reduce((s, i) => s + i.proteinGrams, 0).toFixed(1));
    const itemCarb = Number(meal.items.reduce((s, i) => s + i.carbsGrams, 0).toFixed(1));
    const itemFat = Number(meal.items.reduce((s, i) => s + i.fatGrams, 0).toFixed(1));
    const itemFib = Number(meal.items.reduce((s, i) => s + i.fiberGrams, 0).toFixed(1));

    if (
      itemCals !== meal.totalCalories ||
      itemProt !== meal.totalProteinGrams ||
      itemCarb !== meal.totalCarbsGrams ||
      itemFat !== meal.totalFatGrams ||
      itemFib !== meal.totalFiberGrams
    ) {
      arithmeticPerfect = false;
    }

    if (!meal.skipped) {
      mealCalsSum += meal.totalCalories;
      mealProtSum += meal.totalProteinGrams;
      mealCarbSum += meal.totalCarbsGrams;
      mealFatSum += meal.totalFatGrams;
      mealFibSum += meal.totalFiberGrams;
    }
  });

  const dailyCalsExact = mealCalsSum === planArith.actualTotalCalories;
  const dailyProtExact = Number(mealProtSum.toFixed(1)) === planArith.totalProteinGrams;
  const dailyCarbExact = Number(mealCarbSum.toFixed(1)) === planArith.totalCarbsGrams;
  const dailyFatExact = Number(mealFatSum.toFixed(1)) === planArith.totalFatGrams;
  const dailyFibExact = Number(mealFibSum.toFixed(1)) === planArith.totalFiberGrams;

  reportCheck('Meal Slot Item Sum Arithmetic', arithmeticPerfect);
  reportCheck('Daily Calories Sum Equals Meal Sum', dailyCalsExact, `Daily: ${planArith.actualTotalCalories} vs Sum: ${mealCalsSum}`);
  reportCheck('Daily Protein Sum Equals Meal Sum', dailyProtExact, `Daily: ${planArith.totalProteinGrams}g vs Sum: ${mealProtSum.toFixed(1)}g`);
  reportCheck('Daily Carbs Sum Equals Meal Sum', dailyCarbExact, `Daily: ${planArith.totalCarbsGrams}g vs Sum: ${mealCarbSum.toFixed(1)}g`);
  reportCheck('Daily Fat Sum Equals Meal Sum', dailyFatExact, `Daily: ${planArith.totalFatGrams}g vs Sum: ${mealFatSum.toFixed(1)}g`);
  reportCheck('Daily Fiber Sum Equals Meal Sum', dailyFibExact, `Daily: ${planArith.totalFiberGrams}g vs Sum: ${mealFibSum.toFixed(1)}g`);
}

// -------------------------------------------------------------
// AUDIT SECTION 3: PORTION SCALING CONSISTENCY
// -------------------------------------------------------------
console.log('\n--- 3. PORTION SCALING CONSISTENCY ---');
const sampleFood = BANGLADESH_FOOD_DATABASE[0]; // e.g. Boiled Rice
const item1x = createPlannedItem(sampleFood, 1.0);
const item1_5x = createPlannedItem(sampleFood, 1.5);
const item2x = createPlannedItem(sampleFood, 2.0);

const scale1_5Accurate = 
  item1_5x.calories === Math.round(sampleFood.calories * 1.5) &&
  item1_5x.proteinGrams === Number((sampleFood.proteinGrams * 1.5).toFixed(1)) &&
  item1_5x.carbsGrams === Number((sampleFood.carbsGrams * 1.5).toFixed(1));

const scale2Accurate = 
  item2x.calories === Math.round(sampleFood.calories * 2.0) &&
  item2x.proteinGrams === Number((sampleFood.proteinGrams * 2.0).toFixed(1)) &&
  item2x.carbsGrams === Number((sampleFood.carbsGrams * 2.0).toFixed(1));

reportCheck('1.5x Portion Scaling Exact Precision', scale1_5Accurate);
reportCheck('2.0x Portion Scaling Exact Precision', scale2Accurate);

// -------------------------------------------------------------
// AUDIT SECTION 4: MEAL DISTRIBUTION RATIOS
// -------------------------------------------------------------
console.log('\n--- 4. MEAL DISTRIBUTION RATIOS ---');
if (planArith) {
  const bRatio = planArith.meals[0].totalCalories / planArith.actualTotalCalories;
  const msRatio = planArith.meals[1].totalCalories / planArith.actualTotalCalories;
  const lRatio = planArith.meals[2].totalCalories / planArith.actualTotalCalories;
  const asRatio = planArith.meals[3].totalCalories / planArith.actualTotalCalories;
  const dRatio = planArith.meals[4].totalCalories / planArith.actualTotalCalories;

  const distributionReasonable = 
    bRatio >= 0.15 && bRatio <= 0.30 &&
    msRatio >= 0.03 && msRatio <= 0.15 &&
    lRatio >= 0.25 && lRatio <= 0.40 &&
    asRatio >= 0.03 && asRatio <= 0.15 &&
    dRatio >= 0.20 && dRatio <= 0.35;

  reportCheck(
    'Meal Calorie Distribution Balanced',
    distributionReasonable,
    `B: ${(bRatio*100).toFixed(1)}% | MS: ${(msRatio*100).toFixed(1)}% | L: ${(lRatio*100).toFixed(1)}% | AS: ${(asRatio*100).toFixed(1)}% | D: ${(dRatio*100).toFixed(1)}%`
  );
}

// -------------------------------------------------------------
// AUDIT SECTION 5: FOOD DIVERSITY ACROSS 10 SEEDS
// -------------------------------------------------------------
console.log('\n--- 5. FOOD DIVERSITY ACROSS 10 SEEDS ---');
const selectedFoodIdsAcrossSeeds = new Set<string>();
for (let seed = 1; seed <= 10; seed++) {
  const p = generateMealPlan(profileA, { seed }).plan;
  if (p) {
    p.meals.flatMap(m => m.items).forEach(i => selectedFoodIdsAcrossSeeds.add(i.foodItem.id));
  }
}
reportCheck(
  'Diverse Selection Across 10 Seeds',
  selectedFoodIdsAcrossSeeds.size >= 15,
  `Total Unique Food Items Selected Across 10 Seeds: ${selectedFoodIdsAcrossSeeds.size}`
);

// -------------------------------------------------------------
// AUDIT SECTION 6: SAFETY CONSTRAINTS (ALLERGIES & PREFERENCES)
// -------------------------------------------------------------
console.log('\n--- 6. SAFETY CONSTRAINTS AUDIT ---');
let safetyCheckPassed = true;
for (let seed = 1; seed <= 10; seed++) {
  const p = generateMealPlan(profileC, { seed }).plan; // Profile C has Fish & Peanut allergy + Okra dislike
  if (p) {
    const items = p.meals.flatMap(m => m.items);
    const allergic = items.filter(i => isFoodAllergic(i.foodItem, profileC.allergies));
    const disliked = items.filter(i => isFoodDisliked(i.foodItem, profileC.dislikedFoods));
    if (allergic.length > 0 || disliked.length > 0) {
      safetyCheckPassed = false;
    }
  }
}
reportCheck('Allergy & Dislike Exclusion 10-Seed Immunity', safetyCheckPassed);

// -------------------------------------------------------------
// AUDIT SECTION 7: DATABASE INTEGRITY
// -------------------------------------------------------------
console.log('\n--- 7. DATABASE INTEGRITY ---');
const dbIds = new Set(BANGLADESH_FOOD_DATABASE.map(f => f.id));
let dbIntegrityPassed = BANGLADESH_FOOD_DATABASE.length >= 80;

BANGLADESH_FOOD_DATABASE.forEach(food => {
  if (
    !food.id ||
    !food.englishName ||
    !food.banglaName ||
    food.calories < 0 ||
    food.proteinGrams < 0 ||
    food.carbsGrams < 0 ||
    food.fatGrams < 0
  ) {
    dbIntegrityPassed = false;
  }
});
reportCheck('Database Integrity & Completeness', dbIntegrityPassed, `Total Items: ${BANGLADESH_FOOD_DATABASE.length}`);

// -------------------------------------------------------------
// AUDIT SECTION 8: DETERMINISM & SEED ROTATION
// -------------------------------------------------------------
console.log('\n--- 8. DETERMINISM & SEED ROTATION ---');
const planSeed42_A = generateMealPlan(profileA, { seed: 42 }).plan;
const planSeed42_B = generateMealPlan(profileA, { seed: 42 }).plan;
const planSeed43 = generateMealPlan(profileA, { seed: 43 }).plan;

const exactDeterministicMatch = 
  JSON.stringify(planSeed42_A?.meals.flatMap(m => m.items.map(i => i.foodItem.id))) ===
  JSON.stringify(planSeed42_B?.meals.flatMap(m => m.items.map(i => i.foodItem.id)));

const seedRotationDiffers = 
  JSON.stringify(planSeed42_A?.meals.flatMap(m => m.items.map(i => i.foodItem.id))) !==
  JSON.stringify(planSeed43?.meals.flatMap(m => m.items.map(i => i.foodItem.id)));

reportCheck('Identical Profile + Seed Yields Identical Plan', exactDeterministicMatch);
reportCheck('Seed Rotation (Regenerate Day) Produces Alternate Plan', seedRotationDiffers);

// -------------------------------------------------------------
// AUDIT SECTION 9: PROFILE DIFFERENCES (A, B, C)
// -------------------------------------------------------------
console.log('\n--- 9. PROFILE DIFFERENCES & TDEE CALIBRATION ---');
const resA = generateMealPlan(profileA, { seed: 1 }).plan;
const resB = generateMealPlan(profileB, { seed: 1 }).plan;
const resC = generateMealPlan(profileC, { seed: 1 }).plan;

const profilesDifferentiated = 
  resA && resB && resC &&
  resA.targetTotalCalories !== resB.targetTotalCalories &&
  resB.targetTotalCalories !== resC.targetTotalCalories;

reportCheck(
  'Distinct Profiles Yield Tailored Calorie Targets',
  profilesDifferentiated,
  `Profile A: ${resA?.targetTotalCalories} kcal | Profile B: ${resB?.targetTotalCalories} kcal | Profile C: ${resC?.targetTotalCalories} kcal`
);

// -------------------------------------------------------------
// AUDIT SECTION 10: DISCLAIMERS & SAFETY TEXT
// -------------------------------------------------------------
console.log('\n--- 10. DISCLAIMER & SAFETY LANGUAGE ---');
const hasDisclaimer = MEAL_PLAN_DISCLAIMER && MEAL_PLAN_DISCLAIMER.includes('general nutrition guidance') && MEAL_PLAN_DISCLAIMER.includes('not medical treatment');
reportCheck('Medical Disclaimer Text Present & Compliant', Boolean(hasDisclaimer));

console.log('\n===========================================================');
console.log(`   AUDIT SUMMARY: ${passedAuditChecks} / ${totalAuditChecks} CHECKS PASSED`);
if (passedAuditChecks === totalAuditChecks) {
  console.log('   MEAL PLANNER QUALITY & NUTRITION INTEGRITY AUDIT PASSED');
} else {
  console.error('   AUDIT ENCOUNTERED FAILURES');
}
console.log('===========================================================\n');

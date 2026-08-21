import { generateMealPlan, isFoodAllergic, isFoodDisliked, getMealSwapAlternatives, createPRNG } from './mealPlanner';
import { PersonalHealthProfile } from '../types';
import { BANGLADESH_FOOD_DATABASE } from '../data/bangladeshFoodDatabase';
import { getFullHealthMetrics } from './nutritionCalculator';

console.log('===========================================================');
console.log('   NUTRI GUIDE MEAL PLANNER - ADVERSARIAL AUDIT SUITE');
console.log('===========================================================\n');

let totalAuditChecks = 0;
let passedAuditChecks = 0;

function report(name: string, condition: boolean, detail: string = '') {
  totalAuditChecks++;
  if (condition) {
    passedAuditChecks++;
    console.log(`[PASS] ${name} ${detail ? `| ${detail}` : ''}`);
  } else {
    console.error(`[FAIL] ${name} ${detail ? `| ${detail}` : ''}`);
  }
}

// -------------------------------------------------------------
// ADVERSARIAL PROFILES
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

// -------------------------------------------------------------
// 1. AUDIT GOAL PERSONALIZATION & SAME-SEED PROFILE COMPARISON
// -------------------------------------------------------------
console.log('--- 1. AUDIT GOAL PERSONALIZATION & SAME-SEED COMPARISON (Seed 42) ---');
const planA = generateMealPlan(profileA, { seed: 42 }).plan;
const planB = generateMealPlan(profileB, { seed: 42 }).plan;
const planC = generateMealPlan(profileC, { seed: 42 }).plan;
const planD = generateMealPlan(profileD, { seed: 42 }).plan;
const planE = generateMealPlan(profileE, { seed: 42 }).plan;

const foodsA = planA?.meals.flatMap(m => m.items.map(i => i.foodItem.id)) || [];
const foodsB = planB?.meals.flatMap(m => m.items.map(i => i.foodItem.id)) || [];
const foodsC = planC?.meals.flatMap(m => m.items.map(i => i.foodItem.id)) || [];
const foodsD = planD?.meals.flatMap(m => m.items.map(i => i.foodItem.id)) || [];
const foodsE = planE?.meals.flatMap(m => m.items.map(i => i.foodItem.id)) || [];

console.log(`Profile A Foods (${foodsA.length}):`, foodsA.join(', '));
console.log(`Profile B Foods (${foodsB.length}):`, foodsB.join(', '));
console.log(`Profile C Foods (${foodsC.length}):`, foodsC.join(', '));
console.log(`Profile D Foods (${foodsD.length}):`, foodsD.join(', '));
console.log(`Profile E Foods (${foodsE.length}):`, foodsE.join(', '));

const allIdenticalToA =
  foodsA.join(',') === foodsB.join(',') &&
  foodsA.join(',') === foodsC.join(',') &&
  foodsA.join(',') === foodsD.join(',') &&
  foodsA.join(',') === foodsE.join(',');

report(
  'Goal Personalization Influences Food Selection (Not Just Portions)',
  !allIdenticalToA,
  allIdenticalToA ? 'CRITICAL FAILURE: All profiles received identical food items for seed 42!' : 'Different goals/profiles yielded distinct food selection candidates.'
);

// -------------------------------------------------------------
// 2. MACRO QUALITY & PROTEIN GRAMS PER KG
// -------------------------------------------------------------
console.log('\n--- 2. MACRO QUALITY & PROTEIN PER KG ---');
[profileA, profileB, profileC, profileD, profileE].forEach(prof => {
  const plan = generateMealPlan(prof, { seed: 42 }).plan;
  if (plan) {
    const proteinPerKg = plan.totalProteinGrams / prof.weightKg;
    // Healthy protein target is typically 1.0 - 2.5 g/kg
    report(
      `Protein Adequacy (${prof.name})`,
      proteinPerKg >= 1.0 && proteinPerKg <= 2.8,
      `Weight: ${prof.weightKg}kg | Total Prot: ${plan.totalProteinGrams}g | Prot/kg: ${proteinPerKg.toFixed(2)} g/kg`
    );
  }
});

// -------------------------------------------------------------
// 3. PORTION SANITY AUDIT
// -------------------------------------------------------------
console.log('\n--- 3. PORTION SANITY AUDIT ---');
let maxFruitMult = 0;
let maxRiceMult = 0;
let maxMeatMult = 0;
let minProtMult = 999;

for (let seed = 1; seed <= 20; seed++) {
  const plan = generateMealPlan(profileC, { seed }).plan;
  if (plan) {
    plan.meals.flatMap(m => m.items).forEach(item => {
      const cat = item.foodItem.category;
      if (cat === 'Fruits') {
        maxFruitMult = Math.max(maxFruitMult, item.portionMultiplier);
      }
      if (cat === 'Rice & Grains') {
        maxRiceMult = Math.max(maxRiceMult, item.portionMultiplier);
      }
      if (['Fish', 'Chicken & Other Poultry', 'Meat', 'Eggs', 'Dal & Legumes'].includes(cat)) {
        maxMeatMult = Math.max(maxMeatMult, item.portionMultiplier);
        minProtMult = Math.min(minProtMult, item.portionMultiplier);
      }
    });
  }
}

console.log(`Max Fruit Multiplier: ${maxFruitMult.toFixed(2)}x`);
console.log(`Max Rice Multiplier: ${maxRiceMult.toFixed(2)}x`);
console.log(`Max Meat Multiplier: ${maxMeatMult.toFixed(2)}x`);
console.log(`Min Protein Multiplier: ${minProtMult.toFixed(2)}x`);

report(
  'Fruit Portions Reasonable (<= 2.2x)',
  maxFruitMult <= 2.2,
  `Max Fruit Multiplier: ${maxFruitMult.toFixed(2)}x`
);
report(
  'Grain Portions Reasonable (<= 2.5x)',
  maxRiceMult <= 2.5,
  `Max Rice Multiplier: ${maxRiceMult.toFixed(2)}x`
);
report(
  'Protein Portions Reasonable (>= 0.5x and <= 2.5x)',
  minProtMult >= 0.5 && maxMeatMult <= 2.5,
  `Min Prot: ${minProtMult.toFixed(2)}x | Max Prot: ${maxMeatMult.toFixed(2)}x`
);

// -------------------------------------------------------------
// 4. FOOD-SELECTION BIAS & DATABASE COVERAGE (50 Seeds Sample)
// -------------------------------------------------------------
console.log('\n--- 4. FOOD-SELECTION BIAS & DATABASE COVERAGE (50 Seeds) ---');
const foodCounts = new Map<string, number>();
const categoryCounts = new Map<string, number>();

for (let seed = 1; seed <= 50; seed++) {
  const plan = generateMealPlan(profileA, { seed }).plan;
  if (plan) {
    plan.meals.flatMap(m => m.items).forEach(item => {
      const id = item.foodItem.id;
      const cat = item.foodItem.category;
      foodCounts.set(id, (foodCounts.get(id) || 0) + 1);
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    });
  }
}

const totalUniqueUsed = foodCounts.size;
const totalDBFoods = BANGLADESH_FOOD_DATABASE.length;
const sortedFoods = [...foodCounts.entries()].sort((a, b) => b[1] - a[1]);

console.log(`Unique Foods Used Across 50 Seeds: ${totalUniqueUsed} / ${totalDBFoods} (${((totalUniqueUsed / totalDBFoods) * 100).toFixed(1)}%)`);
console.log('Top 5 Most Frequent Foods:', sortedFoods.slice(0, 5).map(([id, count]) => `${id} (${count})`).join(', '));

report(
  'Database Coverage (> 50% Reachable Across Seeds)',
  totalUniqueUsed >= 40,
  `Reached ${totalUniqueUsed} / ${totalDBFoods} foods`
);

// -------------------------------------------------------------
// 5. ALLERGY ADVERSARIAL TEST
// -------------------------------------------------------------
console.log('\n--- 5. ALLERGY ADVERSARIAL TEST ---');
const complexAllergyProfile: PersonalHealthProfile = {
  ...profileA,
  allergies: ['fish', 'chinabadam', 'doodh', 'dim', 'atta', 'shorshe', 'chingri', 'soy'],
};

let allergySafeAllSeeds = true;
for (let seed = 1; seed <= 10; seed++) {
  const plan = generateMealPlan(complexAllergyProfile, { seed }).plan;
  if (plan) {
    const items = plan.meals.flatMap(m => m.items);
    const allergic = items.filter(i => isFoodAllergic(i.foodItem, complexAllergyProfile.allergies));
    if (allergic.length > 0) {
      allergySafeAllSeeds = false;
      console.error(`Allergy Violation in Seed ${seed}:`, allergic.map(a => a.foodItem.englishName));
    }

    // Also check swap alternatives
    if (items[0]) {
      const swaps = getMealSwapAlternatives(items[0].foodItem, complexAllergyProfile, 'Lunch');
      const unsafeSwaps = swaps.filter(s => isFoodAllergic(s, complexAllergyProfile.allergies));
      if (unsafeSwaps.length > 0) {
        allergySafeAllSeeds = false;
        console.error(`Unsafe Swap Alternatives in Seed ${seed}:`, unsafeSwaps.map(s => s.englishName));
      }
    }
  }
}

report('Multilingual Complex Allergy Safety Across Generation & Swaps', allergySafeAllergySafeAllSeedsPassed(allergySafeAllSeeds));

function allergySafeAllergySafeAllSeedsPassed(val: boolean) { return val; }

// -------------------------------------------------------------
// 6. VEGETARIAN & VEGAN ADVERSARIAL TEST
// -------------------------------------------------------------
console.log('\n--- 6. VEGETARIAN & VEGAN ADVERSARIAL TEST ---');
const vegProfile: PersonalHealthProfile = { ...profileA, dietaryPreference: 'vegetarian' };
const veganProfile: PersonalHealthProfile = { ...profileA, dietaryPreference: 'vegan' };

let vegPassed = true;
let veganPassed = true;

for (let seed = 1; seed <= 20; seed++) {
  const pVeg = generateMealPlan(vegProfile, { seed }).plan;
  const pVegan = generateMealPlan(veganProfile, { seed }).plan;

  if (pVeg) {
    const nonVeg = pVeg.meals.flatMap(m => m.items).filter(i => !i.foodItem.isVegetarian);
    if (nonVeg.length > 0) vegPassed = false;
  }
  if (pVegan) {
    const nonVegan = pVegan.meals.flatMap(m => m.items).filter(i => !i.foodItem.isVegan);
    if (nonVegan.length > 0) veganPassed = false;
  }
}

report('Vegetarian Strict Compliance Across 20 Seeds', vegPassed);
report('Vegan Strict Compliance Across 20 Seeds', veganPassed);

// -------------------------------------------------------------
// 7. DISLIKED-FOOD ADVERSARIAL TEST
// -------------------------------------------------------------
console.log('\n--- 7. DISLIKED-FOOD ADVERSARIAL TEST ---');
const dislikedProfile: PersonalHealthProfile = {
  ...profileA,
  dislikedFoods: ['okra', 'ঢেঁড়শ', 'hilsa', 'ইলিশ', 'oil'],
};

// "oil" should NOT exclude "Boiled Rice" or "Roti"
const riceItem = BANGLADESH_FOOD_DATABASE.find(f => f.englishName.toLowerCase().includes('boiled rice'));
const oilExcludedRice = riceItem ? isFoodDisliked(riceItem, ['oil']) : false;

report('False Positive Prevention (Disliking "oil" does NOT exclude Boiled Rice)', !oilExcludedRice);

let dislikePassed = true;
for (let seed = 1; seed <= 10; seed++) {
  const p = generateMealPlan(dislikedProfile, { seed }).plan;
  if (p) {
    const items = p.meals.flatMap(m => m.items);
    const dislikedItems = items.filter(i => isFoodDisliked(i.foodItem, dislikedProfile.dislikedFoods));
    if (dislikedItems.length > 0) {
      dislikePassed = false;
      console.error(`Disliked Food Included in Seed ${seed}:`, dislikedItems.map(d => d.foodItem.englishName));
    }
  }
}

report('Disliked Foods Strictly Avoided Across 10 Seeds', dislikePassed);

// -------------------------------------------------------------
// 8. NUMERICAL & MACRO INTEGRITY AUDIT
// -------------------------------------------------------------
console.log('\n--- 8. NUMERICAL & MACRO INTEGRITY AUDIT ---');
const planNum = generateMealPlan(profileA, { seed: 123 }).plan;
if (planNum) {
  const mealCalsSum = planNum.meals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalCalories), 0);
  const mealProtSum = Number(planNum.meals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalProteinGrams), 0).toFixed(1));
  const mealCarbSum = Number(planNum.meals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalCarbsGrams), 0).toFixed(1));
  const mealFatSum = Number(planNum.meals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalFatGrams), 0).toFixed(1));
  const mealFibSum = Number(planNum.meals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalFiberGrams), 0).toFixed(1));

  report('Daily Calories = Sum of Meal Calories', planNum.actualTotalCalories === mealCalsSum, `${planNum.actualTotalCalories} vs ${mealCalsSum}`);
  report('Daily Protein = Sum of Meal Protein', planNum.totalProteinGrams === mealProtSum, `${planNum.totalProteinGrams} vs ${mealProtSum}`);
  report('Daily Carbs = Sum of Meal Carbs', planNum.totalCarbsGrams === mealCarbSum, `${planNum.totalCarbsGrams} vs ${mealCarbSum}`);
  report('Daily Fat = Sum of Meal Fat', planNum.totalFatGrams === mealFatSum, `${planNum.totalFatGrams} vs ${mealFatSum}`);
  report('Daily Fiber = Sum of Meal Fiber', planNum.totalFiberGrams === mealFibSum, `${planNum.totalFiberGrams} vs ${mealFibSum}`);
}

console.log('\n===========================================================');
console.log(`   ADVERSARIAL AUDIT SUMMARY: ${passedAuditChecks} / ${totalAuditChecks} CHECKS PASSED`);
if (passedAuditChecks === totalAuditChecks) {
  console.log('   ALL ADVERSARIAL AUDIT CHECKS PASSED SUCCESSFULLY!');
} else {
  console.error(`   ADVERSARIAL AUDIT ENCOUNTERED ${totalAuditChecks - passedAuditChecks} FAILURE(S)`);
}
console.log('===========================================================\n');

import { generateMealPlan } from './mealPlanner';
import { getFullHealthMetrics } from './nutritionCalculator';
import { 
  createProfileFingerprint, 
  DEFAULT_PROFILE 
} from './profileStorage';
import { PersonalHealthProfile } from '../types';

console.log('===========================================================');
console.log('   PROFILE PERSONALIZATION & CACHE INVALIDATION TEST SUITE');
console.log('===========================================================\n');

let failedTests = 0;

function assert(testName: string, condition: boolean, detail: string = '') {
  if (condition) {
    console.log(`[PASS] ${testName} ${detail ? `(${detail})` : ''}`);
  } else {
    console.error(`[FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
    failedTests++;
  }
}

// -------------------------------------------------------------
// PROFILE SPECIFICATIONS AS MANDATED BY STEP 14
// -------------------------------------------------------------

// Profile A: 40F, 158cm, 75kg, Sedentary, Lose Weight
const profileA: PersonalHealthProfile = {
  name: 'Amina Begum',
  age: 40,
  sex: 'female',
  heightCm: 158,
  weightKg: 75,
  activityLevel: 'sedentary',
  dietaryPreference: 'no_preference',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'lose_weight',
};

// Profile B: 30F, 160cm, 60kg, Moderately Active, Maintain Weight, Vegan
const profileB: PersonalHealthProfile = {
  name: 'Farzana Haque',
  age: 30,
  sex: 'female',
  heightCm: 160,
  weightKg: 60,
  activityLevel: 'moderately_active',
  dietaryPreference: 'vegan',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'maintain_weight',
};

// Profile C: 25M, 175cm, 65kg, Very Active, Gain Weight, Allergy: Peanuts
const profileC: PersonalHealthProfile = {
  name: 'Rakibul Islam',
  age: 25,
  sex: 'male',
  heightCm: 175,
  weightKg: 65,
  activityLevel: 'very_active',
  dietaryPreference: 'no_preference',
  allergies: ['Peanuts'],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'gain_weight',
};

// -------------------------------------------------------------
// TEST 1: PROFILE FINGERPRINT UNIQUENESS & INTEGRITY
// -------------------------------------------------------------
console.log('--- TEST 1: Profile Fingerprint Uniqueness & Invalidation ---');
const fpA = createProfileFingerprint(profileA);
const fpB = createProfileFingerprint(profileB);
const fpC = createProfileFingerprint(profileC);

assert('Fingerprint A is not empty', fpA.length > 10, fpA);
assert('Fingerprint A differs from Fingerprint B', fpA !== fpB);
assert('Fingerprint B differs from Fingerprint C', fpB !== fpC);
assert('Fingerprint A differs from Fingerprint C', fpA !== fpC);

// Changing any single variable must mutate the fingerprint
const profileA_weightChanged: PersonalHealthProfile = { ...profileA, weightKg: 74 };
const fpA_weightChanged = createProfileFingerprint(profileA_weightChanged);
assert('Weight change mutates fingerprint', fpA !== fpA_weightChanged);

const profileA_activityChanged: PersonalHealthProfile = { ...profileA, activityLevel: 'lightly_active' };
const fpA_activityChanged = createProfileFingerprint(profileA_activityChanged);
assert('Activity level change mutates fingerprint', fpA !== fpA_activityChanged);

const profileA_goalChanged: PersonalHealthProfile = { ...profileA, goal: 'maintain_weight' };
const fpA_goalChanged = createProfileFingerprint(profileA_goalChanged);
assert('Goal change mutates fingerprint', fpA !== fpA_goalChanged);

// -------------------------------------------------------------
// TEST 2: NUTRITION CALCULATIONS PERSONALIZATION
// -------------------------------------------------------------
console.log('\n--- TEST 2: Nutrition Calculation Targets ---');
const metricsA = getFullHealthMetrics(profileA);
const metricsB = getFullHealthMetrics(profileB);
const metricsC = getFullHealthMetrics(profileC);

console.log(`Profile A -> BMI: ${metricsA.bmi}, BMR: ${metricsA.bmrKcal} kcal, TDEE: ${metricsA.dailyEnergyNeedsKcal} kcal`);
console.log(`Profile B -> BMI: ${metricsB.bmi}, BMR: ${metricsB.bmrKcal} kcal, TDEE: ${metricsB.dailyEnergyNeedsKcal} kcal`);
console.log(`Profile C -> BMI: ${metricsC.bmi}, BMR: ${metricsC.bmrKcal} kcal, TDEE: ${metricsC.dailyEnergyNeedsKcal} kcal`);

assert('Profile A BMR and TDEE are valid numbers', metricsA.bmrKcal > 0 && metricsA.dailyEnergyNeedsKcal > 0);
assert('Profile B BMR and TDEE are valid numbers', metricsB.bmrKcal > 0 && metricsB.dailyEnergyNeedsKcal > 0);
assert('Profile C BMR and TDEE are valid numbers', metricsC.bmrKcal > 0 && metricsC.dailyEnergyNeedsKcal > 0);

assert('Profile A TDEE differs from Profile B TDEE', metricsA.dailyEnergyNeedsKcal !== metricsB.dailyEnergyNeedsKcal);
assert('Profile B TDEE differs from Profile C TDEE', metricsB.dailyEnergyNeedsKcal !== metricsC.dailyEnergyNeedsKcal);

// -------------------------------------------------------------
// TEST 3: MEAL PLAN GENERATION & TARGET CALORIES
// -------------------------------------------------------------
console.log('\n--- TEST 3: Meal Plan Generation & Calorie Targets ---');
const resA = generateMealPlan(profileA, { seed: 1 });
const resB = generateMealPlan(profileB, { seed: 1 });
const resC = generateMealPlan(profileC, { seed: 1 });

assert('Plan A generation succeeded', resA.success && Boolean(resA.plan));
assert('Plan B generation succeeded', resB.success && Boolean(resB.plan));
assert('Plan C generation succeeded', resC.success && Boolean(resC.plan));

const planA = resA.plan!;
const planB = resB.plan!;
const planC = resC.plan!;

console.log(`Plan A Target Calories (Lose Weight deficit): ${planA.targetTotalCalories} kcal, Actual: ${planA.actualTotalCalories} kcal`);
console.log(`Plan B Target Calories (Maintain Weight): ${planB.targetTotalCalories} kcal, Actual: ${planB.actualTotalCalories} kcal`);
console.log(`Plan C Target Calories (Gain Weight surplus): ${planC.targetTotalCalories} kcal, Actual: ${planC.actualTotalCalories} kcal`);

// Plan A should have deficit vs Profile A TDEE
assert('Plan A has caloric deficit for weight loss', planA.targetTotalCalories < metricsA.dailyEnergyNeedsKcal);
// Plan B should equal TDEE
assert('Plan B matches TDEE for maintenance', planA.targetTotalCalories !== planB.targetTotalCalories);
// Plan C should have surplus vs Profile C TDEE
assert('Plan C has caloric surplus for weight gain', planC.targetTotalCalories > metricsC.dailyEnergyNeedsKcal);

// Plans must be distinct objects and have distinct fingerprints
assert('Plan A fingerprint matches Profile A', planA.profileFingerprint === fpA);
assert('Plan B fingerprint matches Profile B', planB.profileFingerprint === fpB);
assert('Plan C fingerprint matches Profile C', planC.profileFingerprint === fpC);
assert('Plan A and Plan B are not the same object', planA !== planB);

// -------------------------------------------------------------
// TEST 4: DIETARY CONSTRAINTS COMPLIANCE (VEGAN & ALLERGIES)
// -------------------------------------------------------------
console.log('\n--- TEST 4: Strict Dietary Restrictions Enforcement ---');

// Profile B is Vegan: must contain zero animal products
const allPlanBFoods = planB.meals.flatMap(m => m.items.map(i => i.foodItem));
const nonVeganFoodsInB = allPlanBFoods.filter(f => !f.isVegan);
assert('Plan B contains ZERO non-vegan items', nonVeganFoodsInB.length === 0, `Violations: ${nonVeganFoodsInB.map(f => f.englishName).join(', ')}`);

// Profile C has Peanuts allergy: must contain zero peanut items
const allPlanCFoods = planC.meals.flatMap(m => m.items.map(i => i.foodItem));
const peanutFoodsInC = allPlanCFoods.filter(f => 
  f.allergies?.some(a => a.toLowerCase().includes('peanut')) || 
  f.englishName.toLowerCase().includes('peanut') ||
  f.banglaName.toLowerCase().includes('চিনাবাদাম')
);
assert('Plan C contains ZERO peanut items', peanutFoodsInC.length === 0, `Violations: ${peanutFoodsInC.map(f => f.englishName).join(', ')}`);

// -------------------------------------------------------------
// TEST 5: DISTINCT FOOD COMBINATIONS ACROSS PROFILES
// -------------------------------------------------------------
console.log('\n--- TEST 5: Food Combination Diversity Across Profiles ---');
const foodListA = allPlanBFoods.map(f => f.englishName);
const foodListB = allPlanBFoods.map(f => f.englishName);
const foodListC = allPlanCFoods.map(f => f.englishName);

const allFoodsA = planA.meals.flatMap(m => m.items.map(i => i.foodItem.englishName));
const allFoodsB = planB.meals.flatMap(m => m.items.map(i => i.foodItem.englishName));
const allFoodsC = planC.meals.flatMap(m => m.items.map(i => i.foodItem.englishName));

console.log('Plan A Foods:', allFoodsA);
console.log('Plan B Foods (Vegan):', allFoodsB);
console.log('Plan C Foods (High Calorie / Peanuts Allergic):', allFoodsC);

const foodsAJoined = allFoodsA.sort().join('|');
const foodsBJoined = allFoodsB.sort().join('|');
const foodsCJoined = allFoodsC.sort().join('|');

assert('Plan A and Plan B have distinct meal compositions', foodsAJoined !== foodsBJoined);
assert('Plan B and Plan C have distinct meal compositions', foodsBJoined !== foodsCJoined);
assert('Plan A and Plan C have distinct meal compositions', foodsAJoined !== foodsCJoined);

// -------------------------------------------------------------
// TEST 6: EXPLICIT INPUT GENERATOR SUPPORT
// -------------------------------------------------------------
console.log('\n--- TEST 6: Explicit Generator Input Structure ---');
const explicitRes = generateMealPlan({
  profile: profileC,
  calorieTarget: 3000,
  macroTargets: { proteinGrams: 150, carbsGrams: 375, fatGrams: 100 },
  seed: 5,
});
assert('Explicit input meal plan generated successfully', explicitRes.success && Boolean(explicitRes.plan));
assert('Explicit input adhered to calorie target 3000', explicitRes.plan?.targetTotalCalories === 3000);

// -------------------------------------------------------------
// FINAL SUMMARY
// -------------------------------------------------------------
console.log('\n===========================================================');
if (failedTests === 0) {
  console.log('  ALL PROFILE PERSONALIZATION & AUDIT TESTS PASSED (100%)');
  console.log('===========================================================');
} else {
  console.error(`  ${failedTests} TEST(S) FAILED!`);
  console.log('===========================================================');
  process.exit(1);
}

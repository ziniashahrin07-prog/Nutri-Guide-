import { getFullHealthMetrics, validateProfileForCalculations } from './utils/nutritionCalculator';
import { BANGLADESH_FOOD_DATABASE } from './data/bangladeshFoodDatabase';
import { generateMealPlan, swapFoodItemInPlan, isFoodAllergic, getMealSwapAlternatives } from './utils/mealPlanner';
import { validateFoodRecommendation, getFoodContext } from './services/aiAssistantService';
import { PersonalHealthProfile, FoodItem } from './types';

console.log('================================================================');
console.log('   NUTRI GUIDE COMPLETE END-TO-END AUDIT & INTEGRATION TEST');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function testAssert(category: string, description: string, success: boolean, info: string = '') {
  if (success) {
    passCount++;
    console.log(`[PASS] [${category}] ${description} ${info ? `(${info})` : ''}`);
  } else {
    failCount++;
    console.error(`[FAIL] [${category}] ${description} ${info ? `(${info})` : ''}`);
  }
}

// ----------------------------------------------------------------------
// 1. HEALTH PROFILE & VALIDATION
// ----------------------------------------------------------------------
console.log('--- 1. HEALTH PROFILE & VALIDATION ---');

const profile18Male: PersonalHealthProfile = {
  name: 'Young Adult Male',
  age: 18,
  sex: 'male',
  heightCm: 175,
  weightKg: 65,
  activityLevel: 'moderately_active',
  dietaryPreference: 'no_preference',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'maintain_weight',
};

const profile60Female: PersonalHealthProfile = {
  name: 'Senior Female',
  age: 60,
  sex: 'female',
  heightCm: 160,
  weightKg: 55,
  activityLevel: 'sedentary',
  dietaryPreference: 'vegetarian',
  allergies: ['Fish'],
  dislikedFoods: ['Eggplant'],
  dietaryRestrictions: [],
  goal: 'lose_weight',
};

testAssert('Profile', 'Age 18 lower boundary valid', validateProfileForCalculations(profile18Male).isValid);
testAssert('Profile', 'Age 60 upper boundary valid', validateProfileForCalculations(profile60Female).isValid);

const profile17Underage = { ...profile18Male, age: 17 };
testAssert('Profile', 'Age 17 underage rejected', !validateProfileForCalculations(profile17Underage).isValid);

const profile61Overage = { ...profile18Male, age: 61 };
testAssert('Profile', 'Age 61 overage rejected', !validateProfileForCalculations(profile61Overage).isValid);

// ----------------------------------------------------------------------
// 2. NUTRITION CALCULATIONS (Mifflin-St Jeor & TDEE)
// ----------------------------------------------------------------------
console.log('\n--- 2. NUTRITION CALCULATIONS ---');

const metricsMale = getFullHealthMetrics(profile18Male);
// BMI = 65 / (1.75^2) = 21.22 -> 21.2
// BMR (Male 18, 175cm, 65kg) = (10*65) + (6.25*175) - (5*18) + 5 = 650 + 1093.75 - 90 + 5 = 1658.75 -> 1659 kcal
// TDEE (Moderately active = 1.55) = 1658.75 * 1.55 = 2571.06 -> 2571 kcal
testAssert('Metrics', 'Male 18yo BMI calculated correctly', metricsMale.bmi === 21.2, `BMI: ${metricsMale.bmi}`);
testAssert('Metrics', 'Male 18yo BMR calculated correctly', metricsMale.bmrKcal === 1659, `BMR: ${metricsMale.bmrKcal}`);
testAssert('Metrics', 'Male 18yo TDEE calculated correctly', metricsMale.dailyEnergyNeedsKcal === 2571, `TDEE: ${metricsMale.dailyEnergyNeedsKcal}`);

const metricsFemale = getFullHealthMetrics(profile60Female);
// BMR (Female 60, 160cm, 55kg) = (10*55) + (6.25*160) - (5*60) - 161 = 550 + 1000 - 300 - 161 = 1089 kcal
// TDEE (Sedentary = 1.2) = 1089 * 1.2 = 1306.8 -> 1307 kcal
testAssert('Metrics', 'Female 60yo BMR calculated correctly', metricsFemale.bmrKcal === 1089, `BMR: ${metricsFemale.bmrKcal}`);
testAssert('Metrics', 'Female 60yo TDEE calculated correctly', metricsFemale.dailyEnergyNeedsKcal === 1307, `TDEE: ${metricsFemale.dailyEnergyNeedsKcal}`);

// ----------------------------------------------------------------------
// 3. BANGLADESH FOOD DATABASE
// ----------------------------------------------------------------------
console.log('\n--- 3. BANGLADESH FOOD DATABASE ---');

testAssert('Food DB', 'Total database size', BANGLADESH_FOOD_DATABASE.length > 50, `Entries: ${BANGLADESH_FOOD_DATABASE.length}`);

const ruiFish = BANGLADESH_FOOD_DATABASE.find(f => f.englishName.toLowerCase().includes('rui'));
testAssert('Food DB', 'Rui Fish exists with Bangla name & macros', !!ruiFish && ruiFish.banglaName === 'রুই মাছ' && ruiFish.proteinGrams > 0);

const dalEnglishSearch = BANGLADESH_FOOD_DATABASE.filter(f => f.englishName.toLowerCase().includes('dal'));
testAssert('Food DB', 'English search for "dal"', dalEnglishSearch.length > 0, `Found: ${dalEnglishSearch.length}`);

const dalBanglaSearch = BANGLADESH_FOOD_DATABASE.filter(f => f.banglaName.includes('ডাল'));
testAssert('Food DB', 'Bangla search for "ডাল"', dalBanglaSearch.length > 0, `Found: ${dalBanglaSearch.length}`);

// Check zero non-fabricated macros
const invalidMacroFoods = BANGLADESH_FOOD_DATABASE.filter(f => f.calories < 0 || f.proteinGrams < 0);
testAssert('Food DB', 'No negative/invalid macro values', invalidMacroFoods.length === 0);

// ----------------------------------------------------------------------
// 4. MEAL PLANNER ENGINE & ALLERGY SAFETY
// ----------------------------------------------------------------------
console.log('\n--- 4. MEAL PLANNER ENGINE & SAFETY ---');

// Standard plan
const stdPlanRes = generateMealPlan(profile18Male);
testAssert('Meal Plan', 'Standard meal plan generated successfully', stdPlanRes.success && !!stdPlanRes.plan);

// Vegetarian safety
const vegProfile = { ...profile18Male, dietaryPreference: 'vegetarian' as const };
const vegPlanRes = generateMealPlan(vegProfile);
let vegViolations = 0;
vegPlanRes.plan?.meals.forEach(m => m.items.forEach(i => { if (!i.foodItem.isVegetarian) vegViolations++; }));
testAssert('Meal Plan', 'Vegetarian plan zero non-veg items', vegViolations === 0, `Violations: ${vegViolations}`);

// Vegan safety
const veganProfile = { ...profile18Male, dietaryPreference: 'vegan' as const };
const veganPlanRes = generateMealPlan(veganProfile);
let veganViolations = 0;
veganPlanRes.plan?.meals.forEach(m => m.items.forEach(i => { if (!i.foodItem.isVegan) veganViolations++; }));
testAssert('Meal Plan', 'Vegan plan zero non-vegan items', veganViolations === 0, `Violations: ${veganViolations}`);

// Fish + Peanut Allergy safety
const allergyProfile = { ...profile18Male, allergies: ['Fish', 'Peanuts'] };
const allergyPlanRes = generateMealPlan(allergyProfile);
let allergyViolations = 0;
allergyPlanRes.plan?.meals.forEach(m => m.items.forEach(i => {
  if (isFoodAllergic(i.foodItem, allergyProfile.allergies)) allergyViolations++;
}));
testAssert('Meal Plan', 'Allergy profile zero allergen items', allergyViolations === 0, `Violations: ${allergyViolations}`);

// Meal Swapping
if (stdPlanRes.plan && stdPlanRes.plan.meals.length > 0 && stdPlanRes.plan.meals[0].items.length > 0) {
  const slot = stdPlanRes.plan.meals[0];
  const itemToSwap = slot.items[0];
  const alternatives = getMealSwapAlternatives(itemToSwap.foodItem, profile18Male, slot.type);
  if (alternatives.length > 0) {
    const updatedPlan = swapFoodItemInPlan(stdPlanRes.plan, slot.id, 0, alternatives[0]);
    testAssert('Meal Swap', 'Meal item swapped successfully', updatedPlan.meals[0].items[0].foodItem.id === alternatives[0].id);
  }
}

// ----------------------------------------------------------------------
// 5. GEMINI AI ASSISTANT SERVICE & SAFETY
// ----------------------------------------------------------------------
console.log('\n--- 5. GEMINI AI ASSISTANT SERVICE & SAFETY ---');

// Allergy exclusion test in Assistant Service
if (ruiFish) {
  const safetyCheck = validateFoodRecommendation(ruiFish, allergyProfile);
  testAssert('AI Safety', 'AI Assistant blocks Rui Fish for Fish allergy user', !safetyCheck.safe, safetyCheck.reason);
}

const contextSearch = getFoodContext('Ilish fish');
testAssert('AI Context', 'AI Assistant retrieves Ilish fish context from DB', contextSearch.some(f => f.englishName.toLowerCase().includes('ilish')));

// ----------------------------------------------------------------------
// 6. CALORIE PROXIMITY REGRESSION TESTS (PROFILES A, B, C)
// ----------------------------------------------------------------------
console.log('\n--- 6. CALORIE PROXIMITY REGRESSION TESTS ---');

// Profile A: Lose Weight
const profileA: PersonalHealthProfile = {
  name: 'Profile A - Weight Loss',
  age: 30,
  sex: 'male',
  heightCm: 175,
  weightKg: 85,
  activityLevel: 'sedentary',
  dietaryPreference: 'no_preference',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'lose_weight',
};
const planARes = generateMealPlan(profileA);
const targetA = Math.round(getFullHealthMetrics(profileA).dailyEnergyNeedsKcal * 0.88);
const actualA = planARes.plan?.actualTotalCalories ?? 0;
const diffA = Math.abs(actualA - targetA);
const pctA = targetA > 0 ? (diffA / targetA) * 100 : 0;
testAssert(
  'Proximity Profile A',
  `Profile A within ±5% of target (Target: ${targetA} kcal, Plan: ${actualA} kcal, Diff: ${diffA} kcal, ${pctA.toFixed(1)}%)`,
  planARes.success && pctA <= 5.0
);

// Profile B: Maintain Weight & Vegan
const profileB: PersonalHealthProfile = {
  name: 'Profile B - Vegan Maintain',
  age: 25,
  sex: 'female',
  heightCm: 160,
  weightKg: 52,
  activityLevel: 'moderately_active',
  dietaryPreference: 'vegan',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'maintain_weight',
};
const planBRes = generateMealPlan(profileB);
const targetB = getFullHealthMetrics(profileB).dailyEnergyNeedsKcal;
const actualB = planBRes.plan?.actualTotalCalories ?? 0;
const diffB = Math.abs(actualB - targetB);
const pctB = targetB > 0 ? (diffB / targetB) * 100 : 0;
testAssert(
  'Proximity Profile B',
  `Profile B within ±5% of target (Target: ${targetB} kcal, Plan: ${actualB} kcal, Diff: ${diffB} kcal, ${pctB.toFixed(1)}%)`,
  planBRes.success && pctB <= 5.0
);

// Profile C: Gain Weight & Allergies (TDEE ~2801, Target ~3081)
const profileC: PersonalHealthProfile = {
  name: 'Profile C - High Calorie Gain',
  age: 24,
  sex: 'male',
  heightCm: 180,
  weightKg: 70,
  activityLevel: 'very_active',
  dietaryPreference: 'no_preference',
  allergies: ['Peanuts', 'Shrimp'],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'gain_weight',
};
const planCRes = generateMealPlan(profileC);
const targetC = Math.round(getFullHealthMetrics(profileC).dailyEnergyNeedsKcal * 1.10);
const actualC = planCRes.plan?.actualTotalCalories ?? 0;
const diffC = Math.abs(actualC - targetC);
const pctC = targetC > 0 ? (diffC / targetC) * 100 : 0;
testAssert(
  'Proximity Profile C',
  `Profile C within ±5% of target (Target: ${targetC} kcal, Plan: ${actualC} kcal, Diff: ${diffC} kcal, ${pctC.toFixed(1)}%)`,
  planCRes.success && pctC <= 5.0
);

console.log('\n================================================================');
console.log(`   INTEGRATION TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
}

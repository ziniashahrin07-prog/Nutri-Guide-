import { 
  generateMealPlan, 
  getMealSwapAlternatives, 
  swapFoodItemInPlan, 
  toggleSlotSkippedInPlan, 
  isFoodAllergic,
  getCompatibleFoods,
  isFoodDisliked
} from './mealPlanner';
import { clearRotationMemory } from './foodRotationMemory';
import { PersonalHealthProfile } from '../types';
import { BANGLADESH_FOOD_DATABASE } from '../data/bangladeshFoodDatabase';

console.log('===========================================================');
console.log('   PERSONALIZED MEAL PLANNER ENGINE - SUITE TEST VERIFICATION');
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

// Baseline male profile
const baseMaleProfile: PersonalHealthProfile = {
  name: 'Anisur Rahman',
  age: 30,
  sex: 'male',
  heightCm: 175,
  weightKg: 75,
  activityLevel: 'moderately_active',
  dietaryPreference: 'no_preference',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'maintain_weight',
};

// Baseline female profile
const baseFemaleProfile: PersonalHealthProfile = {
  name: 'Nusrat Jahan',
  age: 28,
  sex: 'female',
  heightCm: 162,
  weightKg: 58,
  activityLevel: 'lightly_active',
  dietaryPreference: 'no_preference',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'maintain_weight',
};

// -----------------------------------------------------------------
// 1. Standard Male Profile
// -----------------------------------------------------------------
console.log('--- TEST 1: Standard Male Profile ---');
const res1 = generateMealPlan(baseMaleProfile, { seed: 1 });
assert('Standard Male Plan Generation Success', res1.success);
if (res1.plan) {
  assert('Has 5 Meal Slots', res1.plan.meals.length === 5);
  assert('Actual Calories Close to Target', Math.abs(res1.plan.actualTotalCalories - res1.plan.targetTotalCalories) < 150, `Actual: ${res1.plan.actualTotalCalories}, Target: ${res1.plan.targetTotalCalories}`);
}

// -----------------------------------------------------------------
// 2. Standard Female Profile
// -----------------------------------------------------------------
console.log('\n--- TEST 2: Standard Female Profile ---');
const res2 = generateMealPlan(baseFemaleProfile, { seed: 1 });
assert('Standard Female Plan Generation Success', res2.success);
if (res2.plan) {
  assert('Target Calories Calibrated to Female Profile', res2.plan.targetTotalCalories < (res1.plan?.targetTotalCalories || 3000), `Female Target: ${res2.plan.targetTotalCalories} kcal`);
}

// -----------------------------------------------------------------
// 3. Maintain-Weight Profile
// -----------------------------------------------------------------
console.log('\n--- TEST 3: Maintain Weight Goal ---');
const resMaintain = generateMealPlan({ ...baseMaleProfile, goal: 'maintain_weight' }, { seed: 1 });
assert('Maintain Weight Plan Success', resMaintain.success);

// -----------------------------------------------------------------
// 4. Weight-Loss Profile
// -----------------------------------------------------------------
console.log('\n--- TEST 4: Weight Loss Goal (Cautious Approach) ---');
const resLoss = generateMealPlan({ ...baseMaleProfile, goal: 'lose_weight' }, { seed: 1 });
assert('Weight Loss Plan Success', resLoss.success);
if (resLoss.plan && resMaintain.plan) {
  assert('Weight Loss Target < Maintenance Target', resLoss.plan.targetTotalCalories < resMaintain.plan.targetTotalCalories, `Loss Target: ${resLoss.plan.targetTotalCalories} vs Maintain Target: ${resMaintain.plan.targetTotalCalories}`);
}

// -----------------------------------------------------------------
// 5. Weight-Gain Profile
// -----------------------------------------------------------------
console.log('\n--- TEST 5: Weight Gain Goal (Cautious Surplus) ---');
const resGain = generateMealPlan({ ...baseMaleProfile, goal: 'gain_weight' }, { seed: 1 });
assert('Weight Gain Plan Success', resGain.success);
if (resGain.plan && resMaintain.plan) {
  assert('Weight Gain Target > Maintenance Target', resGain.plan.targetTotalCalories > resMaintain.plan.targetTotalCalories, `Gain Target: ${resGain.plan.targetTotalCalories} vs Maintain Target: ${resMaintain.plan.targetTotalCalories}`);
}

// -----------------------------------------------------------------
// 6. Vegetarian Profile
// -----------------------------------------------------------------
console.log('\n--- TEST 6: Vegetarian Profile ---');
const resVeg = generateMealPlan({ ...baseMaleProfile, dietaryPreference: 'vegetarian' }, { seed: 1 });
assert('Vegetarian Plan Success', resVeg.success);
if (resVeg.plan) {
  const nonVeg = resVeg.plan.meals.flatMap(m => m.items).filter(i => !i.foodItem.isVegetarian);
  assert('Zero Non-Vegetarian Items Allowed', nonVeg.length === 0, `Violations: ${nonVeg.length}`);
}

// -----------------------------------------------------------------
// 7. Vegan Profile
// -----------------------------------------------------------------
console.log('\n--- TEST 7: Vegan Profile ---');
const resVegan = generateMealPlan({ ...baseMaleProfile, dietaryPreference: 'vegan' }, { seed: 1 });
assert('Vegan Plan Success', resVegan.success);
if (resVegan.plan) {
  const nonVegan = resVegan.plan.meals.flatMap(m => m.items).filter(i => !i.foodItem.isVegan);
  assert('Zero Non-Vegan Items Allowed', nonVegan.length === 0, `Violations: ${nonVegan.length}`);
}

// -----------------------------------------------------------------
// 8. Fish Allergy Profile
// -----------------------------------------------------------------
console.log('\n--- TEST 8: Fish Allergy Profile ---');
const resFishAllergy = generateMealPlan({ ...baseMaleProfile, allergies: ['Fish'] }, { seed: 1 });
assert('Fish Allergy Plan Success', resFishAllergy.success);
if (resFishAllergy.plan) {
  const allergic = resFishAllergy.plan.meals.flatMap(m => m.items).filter(i => isFoodAllergic(i.foodItem, ['Fish']));
  assert('Zero Fish Items Present', allergic.length === 0, `Violations: ${allergic.length}`);
}

// -----------------------------------------------------------------
// 9. Peanut Allergy Profile
// -----------------------------------------------------------------
console.log('\n--- TEST 9: Peanut Allergy Profile ---');
const resPeanutAllergy = generateMealPlan({ ...baseMaleProfile, allergies: ['Peanuts'] }, { seed: 1 });
assert('Peanut Allergy Plan Success', resPeanutAllergy.success);
if (resPeanutAllergy.plan) {
  const allergic = resPeanutAllergy.plan.meals.flatMap(m => m.items).filter(i => isFoodAllergic(i.foodItem, ['Peanuts']));
  assert('Zero Peanut Items Present', allergic.length === 0, `Violations: ${allergic.length}`);
}

// -----------------------------------------------------------------
// 10. Disliked Food Profile
// -----------------------------------------------------------------
console.log('\n--- TEST 10: Disliked Food Profile ---');
const resDisliked = generateMealPlan({ ...baseMaleProfile, dislikedFoods: ['Hilsa', 'Okra'] }, { seed: 1 });
assert('Disliked Food Plan Success', resDisliked.success);
if (resDisliked.plan) {
  const dislikedItems = resDisliked.plan.meals.flatMap(m => m.items).filter(i => isFoodDisliked(i.foodItem, ['Hilsa', 'Okra']));
  assert('Disliked Foods Avoided in Plan', dislikedItems.length === 0, `Violations: ${dislikedItems.length}`);
}

// -----------------------------------------------------------------
// 11. Same Profile + Same Seed → Identical Plan
// -----------------------------------------------------------------
console.log('\n--- TEST 11: Deterministic Plan Generation (Same Seed) ---');
clearRotationMemory();
const planSeed1A = generateMealPlan(baseMaleProfile, { seed: 42 });
clearRotationMemory();
const planSeed1B = generateMealPlan(baseMaleProfile, { seed: 42 });
assert('Same Seed Yields Success Both Times', planSeed1A.success && planSeed1B.success);
if (planSeed1A.plan && planSeed1B.plan) {
  const foodIdsA = planSeed1A.plan.meals.flatMap(m => m.items.map(i => i.foodItem.id)).join(',');
  const foodIdsB = planSeed1B.plan.meals.flatMap(m => m.items.map(i => i.foodItem.id)).join(',');
  assert('Same Seed Yields Identical Food Sequence', foodIdsA === foodIdsB, `Sequence A: ${foodIdsA.slice(0, 30)}...`);
}

// -----------------------------------------------------------------
// 12. Same Profile + Different Seed → Different Food Selections
// -----------------------------------------------------------------
console.log('\n--- TEST 12: Seed Variation (Different Seeds) ---');
const planSeed2A = generateMealPlan(baseMaleProfile, { seed: 10 });
const planSeed2B = generateMealPlan(baseMaleProfile, { seed: 99 });
if (planSeed2A.plan && planSeed2B.plan) {
  const foodIds2A = planSeed2A.plan.meals.flatMap(m => m.items.map(i => i.foodItem.id)).join(',');
  const foodIds2B = planSeed2B.plan.meals.flatMap(m => m.items.map(i => i.foodItem.id)).join(',');
  assert('Different Seed Yields Different Food Selection', foodIds2A !== foodIds2B, `Seed 10 vs Seed 99 differ as expected`);
}

// -----------------------------------------------------------------
// 13. Regenerated Plans Contain Valid Database Foods
// -----------------------------------------------------------------
console.log('\n--- TEST 13: Database Validity Check ---');
if (planSeed2B.plan) {
  const dbItemIds = new Set(BANGLADESH_FOOD_DATABASE.map(f => f.id));
  const invalidItems = planSeed2B.plan.meals.flatMap(m => m.items).filter(i => !dbItemIds.has(i.foodItem.id));
  assert('All Generated Foods Originate from DB', invalidItems.length === 0);
}

// -----------------------------------------------------------------
// 14-16. Safety Verification Across Multiple Seeds
// -----------------------------------------------------------------
console.log('\n--- TEST 14-16: Allergy, Preference & Dislike Safety Across Seeds ---');
const complexProfile: PersonalHealthProfile = {
  ...baseMaleProfile,
  dietaryPreference: 'vegetarian',
  allergies: ['Peanuts'],
  dislikedFoods: ['Okra'],
};
let multiSeedSafetyPassed = true;
for (let s = 1; s <= 5; s++) {
  const testRes = generateMealPlan(complexProfile, { seed: s });
  if (!testRes.plan) { multiSeedSafetyPassed = false; break; }
  const items = testRes.plan.meals.flatMap(m => m.items);
  const vegViol = items.filter(i => !i.foodItem.isVegetarian);
  const allergyViol = items.filter(i => isFoodAllergic(i.foodItem, complexProfile.allergies));
  const dislikeViol = items.filter(i => isFoodDisliked(i.foodItem, complexProfile.dislikedFoods));
  if (vegViol.length > 0 || allergyViol.length > 0 || dislikeViol.length > 0) {
    multiSeedSafetyPassed = false;
  }
}
assert('Zero Safety Violations Across 5 Seeds', multiSeedSafetyPassed);

// -----------------------------------------------------------------
// 17. No Impossible or Negative Portions
// -----------------------------------------------------------------
console.log('\n--- TEST 17: Valid Portion Sizes ---');
if (res1.plan) {
  const invalidPortions = res1.plan.meals.flatMap(m => m.items).filter(i => i.portionMultiplier <= 0 || i.calories <= 0);
  assert('All Portions & Calories Positive', invalidPortions.length === 0);
}

// -----------------------------------------------------------------
// 18. Daily Calories Close to Target
// -----------------------------------------------------------------
console.log('\n--- TEST 18: Calorie Precision Match ---');
if (res1.plan) {
  const diff = Math.abs(res1.plan.actualTotalCalories - res1.plan.targetTotalCalories);
  assert('Actual Daily Calories Within 150 kcal of Target', diff <= 150, `Diff: ${diff} kcal`);
}

// -----------------------------------------------------------------
// 19. Intra-day Food Uniqueness (No Unnecessary Repetition)
// -----------------------------------------------------------------
console.log('\n--- TEST 19: Intra-day Food Uniqueness ---');
if (res1.plan) {
  const itemIds = res1.plan.meals.flatMap(m => m.items.map(i => i.foodItem.id));
  const uniqueItemIds = new Set(itemIds);
  assert('No Repeated Foods Within the Same Daily Plan', itemIds.length === uniqueItemIds.size, `Total items: ${itemIds.length}, Unique: ${uniqueItemIds.size}`);
}

console.log('\n===========================================================');
if (failedTests === 0) {
  console.log('   ALL 19 MEAL PLANNER ENGINE TESTS PASSED (0 FAILURES)');
} else {
  console.error(`   MEAL PLANNER ENGINE TESTS FAILED WITH ${failedTests} FAILURE(S)`);
}
console.log('===========================================================\n');

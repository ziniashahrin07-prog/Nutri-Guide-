import { generateMealPlan, getMealSwapAlternatives } from './mealPlanner';
import { 
  checkFoodPairCompatibility, 
  validateMealCombination, 
  validateDailyMealPlan, 
  isDietaryCompliant 
} from './mealCoherence';
import { BANGLADESH_FOOD_DATABASE } from '../data/bangladeshFoodDatabase';
import { PersonalHealthProfile } from '../types';

console.log('===========================================================');
console.log('   MEAL COHERENCE & COMPATIBILITY ENGINE - AUDIT TESTS');
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

const oats = BANGLADESH_FOOD_DATABASE.find(f => f.id === 'grain-07')!;
const shutki = BANGLADESH_FOOD_DATABASE.find(f => f.id === 'fish-11')!;
const tomato = BANGLADESH_FOOD_DATABASE.find(f => f.id === 'veg-15')!;
const rice = BANGLADESH_FOOD_DATABASE.find(f => f.id === 'grain-01')!;
const ruiFish = BANGLADESH_FOOD_DATABASE.find(f => f.id === 'fish-01')!;
const palongShak = BANGLADESH_FOOD_DATABASE.find(f => f.id === 'leafy-01')!;
const cowMilk = BANGLADESH_FOOD_DATABASE.find(f => f.id === 'dairy-01')!;
const banana = BANGLADESH_FOOD_DATABASE.find(f => f.id === 'fruit-03')!;
const masoorDal = BANGLADESH_FOOD_DATABASE.find(f => f.id === 'dal-01')!;
const egg = BANGLADESH_FOOD_DATABASE.find(f => f.id === 'egg-01')!;

const standardProfile: PersonalHealthProfile = {
  name: 'Tanvir Ahmed',
  age: 32,
  sex: 'male',
  heightCm: 172,
  weightKg: 70,
  activityLevel: 'moderately_active',
  dietaryPreference: 'no_preference',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'maintain_weight',
};

// -------------------------------------------------------------
// TEST A: Oats + Shutki Pairwise Incompatibility
// -------------------------------------------------------------
console.log('--- TEST A: Incompatible Pair Rejection (Oats + Shutki) ---');
const oatsShutkiCheck = checkFoodPairCompatibility(oats, shutki, 'Lunch');
assert('Oats + Shutki Pair Is Rejected as Incompatible', !oatsShutkiCheck.compatible, oatsShutkiCheck.reason);

// -------------------------------------------------------------
// TEST B: Oats + Shutki + Tomato Meal Combination Rejection
// -------------------------------------------------------------
console.log('\n--- TEST B: Oats + Shutki + Tomato Combination Rejection ---');
const badLunchCheck = validateMealCombination([oats, shutki, tomato], 'Lunch', standardProfile);
assert('Oats + Shutki + Tomato Lunch Is Rejected by Validator', !badLunchCheck.valid, badLunchCheck.errors.join('; '));

// -------------------------------------------------------------
// TEST C: Rice + Rui Fish + Palong Shak Combination Acceptance
// -------------------------------------------------------------
console.log('\n--- TEST C: Authentic Bengali Lunch Acceptance (Rice + Fish + Shak) ---');
const goodLunchCheck = validateMealCombination([rice, ruiFish, palongShak], 'Lunch', standardProfile);
assert('Rice + Rui Fish + Palong Shak Lunch Is Accepted as Valid', goodLunchCheck.valid);

// -------------------------------------------------------------
// TEST D: Fish + Liquid Cow Milk Rejection
// -------------------------------------------------------------
console.log('\n--- TEST D: Fish + Milk Incompatibility ---');
const fishMilkCheck = checkFoodPairCompatibility(ruiFish, cowMilk, 'Lunch');
assert('Fish + Cow Milk Is Rejected as Incompatible', !fishMilkCheck.compatible, fishMilkCheck.reason);

// -------------------------------------------------------------
// TEST E: Oats + Milk/Banana Breakfast Acceptance
// -------------------------------------------------------------
console.log('\n--- TEST E: Oats Porridge Breakfast Acceptance ---');
const oatsBfastCheck = validateMealCombination([oats, cowMilk, banana], 'Breakfast', standardProfile);
assert('Oats + Milk + Banana Breakfast Is Accepted as Valid', oatsBfastCheck.valid);

// -------------------------------------------------------------
// TEST F: Strict Vegan Hard-Constraint Compliance Across 20 Seeds
// -------------------------------------------------------------
console.log('\n--- TEST F: Vegan Hard-Constraint Across 20 Generated Plans ---');
const veganProfile: PersonalHealthProfile = {
  ...standardProfile,
  dietaryPreference: 'vegan',
};
let veganViolations = 0;
for (let s = 1; s <= 20; s++) {
  const gen = generateMealPlan(veganProfile, { seed: s });
  if (!gen.success || !gen.plan) {
    veganViolations++;
    continue;
  }
  const nonVegan = gen.plan.meals.flatMap(m => m.items).filter(i => !i.foodItem.isVegan);
  if (nonVegan.length > 0) {
    veganViolations += nonVegan.length;
    console.error(`Seed ${s} had non-vegan items:`, nonVegan.map(i => i.foodItem.englishName));
  }
}
assert('Zero Non-Vegan Violations in 20 Consecutive Plans', veganViolations === 0, `Violations: ${veganViolations}`);

// -------------------------------------------------------------
// TEST G: Strict Vegetarian Hard-Constraint Across 20 Seeds
// -------------------------------------------------------------
console.log('\n--- TEST G: Vegetarian Hard-Constraint Across 20 Generated Plans ---');
const vegProfile: PersonalHealthProfile = {
  ...standardProfile,
  dietaryPreference: 'vegetarian',
};
let vegViolations = 0;
for (let s = 1; s <= 20; s++) {
  const gen = generateMealPlan(vegProfile, { seed: s });
  if (!gen.success || !gen.plan) {
    vegViolations++;
    continue;
  }
  const nonVeg = gen.plan.meals.flatMap(m => m.items).filter(i => !i.foodItem.isVegetarian);
  if (nonVeg.length > 0) {
    vegViolations += nonVeg.length;
    console.error(`Seed ${s} had non-vegetarian items:`, nonVeg.map(i => i.foodItem.englishName));
  }
}
assert('Zero Non-Vegetarian Violations in 20 Consecutive Plans', vegViolations === 0, `Violations: ${vegViolations}`);

// -------------------------------------------------------------
// TEST H: All Lunch and Dinner Slots Have Valid Staples (Never Oats/Fruits)
// -------------------------------------------------------------
console.log('\n--- TEST H: Lunch/Dinner Staple Validity Across 20 Seeds ---');
let invalidStapleViolations = 0;
for (let s = 1; s <= 20; s++) {
  const gen = generateMealPlan(standardProfile, { seed: s });
  if (!gen.success || !gen.plan) {
    invalidStapleViolations++;
    continue;
  }
  const lunch = gen.plan.meals.find(m => m.type === 'Lunch');
  const dinner = gen.plan.meals.find(m => m.type === 'Dinner');

  const lunchHasOats = lunch?.items.some(i => i.foodItem.id === 'grain-07');
  const dinnerHasOats = dinner?.items.some(i => i.foodItem.id === 'grain-07');

  if (lunchHasOats || dinnerHasOats) {
    invalidStapleViolations++;
  }
}
assert('Zero Lunch/Dinner Slots Feature Oats as Staple across 20 Seeds', invalidStapleViolations === 0);

// -------------------------------------------------------------
// TEST I: Swapping Food in a Shutki Meal Does NOT Offer Milk or Oats
// -------------------------------------------------------------
console.log('\n--- TEST I: Meal Swaps Respect Existing Foods in the Meal ---');
const swapOptionsForVegInShutkiMeal = getMealSwapAlternatives(
  palongShak,
  standardProfile,
  'Lunch',
  [rice, shutki, palongShak]
);
const hasMilkOrOatsInSwap = swapOptionsForVegInShutkiMeal.some(f => f.id === 'dairy-01' || f.id === 'grain-07');
assert('Swap for Side in Shutki Meal Excludes Incompatible Items (Milk/Oats)', !hasMilkOrOatsInSwap);

// -------------------------------------------------------------
// TEST J: Final Validation Gate Rejects Incoherent Daily Plans
// -------------------------------------------------------------
console.log('\n--- TEST J: Validation Gate Catches Incoherent Injected Plans ---');
const testGen = generateMealPlan(standardProfile, { seed: 42 });
if (testGen.plan) {
  // Inject an incompatible food (Oats into Lunch)
  const corruptedPlan = JSON.parse(JSON.stringify(testGen.plan));
  const lunchSlot = corruptedPlan.meals.find((m: any) => m.type === 'Lunch');
  if (lunchSlot) {
    lunchSlot.items[0] = {
      foodItem: oats,
      portionMultiplier: 1.0,
      servingText: '1 portion',
      calories: 250,
      proteinGrams: 9,
      carbsGrams: 45,
      fatGrams: 5,
      fiberGrams: 8,
    };
  }
  const corruptedValidation = validateDailyMealPlan(corruptedPlan, standardProfile);
  assert('Validation Gate Flags Injected Oats-in-Lunch Plan as Invalid', !corruptedValidation.isValid, corruptedValidation.errors[0]);
}

console.log('\n===========================================================');
if (failedTests === 0) {
  console.log('   ALL MEAL COHERENCE & COMPATIBILITY TESTS PASSED (0 FAILURES)');
} else {
  console.error(`   MEAL COHERENCE TESTS FAILED WITH ${failedTests} FAILURE(S)`);
}
console.log('===========================================================\n');

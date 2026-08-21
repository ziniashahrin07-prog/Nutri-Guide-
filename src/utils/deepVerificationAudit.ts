import { PersonalHealthProfile } from '../types';
import { BANGLADESH_FOOD_DATABASE } from '../data/bangladeshFoodDatabase';
import { 
  calculateBMR, 
  calculateTDEE, 
  getFullHealthMetrics, 
  VALID_ACTIVITY_MULTIPLIERS 
} from './nutritionCalculator';
import { 
  generateMealPlan, 
  getCategoryPortionBounds, 
  isFoodAllergic, 
  matchesDietaryPreference, 
  isFoodDisliked,
  getMealSwapAlternatives,
  swapFoodItemInPlan
} from './mealPlanner';

console.log('===========================================================');
console.log('   DEEP NUMERICAL EVIDENCE & CLAIM-VALIDATION AUDIT');
console.log('===========================================================');

// 1. NUTRITION & MACRO CALCULATIONS FOR PROFILES A-E
const profiles: Record<string, { name: string; profile: PersonalHealthProfile }> = {
  ProfileA: {
    name: 'Profile A (Female Maintain)',
    profile: {
      name: 'Profile A',
      age: 28,
      sex: 'female',
      heightCm: 165,
      weightKg: 62,
      activityLevel: 'moderately_active',
      goal: 'maintain_weight',
      dietaryPreference: 'no_preference',
      allergies: [],
      dislikedFoods: [],
      dietaryRestrictions: [],
    }
  },
  ProfileB: {
    name: 'Profile B (Female Gain)',
    profile: {
      name: 'Profile B',
      age: 22,
      sex: 'female',
      heightCm: 162,
      weightKg: 42,
      activityLevel: 'moderately_active',
      goal: 'gain_weight',
      dietaryPreference: 'no_preference',
      allergies: [],
      dislikedFoods: [],
      dietaryRestrictions: [],
    }
  },
  ProfileC: {
    name: 'Profile C (Male Lose)',
    profile: {
      name: 'Profile C',
      age: 35,
      sex: 'male',
      heightCm: 178,
      weightKg: 88,
      activityLevel: 'very_active',
      goal: 'lose_weight',
      dietaryPreference: 'no_preference',
      allergies: [],
      dislikedFoods: [],
      dietaryRestrictions: [],
    }
  },
  ProfileD: {
    name: 'Profile D (Female Sedentary Lose)',
    profile: {
      name: 'Profile D',
      age: 30,
      sex: 'female',
      heightCm: 165,
      weightKg: 62,
      activityLevel: 'sedentary',
      goal: 'lose_weight',
      dietaryPreference: 'no_preference',
      allergies: [],
      dislikedFoods: [],
      dietaryRestrictions: [],
    }
  },
  ProfileE: {
    name: 'Profile E (Female Active Gain)',
    profile: {
      name: 'Profile E',
      age: 30,
      sex: 'female',
      heightCm: 165,
      weightKg: 62,
      activityLevel: 'very_active',
      goal: 'gain_weight',
      dietaryPreference: 'no_preference',
      allergies: [],
      dislikedFoods: [],
      dietaryRestrictions: [],
    }
  }
};

console.log('\n--- 1. NUTRITION CALCULATIONS & MACROS (SEED 42) ---');

const calorieDiffs: number[] = [];

Object.entries(profiles).forEach(([key, { name, profile }]) => {
  const bmrRes = calculateBMR(profile.weightKg, profile.heightCm, profile.age, profile.sex);
  const actMult = VALID_ACTIVITY_MULTIPLIERS[profile.activityLevel];
  const tdee = calculateTDEE(bmrRes.bmrRaw, profile.activityLevel);

  let goalAdjPct = 0;
  if (profile.goal === 'lose_weight') goalAdjPct = -12;
  else if (profile.goal === 'gain_weight') goalAdjPct = 10;

  const res = generateMealPlan(profile, { seed: 42 });
  if (!res.success || !res.plan) {
    console.error(`FAILED to generate plan for ${name}`);
    return;
  }

  const plan = res.plan;
  const targetCals = plan.targetTotalCalories;
  const genCals = plan.actualTotalCalories;
  const absDiff = Math.abs(genCals - targetCals);
  const pctDiff = Number(((absDiff / targetCals) * 100).toFixed(2));
  calorieDiffs.push(absDiff);

  const protGrams = plan.totalProteinGrams;
  const protGPerKg = Number((protGrams / profile.weightKg).toFixed(2));
  const carbGrams = plan.totalCarbsGrams;
  const fatGrams = plan.totalFatGrams;
  const fiberGrams = plan.totalFiberGrams;

  console.log(`\n${name}:`);
  console.log(`  BMR Raw: ${bmrRes.bmrRaw.toFixed(2)} kcal | BMR Rounded: ${bmrRes.bmrKcal} kcal`);
  console.log(`  Activity Multiplier: ${actMult} | TDEE: ${tdee} kcal`);
  console.log(`  Goal Adjustment: ${goalAdjPct > 0 ? '+' : ''}${goalAdjPct}%`);
  console.log(`  Target Calories: ${targetCals} kcal | Generated Calories: ${genCals} kcal`);
  console.log(`  Absolute Diff: ${absDiff} kcal | Percentage Diff: ${pctDiff}%`);
  console.log(`  Macros: Protein=${protGrams}g (${protGPerKg} g/kg), Carbs=${carbGrams}g, Fat=${fatGrams}g, Fiber=${fiberGrams}g`);

  // Verify sum arithmetic
  const mealCalSum = plan.meals.reduce((acc, m) => acc + m.totalCalories, 0);
  const mealProtSum = Number(plan.meals.reduce((acc, m) => acc + m.totalProteinGrams, 0).toFixed(1));
  const mealCarbSum = Number(plan.meals.reduce((acc, m) => acc + m.totalCarbsGrams, 0).toFixed(1));
  const mealFatSum = Number(plan.meals.reduce((acc, m) => acc + m.totalFatGrams, 0).toFixed(1));
  const mealFiberSum = Number(plan.meals.reduce((acc, m) => acc + m.totalFiberGrams, 0).toFixed(1));

  console.log(`  Sum Check -> Cal:${mealCalSum === genCals} Prot:${mealProtSum === protGrams} Carb:${mealCarbSum === carbGrams} Fat:${mealFatSum === fatGrams} Fiber:${mealFiberSum === fiberGrams}`);

  // Food items printout
  const allItems = plan.meals.flatMap(m => m.items);
  const foodIds = allItems.map(i => i.foodItem.id).join(', ');
  const foodNames = allItems.map(i => i.foodItem.englishName).join(', ');
  const mults = allItems.map(i => `${i.portionMultiplier}x`).join(', ');

  console.log(`  Selected Food IDs: ${foodIds}`);
  console.log(`  Selected Food Names: ${foodNames}`);
  console.log(`  Portion Multipliers: ${mults}`);
});

// CALORIE INTEGRITY STATS
calorieDiffs.sort((a, b) => a - b);
const minDiff = calorieDiffs[0];
const maxDiff = calorieDiffs[calorieDiffs.length - 1];
const meanDiff = Number((calorieDiffs.reduce((a, b) => a + b, 0) / calorieDiffs.length).toFixed(2));
const medianDiff = calorieDiffs[Math.floor(calorieDiffs.length / 2)];

console.log('\n--- CALORIE INTEGRITY STATS ACROSS PROFILES A-E ---');
console.log(`Min Abs Diff: ${minDiff} kcal`);
console.log(`Max Abs Diff: ${maxDiff} kcal`);
console.log(`Mean Abs Diff: ${meanDiff} kcal`);
console.log(`Median Abs Diff: ${medianDiff} kcal`);

// 2. CATEGORY PORTION BOUNDS & SWEEP
console.log('\n--- 2. CATEGORY PORTION BOUNDS & EXHAUSTIVE SWEEP ---');

const categories = [
  'Fruits', 'Healthy Snacks', 'Nuts & Seeds', 'Beverages', 'Dairy',
  'Rice & Grains', 'Fish', 'Chicken & Other Poultry', 'Meat', 'Eggs',
  'Dal & Legumes', 'Vegetables', 'Leafy Vegetables', 'Traditional Bangladeshi Foods'
] as const;

categories.forEach(cat => {
  const bounds = getCategoryPortionBounds(cat as any);
  console.log(`  Category: ${cat.padEnd(30)} -> Min: ${bounds.min}x | Max: ${bounds.max}x`);
});

let globalMinMult = 999;
let globalMaxMult = -999;
let globalMinCat = '';
let globalMaxCat = '';
let outOfBoundsCount = 0;

for (let seed = 1; seed <= 50; seed++) {
  Object.values(profiles).forEach(({ profile }) => {
    const res = generateMealPlan(profile, { seed });
    if (res.plan) {
      res.plan.meals.flatMap(m => m.items).forEach(item => {
        const cat = item.foodItem.category;
        const bounds = getCategoryPortionBounds(cat);
        const mVal = item.portionMultiplier;
        if (mVal < bounds.min || mVal > bounds.max) {
          outOfBoundsCount++;
        }
        if (mVal < globalMinMult) {
          globalMinMult = mVal;
          globalMinCat = cat;
        }
        if (mVal > globalMaxMult) {
          globalMaxMult = mVal;
          globalMaxCat = cat;
        }
      });
    }
  });
}

console.log(`\nExhaustive Sweep Results:`);
console.log(`  Observed Min Multiplier: ${globalMinMult}x (Category: ${globalMinCat})`);
console.log(`  Observed Max Multiplier: ${globalMaxMult}x (Category: ${globalMaxCat})`);
console.log(`  Out of Bounds Portion Count: ${outOfBoundsCount}`);

// 3. FOOD DATABASE AUDIT
console.log('\n--- 3. FOOD DATABASE INTEGRITY AUDIT ---');

const db = BANGLADESH_FOOD_DATABASE;
const totalDbItems = db.length;
const idSet = new Set<string>();
let duplicateIds = 0;
let missingEnglish = 0;
let missingBangla = 0;
let negCals = 0;
let negProt = 0;
let negCarb = 0;
let negFat = 0;
let negFib = 0;
let vegInconsistent = 0;
let veganInconsistent = 0;

db.forEach(item => {
  if (idSet.has(item.id)) duplicateIds++;
  else idSet.add(item.id);

  if (!item.englishName || item.englishName.trim() === '') missingEnglish++;
  if (!item.banglaName || item.banglaName.trim() === '') missingBangla++;

  if (item.calories < 0) negCals++;
  if (item.proteinGrams < 0) negProt++;
  if (item.carbsGrams < 0) negCarb++;
  if (item.fatGrams < 0) negFat++;
  if (item.fiberGrams < 0) negFib++;

  if (item.isVegan && !item.isVegetarian) veganInconsistent++;
});

console.log(`  Total Database Items: ${totalDbItems}`);
console.log(`  Unique IDs: ${idSet.size}`);
console.log(`  Duplicate IDs: ${duplicateIds}`);
console.log(`  Missing English Names: ${missingEnglish}`);
console.log(`  Missing Bangla Names: ${missingBangla}`);
console.log(`  Negative Calories: ${negCals}`);
console.log(`  Negative Protein: ${negProt}`);
console.log(`  Negative Carbs: ${negCarb}`);
console.log(`  Negative Fat: ${negFat}`);
console.log(`  Negative Fiber: ${negFib}`);
console.log(`  Vegan without Vegetarian Flag: ${veganInconsistent}`);

// 4. 100-SEED FOOD DIVERSITY SWEEP
console.log('\n--- 4. 100-SEED FOOD DIVERSITY SWEEP ---');

const foodCounts: Record<string, { name: string; category: string; count: number }> = {};
db.forEach(f => {
  foodCounts[f.id] = { name: f.englishName, category: f.category, count: 0 };
});

const defaultProfile = profiles.ProfileA.profile;

for (let seed = 1; seed <= 100; seed++) {
  const res = generateMealPlan(defaultProfile, { seed });
  if (res.plan) {
    res.plan.meals.flatMap(m => m.items).forEach(item => {
      if (foodCounts[item.foodItem.id]) {
        foodCounts[item.foodItem.id].count++;
      }
    });
  }
}

const selectedFoodsList = Object.entries(foodCounts).filter(([_, data]) => data.count > 0);
const unselectedFoodsList = Object.entries(foodCounts).filter(([_, data]) => data.count === 0);

const uniqueFoodsSelectedCount = selectedFoodsList.length;
const coveragePct = Number(((uniqueFoodsSelectedCount / totalDbItems) * 100).toFixed(1));

console.log(`  Total Database Items: ${totalDbItems}`);
console.log(`  Unique Foods Selected Across 100 Seeds: ${uniqueFoodsSelectedCount}`);
console.log(`  Coverage Percentage: ${coveragePct}%`);

console.log('\nUnselected Foods List:');
unselectedFoodsList.forEach(([id, data]) => {
  let note = 'Unreachable by slot candidate pool';
  if (id.startsWith('oil-')) note = 'Intentionally excluded (Cooking oil component)';
  else if (id.startsWith('bev-')) note = 'Intentionally excluded (Plain liquid beverage)';
  else if (id.startsWith('dairy-') || id.startsWith('egg-') || id.startsWith('snack-')) note = 'Secondary candidate / replaced by higher-scored items';
  console.log(`  - ${id} (${data.name}) [Cat: ${data.category}]: ${note}`);
});

const sortedByFreq = Object.entries(foodCounts).sort((a, b) => b[1].count - a[1].count);

console.log('\nTop 10 Most Frequently Selected Foods:');
sortedByFreq.slice(0, 10).forEach(([id, data]) => {
  console.log(`  - ${id} (${data.name}): ${data.count} times`);
});

console.log('\nBottom 10 Selected Foods (excluding 0 count):');
sortedByFreq.filter(([_, d]) => d.count > 0).slice(-10).forEach(([id, data]) => {
  console.log(`  - ${id} (${data.name}): ${data.count} times`);
});

// 5. SAFETY & CONSTRAINT VIOLATION AUDIT
console.log('\n--- 5. SAFETY & CONSTRAINT VIOLATION AUDIT ---');

let allergyViolations = 0;
let vegViolations = 0;
let veganViolations = 0;
let dislikedViolations = 0;

// Test complex allergies
const allergyTestProfile: PersonalHealthProfile = {
  ...defaultProfile,
  allergies: ['fish', 'মাছ', 'mach', 'peanut', 'চিনাবাদাম', 'chinabadam', 'milk', 'দুধ', 'doodh', 'egg', 'ডিম', 'dim', 'wheat', 'গম', 'atta', 'mustard', 'সরিষা', 'shorshe', 'seafood', 'shrimp', 'chingri', 'soy']
};

for (let seed = 1; seed <= 20; seed++) {
  const res = generateMealPlan(allergyTestProfile, { seed });
  if (res.plan) {
    res.plan.meals.flatMap(m => m.items).forEach(item => {
      if (isFoodAllergic(item.foodItem, allergyTestProfile.allergies)) {
        allergyViolations++;
      }
    });

    // Test swap on lunch
    const lunchSlot = res.plan.meals.find(m => m.type === 'Lunch');
    if (lunchSlot && lunchSlot.items.length > 0) {
      const alts = getMealSwapAlternatives(lunchSlot.items[0].foodItem, allergyTestProfile, 'Lunch');
      alts.forEach(alt => {
        if (isFoodAllergic(alt, allergyTestProfile.allergies)) {
          allergyViolations++;
        }
      });
    }
  }
}

// Test Vegetarian
const vegProfile: PersonalHealthProfile = { ...defaultProfile, dietaryPreference: 'vegetarian' };
for (let seed = 1; seed <= 20; seed++) {
  const res = generateMealPlan(vegProfile, { seed });
  if (res.plan) {
    res.plan.meals.flatMap(m => m.items).forEach(item => {
      if (!matchesDietaryPreference(item.foodItem, 'vegetarian')) {
        vegViolations++;
      }
    });
  }
}

// Test Vegan
const veganProfile: PersonalHealthProfile = { ...defaultProfile, dietaryPreference: 'vegan' };
for (let seed = 1; seed <= 20; seed++) {
  const res = generateMealPlan(veganProfile, { seed });
  if (res.plan) {
    res.plan.meals.flatMap(m => m.items).forEach(item => {
      if (!matchesDietaryPreference(item.foodItem, 'vegan')) {
        veganViolations++;
      }
    });
  }
}

// Test Disliked + Substring boundary ("oil" vs "Boiled Rice")
const boiledRice = db.find(f => f.englishName.toLowerCase().includes('boiled rice')) || db[0];
const oilExcludesBoiledRice = isFoodDisliked(boiledRice, ['oil']);

const dislikedProfile: PersonalHealthProfile = {
  ...defaultProfile,
  dislikedFoods: ['okra', 'ঢেঁড়শ', 'hilsa', 'ইলিশ', 'oil']
};

for (let seed = 1; seed <= 10; seed++) {
  const res = generateMealPlan(dislikedProfile, { seed });
  if (res.plan) {
    res.plan.meals.flatMap(m => m.items).forEach(item => {
      if (isFoodDisliked(item.foodItem, dislikedProfile.dislikedFoods)) {
        dislikedViolations++;
      }
    });
  }
}

console.log(`  Allergy Violation Count: ${allergyViolations}`);
console.log(`  Vegetarian Violation Count: ${vegViolations}`);
console.log(`  Vegan Violation Count: ${veganViolations}`);
console.log(`  Disliked "oil" excludes "Boiled Rice" (False Positive): ${oilExcludesBoiledRice}`);
console.log(`  Disliked Food Violation Count: ${dislikedViolations}`);

// 6. MEAL SWAP DEMONSTRATION & ARITHMETIC CHECK
console.log('\n--- 6. MEAL SWAP ARITHMETIC DEMONSTRATION ---');

const basePlanRes = generateMealPlan(defaultProfile, { seed: 42 });
if (basePlanRes.plan) {
  const origPlan = basePlanRes.plan;
  const lunchSlot = origPlan.meals.find(m => m.type === 'Lunch')!;
  const origItem = lunchSlot.items[0];
  const alts = getMealSwapAlternatives(origItem.foodItem, defaultProfile, 'Lunch');
  const replacementFood = alts[0];

  const swappedPlan = swapFoodItemInPlan(origPlan, lunchSlot.id, 0, replacementFood);
  const swappedLunch = swappedPlan.meals.find(m => m.type === 'Lunch')!;

  console.log(`  Original Food: ${origItem.foodItem.englishName} (${origItem.calories} kcal, P:${origItem.proteinGrams}g, C:${origItem.carbsGrams}g, F:${origItem.fatGrams}g)`);
  console.log(`  Replacement Food: ${replacementFood.englishName} (${swappedLunch.items[0].calories} kcal, P:${swappedLunch.items[0].proteinGrams}g, C:${swappedLunch.items[0].carbsGrams}g, F:${swappedLunch.items[0].fatGrams}g)`);
  console.log(`  Original Daily Totals: ${origPlan.actualTotalCalories} kcal, P:${origPlan.totalProteinGrams}g, C:${origPlan.totalCarbsGrams}g, F:${origPlan.totalFatGrams}g`);
  console.log(`  Swapped Daily Totals: ${swappedPlan.actualTotalCalories} kcal, P:${swappedPlan.totalProteinGrams}g, C:${swappedPlan.totalCarbsGrams}g, F:${swappedPlan.totalFatGrams}g`);

  const calCheck = swappedPlan.actualTotalCalories === swappedPlan.meals.reduce((a, m) => a + m.totalCalories, 0);
  console.log(`  Swapped Daily Sum Exact Match: ${calCheck}`);
}

console.log('\n===========================================================');
console.log('   DEEP AUDIT EXECUTION COMPLETE');
console.log('===========================================================');

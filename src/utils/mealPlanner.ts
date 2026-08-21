import { 
  PersonalHealthProfile, 
  DailyMealPlan, 
  MealSlot, 
  PlannedFoodItem, 
  FoodItem, 
  MealType, 
  FoodCategory,
  MealPlanGenerationInput
} from '../types';
import { BANGLADESH_FOOD_DATABASE } from '../data/bangladeshFoodDatabase';
import { getFullHealthMetrics, validateProfileForCalculations, calculateMacroDistribution } from './nutritionCalculator';
import { createProfileFingerprint } from './profileStorage';
import { 
  isFoodSafeAndAllowed, 
  isFoodSuitableForSlot, 
  checkFoodPairCompatibility, 
  validateMealCombination, 
  scoreMealCombination, 
  validateDailyMealPlan,
  validateDailyCalorieProximity,
  calculateMealComplexityScore,
  isDietaryCompliant,
  isAllergyCompliant,
  isDislikeCompliant
} from './mealCoherence';
import { recordUsedFoods, getFoodDiversityScore } from './foodRotationMemory';

export { validateDailyCalorieProximity };

export const MEAL_PLAN_DISCLAIMER = 
  'This meal plan provides general nutrition guidance based on estimated energy needs and the information in your profile. It is not medical treatment or a substitute for professional dietary advice.';

/**
 * Generates a deterministic positive 32-bit integer hash from a string.
 */
export function hashStringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash) || 12345;
}

/**
 * Deterministic Pseudo-Random Number Generator (Mulberry32)
 * Produces reproducible pseudo-random floats in [0, 1) given an integer seed.
 */
export function createPRNG(seed: number) {
  let s = (seed >>> 0) || 12345;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic Fisher-Yates array shuffle using a PRNG function.
 */
export function shuffleWithPRNG<T>(array: T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Common allergy keywords mapping for cross-lingual string matching
 */
export const ALLERGY_KEYWORD_MAP: Record<string, string[]> = {
  peanut: ['peanut', 'badam', 'nut', 'groundnut', 'বাদাম'],
  peanuts: ['peanut', 'badam', 'nut', 'groundnut', 'বাদাম'],
  tree_nuts: ['cashew', 'almond', 'walnut', 'pistachio', 'kazu', 'কাঠবাদাম', 'কাজুবাদাম'],
  tree_nut: ['cashew', 'almond', 'walnut', 'pistachio', 'kazu', 'কাঠবাদাম', 'কাজুবাদাম'],
  nuts: ['peanut', 'badam', 'nut', 'cashew', 'almond', 'বাদাম'],
  fish: ['fish', 'mach', 'macher', 'rui', 'katla', 'hilsa', 'ilish', 'pangash', 'tilapia', 'boal', 'pabda', 'magur', 'shing', 'prawn', 'shrimp', 'chingri', 'মাছ', 'ইলিশ', 'রুই', 'কাতলা', 'শুঁটকি', 'shutki'],
  seafood: ['fish', 'prawn', 'shrimp', 'chingri', 'crab', 'মাছ', 'চিংড়ি', 'শুঁটকি', 'shutki'],
  egg: ['egg', 'dim', 'ডিম'],
  eggs: ['egg', 'dim', 'ডিম'],
  milk: ['milk', 'doodh', 'dairy', 'yogurt', 'doi', 'ghee', 'paneer', 'cheese', 'butter', 'curd', 'matha', 'দুধ', 'দই', 'ঘি', 'মাঠা'],
  dairy: ['milk', 'doodh', 'dairy', 'yogurt', 'doi', 'ghee', 'paneer', 'cheese', 'butter', 'curd', 'matha', 'দুধ', 'দই', 'ঘি', 'মাঠা'],
  lactose: ['milk', 'doodh', 'dairy', 'yogurt', 'doi', 'ghee', 'paneer', 'cheese', 'curd', 'matha', 'দুধ', 'দই'],
  soy: ['soy', 'soya', 'tofu', 'সয়া'],
  wheat: ['wheat', 'atta', 'maida', 'bread', 'roti', 'paratha', 'আটা', 'ময়দা', 'রুটি'],
  gluten: ['wheat', 'atta', 'maida', 'bread', 'roti', 'paratha', 'semai', 'suji', 'আটা', 'ময়দা'],
  mustard: ['mustard', 'shorshe', 'shorse', 'সর্ষে', 'সরষে'],
};

/**
 * Checks if a specific FoodItem conflicts with any user allergy or intolerance.
 */
export function isFoodAllergic(food: FoodItem, userAllergies: string[]): boolean {
  return !isAllergyCompliant(food, userAllergies);
}

/**
 * Checks if a FoodItem complies with the user's dietary preference.
 */
export function matchesDietaryPreference(food: FoodItem, preference: string): boolean {
  return isDietaryCompliant(food, preference);
}

/**
 * Checks if a FoodItem is in the user's disliked foods list.
 */
export function isFoodDisliked(food: FoodItem, dislikedFoods: string[]): boolean {
  return !isDislikeCompliant(food, dislikedFoods);
}

/**
 * Filters food database based on user safety rules (Allergies) and dietary preferences.
 */
export function getCompatibleFoods(
  profile: PersonalHealthProfile,
  categories?: FoodCategory[]
): FoodItem[] {
  return BANGLADESH_FOOD_DATABASE.filter(food => {
    if (!isFoodSafeAndAllowed(food, profile)) return false;
    if (categories && categories.length > 0 && !categories.includes(food.category)) {
      return false;
    }
    return true;
  });
}

/**
 * Returns portion multipliers limits per category, dynamically calibrated to calorie needs.
 */
export function getCategoryPortionBounds(category: FoodCategory, targetTotalCalories?: number): { min: number; max: number } {
  const isVeryLowCal = targetTotalCalories !== undefined && targetTotalCalories < 1350;
  const isHighCal = targetTotalCalories !== undefined && targetTotalCalories >= 2350 && targetTotalCalories < 2800;
  const isVeryHighCal = targetTotalCalories !== undefined && targetTotalCalories >= 2800 && targetTotalCalories < 3400;
  const isExtremeHighCal = targetTotalCalories !== undefined && targetTotalCalories >= 3400;

  switch (category) {
    case 'Fruits':
      return isVeryLowCal ? { min: 0.50, max: 1.10 } : isExtremeHighCal ? { min: 0.90, max: 2.75 } : isVeryHighCal ? { min: 0.80, max: 2.40 } : isHighCal ? { min: 0.75, max: 2.00 } : { min: 0.65, max: 1.6 };
    case 'Healthy Snacks':
    case 'Nuts & Seeds':
    case 'Beverages':
    case 'Dairy':
      return isVeryLowCal ? { min: 0.50, max: 1.10 } : isExtremeHighCal ? { min: 0.90, max: 2.75 } : isVeryHighCal ? { min: 0.80, max: 2.50 } : isHighCal ? { min: 0.75, max: 2.15 } : { min: 0.70, max: 1.7 };
    case 'Rice & Grains':
      return isVeryLowCal ? { min: 0.50, max: 1.15 } : isExtremeHighCal ? { min: 0.90, max: 2.80 } : isVeryHighCal ? { min: 0.85, max: 2.65 } : isHighCal ? { min: 0.80, max: 2.30 } : { min: 0.75, max: 1.85 };
    case 'Fish':
    case 'Chicken & Other Poultry':
    case 'Meat':
    case 'Eggs':
      return isVeryLowCal ? { min: 0.55, max: 1.20 } : isExtremeHighCal ? { min: 0.90, max: 2.80 } : isVeryHighCal ? { min: 0.85, max: 2.60 } : isHighCal ? { min: 0.80, max: 2.25 } : { min: 0.75, max: 1.85 };
    case 'Dal & Legumes':
      return isVeryLowCal ? { min: 0.55, max: 1.20 } : isExtremeHighCal ? { min: 0.90, max: 2.80 } : isVeryHighCal ? { min: 0.85, max: 2.55 } : isHighCal ? { min: 0.80, max: 2.20 } : { min: 0.75, max: 1.85 };
    case 'Vegetables':
    case 'Leafy Vegetables':
      return isVeryLowCal ? { min: 0.55, max: 1.20 } : isExtremeHighCal ? { min: 0.85, max: 2.65 } : isVeryHighCal ? { min: 0.80, max: 2.45 } : isHighCal ? { min: 0.75, max: 2.10 } : { min: 0.70, max: 1.6 };
    default:
      return isVeryLowCal ? { min: 0.55, max: 1.15 } : isExtremeHighCal ? { min: 0.90, max: 2.75 } : isVeryHighCal ? { min: 0.85, max: 2.50 } : isHighCal ? { min: 0.80, max: 2.20 } : { min: 0.75, max: 1.7 };
  }
}

/**
 * Converts a FoodItem to a PlannedFoodItem with calculated portion scaling.
 */
export function createPlannedItem(food: FoodItem, portionMultiplier: number = 1.0, targetTotalCalories?: number): PlannedFoodItem {
  const bounds = getCategoryPortionBounds(food.category, targetTotalCalories);
  const mult = Math.max(bounds.min, Math.min(bounds.max, Number(portionMultiplier.toFixed(2))));
  const baseCals = food.calories ?? 0;
  const baseProt = food.proteinGrams ?? 0;
  const baseCarb = food.carbsGrams ?? 0;
  const baseFat = food.fatGrams ?? 0;
  const baseFib = food.fiberGrams ?? 0;

  // Portion serving description string
  let servingText = food.servingSize || '1 portion';
  if (food.servingUnit) {
    servingText = `${servingText} (${food.servingUnit})`;
  }
  if (mult !== 1.0) {
    servingText = `${mult}x ${servingText}`;
  }

  return {
    foodItem: food,
    portionMultiplier: mult,
    servingText,
    calories: Math.round(baseCals * mult),
    proteinGrams: Number((baseProt * mult).toFixed(1)),
    carbsGrams: Number((baseCarb * mult).toFixed(1)),
    fatGrams: Number((baseFat * mult).toFixed(1)),
    fiberGrams: Number((baseFib * mult).toFixed(1)),
  };
}

/**
 * Calculates total nutrition for an array of planned items in a meal slot.
 */
export function calculateMealSlotNutrition(items: PlannedFoodItem[]) {
  return items.reduce(
    (acc, item) => ({
      totalCalories: acc.totalCalories + item.calories,
      totalProteinGrams: Number((acc.totalProteinGrams + item.proteinGrams).toFixed(1)),
      totalCarbsGrams: Number((acc.totalCarbsGrams + item.carbsGrams).toFixed(1)),
      totalFatGrams: Number((acc.totalFatGrams + item.fatGrams).toFixed(1)),
      totalFiberGrams: Number((acc.totalFiberGrams + item.fiberGrams).toFixed(1)),
    }),
    {
      totalCalories: 0,
      totalProteinGrams: 0,
      totalCarbsGrams: 0,
      totalFatGrams: 0,
      totalFiberGrams: 0,
    }
  );
}

/**
 * Builds coherent breakfast combinations adhering strictly to Bangladeshi breakfast archetypes.
 * Preferred: 2–3 items.
 */
function generateBreakfastCandidates(
  safeFoods: FoodItem[],
  profile: PersonalHealthProfile,
  targetSlotCal: number,
  usedFoodIds: Set<string>,
  rng: () => number,
  profileFingerprint?: string,
  targetTotalCalories?: number
): PlannedFoodItem[] {
  const candidates: FoodItem[][] = [];

  const staples = shuffleWithPRNG(safeFoods.filter(f => f.breakfastSuitable && (f.primaryRole === 'staple' || f.category === 'Rice & Grains' || f.id === 'trad-01' || f.id === 'grain-05' || f.id === 'grain-07' || f.id === 'trad-04' || f.id === 'grain-08' || f.id === 'grain-09')), rng);
  const proteins = shuffleWithPRNG(safeFoods.filter(f => f.breakfastSuitable && (f.primaryRole === 'protein' || f.primaryRole === 'dal' || f.category === 'Eggs' || f.category === 'Dal & Legumes' || f.category === 'Fish' || f.category === 'Chicken & Other Poultry')), rng);
  const vegetables = shuffleWithPRNG(safeFoods.filter(f => f.breakfastSuitable && (f.primaryRole === 'vegetable' || f.category === 'Vegetables' || f.id.startsWith('veg-') || f.id === 'trad-02' || f.id === 'trad-03')), rng);
  const fruits = shuffleWithPRNG(safeFoods.filter(f => f.breakfastSuitable && f.category === 'Fruits'), rng);
  const dairy = shuffleWithPRNG(safeFoods.filter(f => f.breakfastSuitable && (f.category === 'Dairy' || f.id === 'dairy-01' || f.id === 'dairy-02')), rng);
  const nuts = shuffleWithPRNG(safeFoods.filter(f => f.breakfastSuitable && f.category === 'Nuts & Seeds'), rng);

  // Archetype 1: Rice / Khichuri / Roti / Porota + Dal / Egg / Bhaji
  const riceStaples = staples.filter(f => f.id !== 'grain-07' && f.id !== 'grain-05' && f.id !== 'grain-06').slice(0, 5);
  const proteinPool = proteins.slice(0, 5);
  const vegPool = vegetables.slice(0, 4);

  for (const st of riceStaples) {
    for (const pr of proteinPool) {
      if (checkFoodPairCompatibility(st, pr, 'Breakfast').compatible) {
        // 2-item combo: Staple + Protein (e.g. Roti + Dim Bhaji)
        candidates.push([st, pr]);

        // 3-item combo: Staple + Protein + Veg (e.g. Roti + Dim + Shak/Aloo Bhaji)
        if (vegPool.length > 0) {
          for (let v = 0; v < vegPool.length; v++) {
            const vg = vegPool[v];
            if (checkFoodPairCompatibility(st, vg, 'Breakfast').compatible && checkFoodPairCompatibility(pr, vg, 'Breakfast').compatible) {
              candidates.push([st, pr, vg]);
            }
          }
        }

        // 3-item combo: Staple + Protein + Fruit (e.g. Khichuri + Egg + Banana)
        if (fruits.length > 0) {
          candidates.push([st, pr, fruits[0]]);
        }

        // 4-item combo only if high calorie demand
        if (targetSlotCal >= 650 && fruits.length > 0 && vegPool.length > 0) {
          const vg = vegPool[0];
          if (checkFoodPairCompatibility(st, vg, 'Breakfast').compatible && checkFoodPairCompatibility(pr, vg, 'Breakfast').compatible) {
            candidates.push([st, pr, vg, fruits[0]]);
          }
        }
      }
      if (candidates.length >= 35) break;
    }

    // 2-item combo: Staple + Veg (e.g. Roti + Aloo Bhaji)
    for (const vg of vegPool) {
      if (checkFoodPairCompatibility(st, vg, 'Breakfast').compatible) {
        candidates.push([st, vg]);
        if (fruits.length > 0) {
          candidates.push([st, vg, fruits[0]]); // 3-item combo
        }
      }
      if (candidates.length >= 35) break;
    }
    if (candidates.length >= 35) break;
  }

  // Archetype 2: Chira / Muri + Tok Doi / Milk / Banana / Nuts
  const chiraStaples = staples.filter(f => f.id === 'grain-05' || f.id === 'grain-06' || f.id === 'trad-04');
  for (const ch of chiraStaples) {
    if (dairy.length > 0) {
      for (const d of dairy) {
        if (checkFoodPairCompatibility(ch, d, 'Breakfast').compatible) {
          candidates.push([ch, d]); // 2 items
          if (fruits.length > 0) {
            candidates.push([ch, d, fruits[0]]); // 3 items
          } else if (nuts.length > 0) {
            candidates.push([ch, d, nuts[0]]); // 3 items
          }
        }
      }
    } else if (fruits.length > 0) {
      for (const fr of fruits) {
        candidates.push([ch, fr]); // 2 items
        if (nuts.length > 0) {
          candidates.push([ch, fr, nuts[0]]); // 3 items
        }
      }
    }
  }

  // Archetype 3: Oats + Milk / Yogurt / Fruit / Nuts
  const oats = staples.find(f => f.id === 'grain-07');
  if (oats) {
    if (dairy.length > 0) {
      for (const d of dairy) {
        candidates.push([oats, d]); // 2 items
        if (fruits.length > 0) {
          candidates.push([oats, d, fruits[0]]); // 3 items
        } else if (nuts.length > 0) {
          candidates.push([oats, d, nuts[0]]); // 3 items
        }
      }
    } else if (fruits.length > 0) {
      for (const fr of fruits) {
        candidates.push([oats, fr]); // 2 items
        if (nuts.length > 0) {
          candidates.push([oats, fr, nuts[0]]); // 3 items
        }
      }
    }
  }

  if (candidates.length === 0) {
    const safeB = safeFoods.filter(f => f.breakfastSuitable);
    if (safeB.length >= 2) {
      candidates.push([safeB[0], safeB[1]]);
    } else if (safeB.length === 1) {
      candidates.push([safeB[0]]);
    } else {
      candidates.push([safeFoods[0]]);
    }
  }

  // Score candidates (using enhanced scoreMealCombination with complexity penalty)
  const scored = candidates.map(items => ({
    items,
    score: scoreMealCombination(items, 'Breakfast', targetSlotCal, profile, usedFoodIds, profileFingerprint) + (rng() * 8),
  }));

  scored.sort((a, b) => b.score - a.score);
  const chosenItems = scored[0]?.items || [riceStaples[0] || staples[0], proteinPool[0] || proteins[0]].filter(Boolean);

  chosenItems.forEach(f => usedFoodIds.add(f.id));

  // Compute realistic portion multipliers before adding foods
  const count = chosenItems.length;
  return chosenItems.map(food => {
    let targetItemCal = targetSlotCal / count;
    if (food.primaryRole === 'staple') {
      targetItemCal = targetSlotCal * (count === 2 ? 0.58 : count === 3 ? 0.44 : 0.36);
    } else if (food.primaryRole === 'protein' || food.primaryRole === 'dal') {
      targetItemCal = targetSlotCal * (count === 2 ? 0.42 : count === 3 ? 0.36 : 0.32);
    } else if (food.category === 'Fruits' || food.category === 'Nuts & Seeds') {
      targetItemCal = targetSlotCal * (count === 2 ? 0.42 : count === 3 ? 0.20 : 0.16);
    } else {
      targetItemCal = targetSlotCal * (count === 2 ? 0.42 : count === 3 ? 0.20 : 0.16);
    }

    const rawCal = food.calories || 100;
    const bounds = getCategoryPortionBounds(food.category, targetTotalCalories || targetSlotCal * 4.5);
    const mult = Math.max(bounds.min, Math.min(bounds.max, targetItemCal / rawCal));
    return createPlannedItem(food, mult, targetTotalCalories || targetSlotCal * 4.5);
  });
}

/**
 * Builds coherent lunch combinations:
 * Preferred: 3 items (Staple + Protein + Veg or Staple + Dal + Veg).
 * Occasionally 4 items (Staple + Non-Dal Protein + Dal + Veg) only when culturally & nutritionally justified.
 * NEVER 5 items.
 */
function generateLunchCandidates(
  safeFoods: FoodItem[],
  profile: PersonalHealthProfile,
  targetSlotCal: number,
  usedFoodIds: Set<string>,
  rng: () => number,
  profileFingerprint?: string,
  targetTotalCalories?: number
): PlannedFoodItem[] {
  const staples = shuffleWithPRNG(safeFoods.filter(f => f.lunchSuitable && (f.primaryRole === 'staple' || ['grain-01', 'grain-02', 'grain-03', 'grain-04', 'grain-08', 'grain-09', 'trad-01'].includes(f.id))), rng);
  const proteins = shuffleWithPRNG(safeFoods.filter(f => f.lunchSuitable && (f.primaryRole === 'protein' || f.primaryRole === 'dal' || ['Fish', 'Chicken & Other Poultry', 'Meat', 'Eggs', 'Dal & Legumes'].includes(f.category) || f.id.startsWith('snack-0'))), rng);
  const dals = shuffleWithPRNG(safeFoods.filter(f => f.lunchSuitable && (f.category === 'Dal & Legumes' || f.primaryRole === 'dal')), rng);
  const vegetables = shuffleWithPRNG(safeFoods.filter(f => f.lunchSuitable && (f.primaryRole === 'vegetable' || ['Vegetables', 'Leafy Vegetables'].includes(f.category) || f.id.startsWith('veg-') || f.id.startsWith('leafy-') || f.id === 'trad-02' || f.id === 'trad-03' || f.id === 'trad-05')), rng);

  const candidates: FoodItem[][] = [];

  const staplePool = (staples.length > 0 ? staples : safeFoods.filter(f => f.primaryRole === 'staple' || f.category === 'Rice & Grains')).slice(0, 6);
  const proteinPool = (proteins.length > 0 ? proteins : safeFoods.filter(f => f.category === 'Dal & Legumes')).slice(0, 8);
  const vegPool = (vegetables.length > 0 ? vegetables : safeFoods.filter(f => f.category === 'Vegetables')).slice(0, 8);

  for (const st of staplePool) {
    let stapleCandidateCount = 0;
    for (const pr of proteinPool) {
      if (!checkFoodPairCompatibility(st, pr, 'Lunch').compatible) continue;

      for (const vg of vegPool) {
        if (vg.id === pr.id || vg.id === st.id) continue;
        if (!checkFoodPairCompatibility(st, vg, 'Lunch').compatible) continue;
        if (!checkFoodPairCompatibility(pr, vg, 'Lunch').compatible) continue;

        // 3-item candidate: Staple + Protein + Veg (Clean classic structure)
        candidates.push([st, pr, vg]);
        stapleCandidateCount++;

        // 4-item candidate: Staple + Non-Dal Protein + Dal + Veg (Classic Bangladeshi Thali)
        const isPlantBased = profile.dietaryPreference === 'vegan' || profile.dietaryPreference === 'vegetarian';
        const isPlantProteinCandidate = isPlantBased && (pr.isProteinSource || pr.id === 'veg-29' || pr.id === 'nuts-10' || pr.id.startsWith('snack-') || (pr.category === 'Dal & Legumes' && pr.primaryRole !== 'dal'));
        if (dals.length > 0 && ((pr.category !== 'Dal & Legumes' && pr.primaryRole !== 'dal') || isPlantProteinCandidate)) {
          for (let d = 0; d < Math.min(dals.length, 3); d++) {
            const dl = dals[d];
            if (dl.id === pr.id || dl.id === vg.id || dl.id === st.id) continue;
            if (
              checkFoodPairCompatibility(st, dl, 'Lunch').compatible &&
              checkFoodPairCompatibility(pr, dl, 'Lunch').compatible &&
              checkFoodPairCompatibility(vg, dl, 'Lunch').compatible
            ) {
              candidates.push([st, pr, dl, vg]);
              stapleCandidateCount++;
            }
          }
        }
        if (stapleCandidateCount >= 12 || candidates.length >= 70) break;
      }
      if (stapleCandidateCount >= 12 || candidates.length >= 70) break;
    }
    if (candidates.length >= 70) break;
  }

  if (candidates.length === 0) {
    for (const st of staplePool) {
      for (const pr of proteinPool) {
        if (checkFoodPairCompatibility(st, pr, 'Lunch').compatible) {
          candidates.push([st, pr]);
        }
      }
    }
  }

  const scored = candidates.map(items => ({
    items,
    score: scoreMealCombination(items, 'Lunch', targetSlotCal, profile, usedFoodIds, profileFingerprint) + (rng() * 8),
  }));

  scored.sort((a, b) => b.score - a.score);
  const chosenItems = scored[0]?.items || [staplePool[0], proteinPool[0], vegPool[0]].filter(Boolean);

  chosenItems.forEach(f => usedFoodIds.add(f.id));

  // Balanced portion distribution across 3 or 4 items (portion scaling satisfies calories naturally)
  const count = chosenItems.length;
  const targetStapleCal = targetSlotCal * (count === 4 ? 0.38 : 0.46);
  const targetProteinCal = targetSlotCal * (count === 4 ? 0.32 : 0.42);
  const targetDalCal = targetSlotCal * 0.20;
  const targetVegCal = targetSlotCal * (count === 4 ? 0.10 : 0.12);

  return chosenItems.map(food => {
    let targetItemCal = targetSlotCal / chosenItems.length;
    if (food.primaryRole === 'staple') targetItemCal = targetStapleCal;
    else if (food.primaryRole === 'protein') targetItemCal = targetProteinCal;
    else if (food.primaryRole === 'dal' || food.category === 'Dal & Legumes') targetItemCal = targetDalCal;
    else if (food.primaryRole === 'vegetable' || food.category === 'Vegetables' || food.category === 'Leafy Vegetables') targetItemCal = targetVegCal;

    const rawCal = food.calories || 100;
    const bounds = getCategoryPortionBounds(food.category, targetTotalCalories || targetSlotCal * 3.1);
    const mult = Math.max(bounds.min, Math.min(bounds.max, targetItemCal / rawCal));
    return createPlannedItem(food, mult, targetTotalCalories || targetSlotCal * 3.1);
  });
}

/**
 * Builds coherent dinner combinations:
 * Preferred: 3 items (Staple + Protein + Veg or Staple + Dal + Veg).
 * Occasionally 4 items (Staple + Non-Dal Protein + Dal + Veg).
 * NEVER 5 items.
 */
function generateDinnerCandidates(
  safeFoods: FoodItem[],
  profile: PersonalHealthProfile,
  targetSlotCal: number,
  usedFoodIds: Set<string>,
  rng: () => number,
  profileFingerprint?: string,
  targetTotalCalories?: number
): PlannedFoodItem[] {
  const staples = shuffleWithPRNG(safeFoods.filter(f => f.dinnerSuitable && (f.primaryRole === 'staple' || ['grain-01', 'grain-02', 'grain-03', 'grain-04', 'grain-08', 'grain-09', 'trad-01'].includes(f.id))), rng);
  const proteins = shuffleWithPRNG(safeFoods.filter(f => f.dinnerSuitable && (f.primaryRole === 'protein' || f.primaryRole === 'dal' || ['Fish', 'Chicken & Other Poultry', 'Eggs', 'Dal & Legumes'].includes(f.category) || f.id.startsWith('snack-0'))), rng);
  const dals = shuffleWithPRNG(safeFoods.filter(f => f.dinnerSuitable && (f.category === 'Dal & Legumes' || f.primaryRole === 'dal')), rng);
  const vegetables = shuffleWithPRNG(safeFoods.filter(f => f.dinnerSuitable && (f.primaryRole === 'vegetable' || ['Vegetables', 'Leafy Vegetables'].includes(f.category) || f.id.startsWith('veg-') || f.id.startsWith('leafy-') || f.id === 'trad-02' || f.id === 'trad-03' || f.id === 'trad-05')), rng);

  const candidates: FoodItem[][] = [];

  const staplePool = (staples.length > 0 ? staples : safeFoods.filter(f => f.primaryRole === 'staple' || f.category === 'Rice & Grains')).slice(0, 6);
  const proteinPool = (proteins.length > 0 ? proteins : safeFoods.filter(f => f.category === 'Dal & Legumes')).slice(0, 8);
  const vegPool = (vegetables.length > 0 ? vegetables : safeFoods.filter(f => f.category === 'Vegetables')).slice(0, 8);

  for (const st of staplePool) {
    let stapleCandidateCount = 0;
    for (const pr of proteinPool) {
      if (!checkFoodPairCompatibility(st, pr, 'Dinner').compatible) continue;

      for (const vg of vegPool) {
        if (vg.id === pr.id || vg.id === st.id) continue;
        if (!checkFoodPairCompatibility(st, vg, 'Dinner').compatible) continue;
        if (!checkFoodPairCompatibility(pr, vg, 'Dinner').compatible) continue;

        // 3-item candidate: Staple + Protein + Veg
        candidates.push([st, pr, vg]);
        stapleCandidateCount++;

        // 4-item candidate: Staple + Non-Dal Protein + Dal + Veg
        const isPlantBased = profile.dietaryPreference === 'vegan' || profile.dietaryPreference === 'vegetarian';
        const isPlantProteinCandidate = isPlantBased && (pr.isProteinSource || pr.id === 'veg-29' || pr.id === 'nuts-10' || pr.id.startsWith('snack-') || (pr.category === 'Dal & Legumes' && pr.primaryRole !== 'dal'));
        if (dals.length > 0 && ((pr.category !== 'Dal & Legumes' && pr.primaryRole !== 'dal') || isPlantProteinCandidate)) {
          for (let d = 0; d < Math.min(dals.length, 3); d++) {
            const dl = dals[d];
            if (dl.id === pr.id || dl.id === vg.id || dl.id === st.id) continue;
            if (
              checkFoodPairCompatibility(st, dl, 'Dinner').compatible &&
              checkFoodPairCompatibility(pr, dl, 'Dinner').compatible &&
              checkFoodPairCompatibility(vg, dl, 'Dinner').compatible
            ) {
              candidates.push([st, pr, dl, vg]);
              stapleCandidateCount++;
            }
          }
        }
        if (stapleCandidateCount >= 12 || candidates.length >= 70) break;
      }
      if (stapleCandidateCount >= 12 || candidates.length >= 70) break;
    }
    if (candidates.length >= 70) break;
  }

  if (candidates.length === 0) {
    for (const st of staplePool) {
      for (const pr of proteinPool) {
        if (checkFoodPairCompatibility(st, pr, 'Dinner').compatible) {
          candidates.push([st, pr]);
        }
      }
    }
  }

  const scored = candidates.map(items => ({
    items,
    score: scoreMealCombination(items, 'Dinner', targetSlotCal, profile, usedFoodIds, profileFingerprint) + (rng() * 8),
  }));

  scored.sort((a, b) => b.score - a.score);
  const chosenItems = scored[0]?.items || [staplePool[0], proteinPool[0], vegPool[0]].filter(Boolean);

  chosenItems.forEach(f => usedFoodIds.add(f.id));

  const count = chosenItems.length;
  const targetStapleCal = targetSlotCal * (count === 4 ? 0.38 : 0.46);
  const targetProteinCal = targetSlotCal * (count === 4 ? 0.32 : 0.42);
  const targetDalCal = targetSlotCal * 0.20;
  const targetVegCal = targetSlotCal * (count === 4 ? 0.10 : 0.12);

  return chosenItems.map(food => {
    let targetItemCal = targetSlotCal / chosenItems.length;
    if (food.primaryRole === 'staple') targetItemCal = targetStapleCal;
    else if (food.primaryRole === 'protein') targetItemCal = targetProteinCal;
    else if (food.primaryRole === 'dal' || food.category === 'Dal & Legumes') targetItemCal = targetDalCal;
    else if (food.primaryRole === 'vegetable' || food.category === 'Vegetables' || food.category === 'Leafy Vegetables') targetItemCal = targetVegCal;

    const rawCal = food.calories || 100;
    const bounds = getCategoryPortionBounds(food.category, targetTotalCalories || targetSlotCal * 3.3);
    const mult = Math.max(bounds.min, Math.min(bounds.max, targetItemCal / rawCal));
    return createPlannedItem(food, mult, targetTotalCalories || targetSlotCal * 3.3);
  });
}

/**
 * Builds coherent snack combinations: Strictly 1–2 items (Fruit, Nut, Yogurt, Muri, or Roasted Chola).
 * NEVER 3+ items.
 */
function generateSnackCandidates(
  slotType: 'Morning Snack' | 'Afternoon Snack',
  safeFoods: FoodItem[],
  profile: PersonalHealthProfile,
  targetSlotCal: number,
  usedFoodIds: Set<string>,
  rng: () => number,
  profileFingerprint?: string,
  targetTotalCalories?: number
): PlannedFoodItem[] {
  const snacks = shuffleWithPRNG(safeFoods.filter(f => f.snackSuitable), rng);
  const fruits = snacks.filter(f => f.category === 'Fruits').slice(0, 6);
  const nuts = snacks.filter(f => f.category === 'Nuts & Seeds').slice(0, 5);
  const traditionalSnacks = snacks.filter(f => f.id === 'grain-06' || f.id === 'dal-03' || f.id === 'dairy-02' || f.id === 'trad-04' || f.id.startsWith('snack-') || f.category === 'Beverages').slice(0, 5);

  const candidates: FoodItem[][] = [];

  // Single fruit candidates (1 item)
  for (const fr of fruits) {
    candidates.push([fr]);
  }
  // Single nut candidates (1 item)
  for (const n of nuts) {
    candidates.push([n]);
  }
  // Traditional snacks (1 item)
  for (const ts of traditionalSnacks) {
    candidates.push([ts]);
  }
  // Fruit + Nut pair (2 items)
  for (const fr of fruits) {
    for (const n of nuts) {
      candidates.push([fr, n]);
    }
  }
  // Traditional + Fruit / Nut (2 items)
  for (const ts of traditionalSnacks) {
    for (const fr of fruits) {
      candidates.push([ts, fr]);
    }
    for (const n of nuts) {
      candidates.push([ts, n]);
    }
  }

  if (candidates.length === 0) {
    candidates.push([snacks[0] || safeFoods[0]]);
  }

  const scored = candidates.map(items => ({
    items,
    score: scoreMealCombination(items, slotType, targetSlotCal, profile, usedFoodIds, profileFingerprint) + (rng() * 8),
  }));

  scored.sort((a, b) => b.score - a.score);
  const chosenItems = scored[0]?.items || [fruits[0] || snacks[0]];

  chosenItems.forEach(f => usedFoodIds.add(f.id));

  const targetPerItemCal = targetSlotCal / chosenItems.length;
  return chosenItems.map(food => {
    let targetItemCal = targetPerItemCal;
    if (food.category === 'Nuts & Seeds') targetItemCal = Math.min(targetSlotCal * 0.6, targetPerItemCal);
    const rawCal = food.calories || 100;
    const bounds = getCategoryPortionBounds(food.category, targetTotalCalories || targetSlotCal * 13);
    const mult = Math.max(bounds.min, Math.min(bounds.max, targetItemCal / rawCal));
    return createPlannedItem(food, mult, targetTotalCalories || targetSlotCal * 13);
  });
}

/**
 * Generates a full 5-meal daily plan adhering strictly to:
 * - Hard dietary constraint layer (Vegan, Vegetarian, Allergies, Dislikes)
 * - Semantic meal roles & Bangladeshi culinary archetypes
 * - Cross-ingredient compatibility scoring
 * - Strict profile-specific data flow, fingerprinting, and validation gate
 */
export function generateMealPlan(
  input?: PersonalHealthProfile | MealPlanGenerationInput | null,
  options?: { seed?: number; forceRegenerate?: boolean }
): { success: boolean; plan?: DailyMealPlan; errors?: string[] } {
  // 1. Extract and validate profile
  if (!input || typeof input !== 'object') {
    return { success: false, errors: ['A valid health profile is required for meal plan generation.'] };
  }

  const profile: PersonalHealthProfile = 'profile' in input ? input.profile : input;
  if (!profile || typeof profile !== 'object') {
    return { success: false, errors: ['A valid health profile is required for meal plan generation.'] };
  }

  const val = validateProfileForCalculations(profile);
  if (!val.isValid) {
    return { success: false, errors: val.errors };
  }

  const profileFingerprint = createProfileFingerprint(profile);
  const metrics = getFullHealthMetrics(profile);
  const tdee = metrics.dailyEnergyNeedsKcal;

  // Determine target total calories based on health goal or explicit input
  let targetTotalCalories = ('calorieTarget' in input && typeof input.calorieTarget === 'number' && input.calorieTarget > 0)
    ? input.calorieTarget
    : tdee;

  if (!('calorieTarget' in input && typeof input.calorieTarget === 'number' && input.calorieTarget > 0)) {
    if (profile.goal === 'lose_weight') {
      targetTotalCalories = Math.round(tdee * 0.88); // ~12% deficit
    } else if (profile.goal === 'gain_weight') {
      targetTotalCalories = Math.round(tdee * 1.10); // ~10% surplus
    }
  }

  const targetMacros = ('macroTargets' in input && input.macroTargets)
    ? input.macroTargets
    : calculateMacroDistribution(targetTotalCalories);

  // Mandatory Debug Log (Audit Requirement Step 13)
  if (process.env.DEBUG_OPTIMIZER === 'true') {
    console.log('[MealPlan Debug]', {
      profileFingerprint,
      name: profile.name,
      age: profile.age,
      biologicalSex: profile.sex,
      height: profile.heightCm,
      weight: profile.weightKg,
      activityLevel: profile.activityLevel,
      goal: profile.goal,
      dietaryPreference: profile.dietaryPreference,
      allergies: profile.allergies,
      dislikedFoods: profile.dislikedFoods,
      bmi: metrics.bmi,
      bmr: metrics.bmrKcal,
      tdee: metrics.dailyEnergyNeedsKcal,
      calorieTarget: targetTotalCalories,
      macroTargets: targetMacros,
    });
  }

  const userSeed = ('seed' in input && typeof input.seed === 'number') 
    ? input.seed 
    : (options?.seed ?? 1);
  const profileHash = hashStringToSeed(profileFingerprint);
  const baseSeed = userSeed * 10007 + profileHash;

  // Target distributions
  const targetBreakfast = Math.round(targetTotalCalories * 0.225);
  const targetMorningSnack = Math.round(targetTotalCalories * 0.075);
  const targetLunch = Math.round(targetTotalCalories * 0.325);
  const targetAfternoonSnack = Math.round(targetTotalCalories * 0.075);
  const targetDinner = Math.round(targetTotalCalories * 0.300);

  // Safe foods filter (Strict Dietary Constraint Layer)
  const safeFoods = getCompatibleFoods(profile);
  if (safeFoods.length === 0) {
    return {
      success: false,
      errors: ['No suitable Bangladeshi food items found matching your strict dietary preference and allergy constraints. Please review your profile.'],
    };
  }

  // Multi-Candidate Generation and Proximity Evaluation Pool
  const candidatePool: Array<{
    plan: DailyMealPlan;
    absDiff: number;
    pctDiff: number;
    initialCalories: number;
    planScore: number;
    totalFoodItems: number;
    totalComplexityPenalty: number;
  }> = [];
  const rejectionReasons: string[] = [];
  let totalCandidatesEvaluated = 0;

  for (let attempt = 0; attempt < 5; attempt++) {
    totalCandidatesEvaluated++;
    const currentSeed = baseSeed + attempt * 137;
    const rng = createPRNG(currentSeed);
    const usedFoodIds = new Set<string>();

    // 1. Breakfast
    const breakfastItems = generateBreakfastCandidates(safeFoods, profile, targetBreakfast, usedFoodIds, rng, profileFingerprint, targetTotalCalories);
    const bNut = calculateMealSlotNutrition(breakfastItems);
    const breakfastSlot: MealSlot = {
      id: 'slot-breakfast',
      type: 'Breakfast',
      title: 'Breakfast (সকালের নাস্তা)',
      banglaTitle: 'সকালের নাস্তা',
      targetCalorieRange: { min: Math.round(targetTotalCalories * 0.20), max: Math.round(targetTotalCalories * 0.25) },
      items: breakfastItems,
      ...bNut,
      notes: 'Hearty morning meal cooked with minimal oil for sustained energy.',
    };

    // 2. Morning Snack
    const morningSnackItems = generateSnackCandidates('Morning Snack', safeFoods, profile, targetMorningSnack, usedFoodIds, rng, profileFingerprint, targetTotalCalories);
    const msNut = calculateMealSlotNutrition(morningSnackItems);
    const morningSnackSlot: MealSlot = {
      id: 'slot-morning-snack',
      type: 'Morning Snack',
      title: 'Morning Snack (মিড-মর্নিং নাস্তা)',
      banglaTitle: 'মিড-মর্নিং নাস্তা',
      targetCalorieRange: { min: Math.round(targetTotalCalories * 0.05), max: Math.round(targetTotalCalories * 0.10) },
      items: morningSnackItems,
      ...msNut,
      notes: 'Light nutritious mid-morning bite rich in vitamins, minerals, or fiber.',
      isOptional: true,
      skipped: false,
    };

    // 3. Lunch
    const lunchItems = generateLunchCandidates(safeFoods, profile, targetLunch, usedFoodIds, rng, profileFingerprint, targetTotalCalories);
    const lNut = calculateMealSlotNutrition(lunchItems);
    const lunchSlot: MealSlot = {
      id: 'slot-lunch',
      type: 'Lunch',
      title: 'Lunch (দুপুরের খাবার)',
      banglaTitle: 'দুপুরের খাবার',
      targetCalorieRange: { min: Math.round(targetTotalCalories * 0.30), max: Math.round(targetTotalCalories * 0.35) },
      items: lunchItems,
      ...lNut,
      notes: 'Balanced midday meal centered around rice, protein (fish/poultry/dal), and fresh vegetables.',
    };

    // 4. Afternoon Snack
    const afternoonSnackItems = generateSnackCandidates('Afternoon Snack', safeFoods, profile, targetAfternoonSnack, usedFoodIds, rng, profileFingerprint, targetTotalCalories);
    const asNut = calculateMealSlotNutrition(afternoonSnackItems);
    const afternoonSnackSlot: MealSlot = {
      id: 'slot-afternoon-snack',
      type: 'Afternoon Snack',
      title: 'Afternoon Snack (বিকেলের নাস্তা)',
      banglaTitle: 'বিকেলের নাস্তা',
      targetCalorieRange: { min: Math.round(targetTotalCalories * 0.05), max: Math.round(targetTotalCalories * 0.10) },
      items: afternoonSnackItems,
      ...asNut,
      notes: 'Traditional tea-time refreshment to maintain steady metabolic activity.',
      isOptional: true,
      skipped: false,
    };

    // 5. Dinner
    const dinnerItems = generateDinnerCandidates(safeFoods, profile, targetDinner, usedFoodIds, rng, profileFingerprint, targetTotalCalories);
    const dNut = calculateMealSlotNutrition(dinnerItems);
    const dinnerSlot: MealSlot = {
      id: 'slot-dinner',
      type: 'Dinner',
      title: 'Dinner (রাতের খাবার)',
      banglaTitle: 'রাতের খাবার',
      targetCalorieRange: { min: Math.round(targetTotalCalories * 0.25), max: Math.round(targetTotalCalories * 0.30) },
      items: dinnerItems,
      ...dNut,
      notes: 'Easily digestible evening meal cooked in light broth or dry bhaji style.',
    };

    let rawMeals = [breakfastSlot, morningSnackSlot, lunchSlot, afternoonSnackSlot, dinnerSlot];
    const initialCalories = rawMeals.reduce((sum, m) => sum + m.totalCalories, 0);

    // Controlled Day Calorie Balancing pass (bounded micro-scaling)
    if (initialCalories > 0 && Math.abs(initialCalories - targetTotalCalories) > 15) {
      const rawScale = targetTotalCalories / initialCalories;
      const scaleFactor = Math.max(0.55, Math.min(2.50, rawScale));

      rawMeals = rawMeals.map(slot => {
        const updatedItems = slot.items.map(item => {
          const bounds = getCategoryPortionBounds(item.foodItem.category, targetTotalCalories);
          const desiredMult = item.portionMultiplier * scaleFactor;
          const adjustedMult = Math.max(bounds.min, Math.min(bounds.max, Number(desiredMult.toFixed(2))));
          return createPlannedItem(item.foodItem, adjustedMult, targetTotalCalories);
        });
        const slotNut = calculateMealSlotNutrition(updatedItems);
        return {
          ...slot,
          items: updatedItems,
          ...slotNut,
        };
      });
    }

    const actualTotalCalories = rawMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalCalories), 0);
    const totalProteinGrams = Number(rawMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalProteinGrams), 0).toFixed(1));
    const totalCarbsGrams = Number(rawMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalCarbsGrams), 0).toFixed(1));
    const totalFatGrams = Number(rawMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalFatGrams), 0).toFixed(1));
    const totalFiberGrams = Number(rawMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalFiberGrams), 0).toFixed(1));

    const candidatePlan: DailyMealPlan = {
      id: `plan-${userSeed}-${profileHash.toString(36)}-${attempt}-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      profileFingerprint,
      targetTotalCalories,
      actualTotalCalories,
      totalProteinGrams,
      totalCarbsGrams,
      totalFatGrams,
      totalFiberGrams,
      meals: rawMeals,
      profileSnapshot: {
        name: profile.name,
        dietaryPreference: profile.dietaryPreference,
        allergies: [...profile.allergies],
        dislikedFoods: [...profile.dislikedFoods],
        goal: profile.goal,
        tdee: targetTotalCalories,
      },
    };

    // Validation Gate
    const validation = validateDailyMealPlan(candidatePlan, profile);
    if (validation.isValid) {
      const absDiff = Math.abs(actualTotalCalories - targetTotalCalories);
      const pctDiff = targetTotalCalories > 0 ? (absDiff / targetTotalCalories) * 100 : 0;

      // Calculate whole-day complexity and simplicity metrics
      let totalComplexityPenalty = 0;
      let totalFoodItems = 0;
      let hasOvercrowdedMeal = false;

      for (const meal of candidatePlan.meals) {
        const mealFoods = meal.items.map(i => i.foodItem);
        totalFoodItems += mealFoods.length;
        const evalResult = calculateMealComplexityScore(mealFoods, meal.type);
        totalComplexityPenalty += evalResult.penalty;
        if (evalResult.isOvercrowded) {
          hasOvercrowdedMeal = true;
          rejectionReasons.push(`Attempt ${attempt}: Overcrowded meal in ${meal.type}: ${evalResult.reasons.join(', ')}`);
        }
      }

      // Reject plan if any meal is overcrowded
      if (hasOvercrowdedMeal) {
        continue;
      }

      // Base Plan Score starts at 100
      let planScore = 100.0 - totalComplexityPenalty;

      // Simplicity Bonus: Preferred total daily food count is 10 to 14 items across all 5 slots
      if (totalFoodItems <= 13) {
        planScore += 25; // Simplicity bonus
      } else if (totalFoodItems <= 15) {
        planScore += 12;
      } else {
        planScore -= (totalFoodItems - 15) * 20; // Penalize excess items
      }

      // Calorie Proximity score (calibrated so minor calorie differences never override meal simplicity)
      if (pctDiff <= 1.5) {
        planScore += 30;
      } else if (pctDiff <= 3.0) {
        planScore += 20;
      } else if (pctDiff <= 5.0) {
        planScore += 10;
      } else {
        planScore -= 50;
      }

      candidatePool.push({
        plan: candidatePlan,
        absDiff,
        pctDiff,
        initialCalories,
        planScore,
        totalFoodItems,
        totalComplexityPenalty,
      });

      // Early break if candidate has high score, within 1.5% calorie target, and we have enough candidates
      if ((candidatePool.length >= 1 && pctDiff <= 1.2 && planScore >= 120) || candidatePool.length >= 3) {
        break;
      }
    } else {
      rejectionReasons.push(`Attempt ${attempt}: ${validation.errors.join('; ')}`);
    }
  }

  if (candidatePool.length === 0) {
    return {
      success: false,
      errors: [
        'Unable to generate a 100% compliant meal plan with current profile constraints.',
        ...rejectionReasons.slice(0, 3)
      ],
    };
  }

  // Sort candidate pool by holistic planScore (simplicity & coherence prioritized over minor calorie difference)
  candidatePool.sort((a, b) => {
    if (Math.abs(b.planScore - a.planScore) > 4) {
      return b.planScore - a.planScore;
    }
    if (a.totalFoodItems !== b.totalFoodItems) {
      return a.totalFoodItems - b.totalFoodItems; // Prefer fewer food items
    }
    return a.absDiff - b.absDiff;
  });

  let bestCandidate = candidatePool[0];
  let finalPlan = bestCandidate.plan;

  // Controlled Second-Pass Refinement (if best candidate has > 2.5% difference)
  if (bestCandidate.pctDiff > 2.5) {
    let currentRefinedMeals = finalPlan.meals;
    for (let step = 0; step < 3; step++) {
      const currentCal = currentRefinedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalCalories), 0);
      const calorieDiff = currentCal - targetTotalCalories;
      if (Math.abs(calorieDiff) <= targetTotalCalories * 0.02) break;

      const isUnder = calorieDiff < -20;
      const isOver = calorieDiff > 20;
      const addStep = Math.abs(calorieDiff) > 250 ? 0.22 : Math.abs(calorieDiff) > 120 ? 0.15 : 0.08;

      currentRefinedMeals = currentRefinedMeals.map(slot => {
        const refinedItems = slot.items.map(item => {
          const bounds = getCategoryPortionBounds(item.foodItem.category, targetTotalCalories);
          let adjustedMult = item.portionMultiplier;
          if (isUnder && (item.foodItem.primaryRole === 'staple' || item.foodItem.primaryRole === 'protein' || item.foodItem.category === 'Nuts & Seeds' || item.foodItem.category === 'Dal & Legumes' || item.foodItem.category === 'Rice & Grains')) {
            adjustedMult = Math.min(bounds.max, Number((item.portionMultiplier + addStep).toFixed(2)));
          } else if (isOver && (item.foodItem.primaryRole === 'staple' || item.foodItem.primaryRole === 'protein' || item.foodItem.category === 'Rice & Grains')) {
            adjustedMult = Math.max(bounds.min, Number((item.portionMultiplier - addStep).toFixed(2)));
          }
          return createPlannedItem(item.foodItem, adjustedMult, targetTotalCalories);
        });
        const slotNut = calculateMealSlotNutrition(refinedItems);
        return {
          ...slot,
          items: refinedItems,
          ...slotNut,
        };
      });
    }

    const refinedCalories = currentRefinedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalCalories), 0);
    const refinedProtein = Number(currentRefinedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalProteinGrams), 0).toFixed(1));
    const refinedCarbs = Number(currentRefinedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalCarbsGrams), 0).toFixed(1));
    const refinedFat = Number(currentRefinedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalFatGrams), 0).toFixed(1));
    const refinedFiber = Number(currentRefinedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalFiberGrams), 0).toFixed(1));

    const refinedPlan: DailyMealPlan = {
      ...finalPlan,
      actualTotalCalories: refinedCalories,
      totalProteinGrams: refinedProtein,
      totalCarbsGrams: refinedCarbs,
      totalFatGrams: refinedFat,
      totalFiberGrams: refinedFiber,
      meals: currentRefinedMeals,
    };

    const refinedValidation = validateDailyMealPlan(refinedPlan, profile);
    if (refinedValidation.isValid && Math.abs(refinedCalories - targetTotalCalories) < bestCandidate.absDiff) {
      finalPlan = refinedPlan;
    }
  }

  // Diagnostic Proximity Validation Report
  const proximityResult = validateDailyCalorieProximity(finalPlan, targetTotalCalories, 0.05);

  if (process.env.DEBUG_OPTIMIZER === 'true') {
    console.log('[MealPlan Proximity Optimization]', {
      targetCalories: targetTotalCalories,
      initialCandidateCalories: bestCandidate.initialCalories,
      optimizationIterations: totalCandidatesEvaluated,
      validCandidatesCount: candidatePool.length,
      finalCalories: finalPlan.actualTotalCalories,
      calorieDifference: finalPlan.actualTotalCalories - targetTotalCalories,
      percentageDifference: `${proximityResult.percentageDifference}%`,
      status: proximityResult.status,
      message: proximityResult.message,
      rejectedCandidateCount: rejectionReasons.length,
    });
  }

  // Record all selected foods into rotation memory for diversity tracking
  const allUsedFoodIds = finalPlan.meals.flatMap(m => m.items.map(i => i.foodItem.id));
  recordUsedFoods(profileFingerprint, allUsedFoodIds);

  return { success: true, plan: finalPlan };
}

/**
 * Gets alternative food replacement options for a specific item in a meal slot.
 * Ensures replacements adhere strictly to dietary preferences, allergies, slot suitability, and pair compatibility.
 */
export function getMealSwapAlternatives(
  currentFoodItem: FoodItem,
  profile: PersonalHealthProfile,
  slotType: MealType,
  existingItemsInMeal: FoodItem[] = []
): FoodItem[] {
  const safeFoods = getCompatibleFoods(profile);

  // 1. Filter out current food
  let alternatives = safeFoods.filter(f => f.id !== currentFoodItem.id);

  // 2. Filter by slot suitability
  alternatives = alternatives.filter(f => isFoodSuitableForSlot(f, slotType));

  // 3. Filter by role compatibility with the food being replaced
  const curRole = currentFoodItem.primaryRole;
  const curCat = currentFoodItem.category;

  alternatives = alternatives.filter(f => {
    if (curRole === 'staple') {
      return f.primaryRole === 'staple' || f.category === 'Rice & Grains' || f.id === 'trad-01' || f.id === 'grain-08' || f.id === 'grain-09';
    }
    if (curRole === 'protein' || curRole === 'dal') {
      return f.primaryRole === 'protein' || f.primaryRole === 'dal' || ['Fish', 'Chicken & Other Poultry', 'Meat', 'Eggs', 'Dal & Legumes'].includes(f.category) || f.id.startsWith('snack-0') || f.id === 'trad-06';
    }
    if (curRole === 'vegetable') {
      return f.primaryRole === 'vegetable' || ['Vegetables', 'Leafy Vegetables'].includes(f.category) || f.id.startsWith('veg-') || f.id.startsWith('leafy-') || f.id.startsWith('trad-');
    }
    if (curRole === 'fruit') {
      return f.category === 'Fruits' || f.category === 'Healthy Snacks' || f.category === 'Nuts & Seeds';
    }
    return f.category === curCat;
  });

  // 4. Filter by pair compatibility with all OTHER existing items in the meal
  const otherItems = existingItemsInMeal.filter(item => item.id !== currentFoodItem.id);
  alternatives = alternatives.filter(candidate => {
    for (const other of otherItems) {
      if (!checkFoodPairCompatibility(candidate, other, slotType).compatible) {
        return false;
      }
    }
    // Verify complete proposed meal combination against archetypes and constraints
    const proposedMeal = [...otherItems, candidate];
    const comboValidation = validateMealCombination(proposedMeal, slotType, profile);
    return comboValidation.valid;
  });

  // 5. Exclude disliked foods strictly
  alternatives = alternatives.filter(f => !isFoodDisliked(f, profile.dislikedFoods));

  // 6. Sort by category match and calorie similarity
  const curCal = currentFoodItem.calories || 100;
  return alternatives.sort((a, b) => {
    const aSameCat = a.category === currentFoodItem.category ? -1 : 1;
    const bSameCat = b.category === currentFoodItem.category ? -1 : 1;
    if (aSameCat !== bSameCat) return aSameCat - bSameCat;

    const diffA = Math.abs((a.calories || 100) - curCal);
    const diffB = Math.abs((b.calories || 100) - curCal);
    return diffA - diffB;
  });
}

/**
 * Swaps a food item in a specific meal slot, verifies the complete resulting meal, and recalculates entire plan totals.
 */
export function swapFoodItemInPlan(
  plan: DailyMealPlan,
  slotId: string,
  itemIndex: number,
  newFood: FoodItem,
  profile?: PersonalHealthProfile
): DailyMealPlan {
  if (!newFood) return plan;
  const updatedMeals = plan.meals.map(slot => {
    if (slot.id !== slotId) return slot;

    const updatedItems = [...slot.items];
    const oldItem = updatedItems[itemIndex];
    if (!oldItem) return slot;

    // Calculate balanced portion multiplier based on old item's calories or category bounds
    const targetCals = oldItem.calories;
    const newBaseCals = newFood.calories || 100;
    const targetMultiplier = targetCals > 0 ? targetCals / newBaseCals : oldItem.portionMultiplier;
    const newItem = createPlannedItem(newFood, targetMultiplier, plan.targetTotalCalories);
    updatedItems[itemIndex] = newItem;

    // Re-verify the complete resulting meal
    if (profile) {
      const slotFoods = updatedItems.map(i => i.foodItem);
      const validation = validateMealCombination(slotFoods, slot.type, profile);
      if (!validation.valid) {
        console.warn(`[Meal Swap Warning in ${slot.type}]: ${validation.errors.join(', ')}`);
      }
    }

    const slotNut = calculateMealSlotNutrition(updatedItems);
    return {
      ...slot,
      items: updatedItems,
      ...slotNut,
    };
  });

  const actualTotalCalories = updatedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalCalories), 0);
  const totalProteinGrams = Number(updatedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalProteinGrams), 0).toFixed(1));
  const totalCarbsGrams = Number(updatedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalCarbsGrams), 0).toFixed(1));
  const totalFatGrams = Number(updatedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalFatGrams), 0).toFixed(1));
  const totalFiberGrams = Number(updatedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalFiberGrams), 0).toFixed(1));

  return {
    ...plan,
    actualTotalCalories,
    totalProteinGrams,
    totalCarbsGrams,
    totalFatGrams,
    totalFiberGrams,
    meals: updatedMeals,
  };
}

/**
 * Toggles skipping an optional snack or meal slot.
 */
export function toggleSlotSkippedInPlan(plan: DailyMealPlan, slotId: string): DailyMealPlan {
  const updatedMeals = plan.meals.map(slot => {
    if (slot.id !== slotId) return slot;
    return { ...slot, skipped: !slot.skipped };
  });

  const actualTotalCalories = updatedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalCalories), 0);
  const totalProteinGrams = Number(updatedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalProteinGrams), 0).toFixed(1));
  const totalCarbsGrams = Number(updatedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalCarbsGrams), 0).toFixed(1));
  const totalFatGrams = Number(updatedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalFatGrams), 0).toFixed(1));
  const totalFiberGrams = Number(updatedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalFiberGrams), 0).toFixed(1));

  return {
    ...plan,
    actualTotalCalories,
    totalProteinGrams,
    totalCarbsGrams,
    totalFatGrams,
    totalFiberGrams,
    meals: updatedMeals,
  };
}

/**
 * Regenerates a single meal slot independently with fresh candidate generation and strict complexity bounds.
 * Does not accumulate or append foods to previous meal state.
 */
export function regenerateMealSlotInPlan(
  plan: DailyMealPlan,
  slotId: string,
  profile: PersonalHealthProfile,
  options?: { seed?: number }
): DailyMealPlan {
  const slotIndex = plan.meals.findIndex(m => m.id === slotId);
  if (slotIndex === -1) return plan;

  const targetSlot = plan.meals[slotIndex];
  const rngSeed = options?.seed ?? (Date.now() + slotIndex * 97);
  const rng = createPRNG(rngSeed);

  // Collect foods used in all OTHER slots to preserve intra-day diversity
  const usedFoodIds = new Set<string>();
  plan.meals.forEach(m => {
    if (m.id !== slotId) {
      m.items.forEach(i => usedFoodIds.add(i.foodItem.id));
    }
  });

  const safeFoods = getCompatibleFoods(profile);

  let newItems: PlannedFoodItem[] = [];
  const targetSlotCal = (targetSlot.targetCalorieRange.min + targetSlot.targetCalorieRange.max) / 2;

  switch (targetSlot.type) {
    case 'Breakfast':
      newItems = generateBreakfastCandidates(safeFoods, profile, targetSlotCal, usedFoodIds, rng, plan.profileFingerprint, plan.targetTotalCalories);
      break;
    case 'Morning Snack':
      newItems = generateSnackCandidates('Morning Snack', safeFoods, profile, targetSlotCal, usedFoodIds, rng, plan.profileFingerprint, plan.targetTotalCalories);
      break;
    case 'Lunch':
      newItems = generateLunchCandidates(safeFoods, profile, targetSlotCal, usedFoodIds, rng, plan.profileFingerprint, plan.targetTotalCalories);
      break;
    case 'Afternoon Snack':
      newItems = generateSnackCandidates('Afternoon Snack', safeFoods, profile, targetSlotCal, usedFoodIds, rng, plan.profileFingerprint, plan.targetTotalCalories);
      break;
    case 'Dinner':
      newItems = generateDinnerCandidates(safeFoods, profile, targetSlotCal, usedFoodIds, rng, plan.profileFingerprint, plan.targetTotalCalories);
      break;
    default:
      newItems = targetSlot.items;
  }

  // Calibrate item multipliers within safe bounds to closely hit the target slot calorie range
  if (newItems.length > 0) {
    const rawSlotCals = newItems.reduce((s, i) => s + i.calories, 0);
    if (rawSlotCals > 0 && Math.abs(rawSlotCals - targetSlotCal) > 15) {
      const scale = targetSlotCal / rawSlotCals;
      newItems = newItems.map(item => {
        const bounds = getCategoryPortionBounds(item.foodItem.category, plan.targetTotalCalories);
        const adjustedMult = Math.max(bounds.min, Math.min(bounds.max, Number((item.portionMultiplier * scale).toFixed(2))));
        return createPlannedItem(item.foodItem, adjustedMult, plan.targetTotalCalories);
      });
    }
  }

  const slotNut = calculateMealSlotNutrition(newItems);
  const updatedSlot: MealSlot = {
    ...targetSlot,
    items: newItems,
    ...slotNut,
  };

  const updatedMeals = [...plan.meals];
  updatedMeals[slotIndex] = updatedSlot;

  const actualTotalCalories = updatedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalCalories), 0);
  const totalProteinGrams = Number(updatedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalProteinGrams), 0).toFixed(1));
  const totalCarbsGrams = Number(updatedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalCarbsGrams), 0).toFixed(1));
  const totalFatGrams = Number(updatedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalFatGrams), 0).toFixed(1));
  const totalFiberGrams = Number(updatedMeals.reduce((sum, m) => sum + (m.skipped ? 0 : m.totalFiberGrams), 0).toFixed(1));

  return {
    ...plan,
    actualTotalCalories,
    totalProteinGrams,
    totalCarbsGrams,
    totalFatGrams,
    totalFiberGrams,
    meals: updatedMeals,
  };
}

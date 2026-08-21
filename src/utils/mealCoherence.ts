import { 
  FoodItem, 
  MealType, 
  PersonalHealthProfile, 
  DailyMealPlan, 
  PlannedFoodItem,
  CalorieProximityValidationResult
} from '../types';
import { ALLERGY_KEYWORD_MAP } from './mealPlanner';
import { getFoodDiversityScore } from './foodRotationMemory';

/**
 * Checks whether a food complies strictly with dietary preference (Vegan, Vegetarian).
 */
export function isDietaryCompliant(food: FoodItem, preference: string): boolean {
  if (!preference || preference === 'no_preference' || preference === 'other' || preference === 'unrestricted') {
    return true;
  }

  if (preference === 'vegan') {
    // Vegan must be strictly plant-based: NO fish, shutki, poultry, meat, egg, dairy, ghee, etc.
    return food.isVegan === true;
  }

  if (preference === 'vegetarian') {
    // Vegetarian: NO meat, poultry, fish, shutki, seafood
    return food.isVegetarian === true;
  }

  return true;
}

/**
 * Checks whether a food item matches any of the user's allergies.
 */
export function isAllergyCompliant(food: FoodItem, userAllergies: string[]): boolean {
  if (!userAllergies || userAllergies.length === 0) return true;

  const foodAllergiesList = (food.allergies || []).map(a => a.toLowerCase().trim());
  const englishName = food.englishName.toLowerCase();
  const banglaName = food.banglaName.toLowerCase();
  const description = (food.description || '').toLowerCase();
  const prep = (food.preparationMethod || '').toLowerCase();

  for (const rawAllergy of userAllergies) {
    const allergy = rawAllergy.toLowerCase().trim();
    if (!allergy) continue;

    // 1. Direct match in food.allergies array
    if (foodAllergiesList.some(fa => fa.includes(allergy) || allergy.includes(fa))) {
      return false;
    }

    // 2. Keyword mapping check
    const normalizedKey = allergy.replace(/[\s-]+/g, '_');
    const keywords = ALLERGY_KEYWORD_MAP[normalizedKey] || ALLERGY_KEYWORD_MAP[allergy] || [allergy];
    
    for (const kw of keywords) {
      if (
        englishName.includes(kw) ||
        banglaName.includes(kw) ||
        description.includes(kw) ||
        prep.includes(kw) ||
        foodAllergiesList.includes(kw)
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Checks whether a food item matches any user disliked foods.
 * Uses exact or word-boundary matching so that "oil" does NOT accidentally reject "Boiled Rice".
 */
export function isDislikeCompliant(food: FoodItem, dislikedFoods: string[]): boolean {
  if (!dislikedFoods || dislikedFoods.length === 0) return true;

  const englishName = food.englishName.toLowerCase();
  const banglaName = food.banglaName.toLowerCase();
  const category = food.category.toLowerCase();

  for (const disliked of dislikedFoods) {
    const d = disliked.toLowerCase().trim();
    if (!d) continue;

    // Direct exact match
    if (englishName === d || banglaName === d) return false;

    // Direct category match for oils/fats when user dislikes "oil", "oils", "fats", "tel"
    if (['oil', 'oils', 'fat', 'fats', 'cooking oil', 'tel', 'তেল'].includes(d)) {
      if (food.category === 'Oils & Fats') return false;
    }

    // Direct category exact match if user explicitly specified an entire food category
    if (
      category === d ||
      category === d + 's' ||
      (d === 'vegetable' && category === 'vegetables') ||
      (d === 'fruit' && category === 'fruits') ||
      (d === 'poultry' && category === 'chicken & other poultry')
    ) {
      return false;
    }

    // Word boundary regex match for English food name
    try {
      const escaped = d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(englishName)) return false;
    } catch {
      if (englishName === d) return false;
    }

    // Bangla substring match
    if (banglaName.includes(d)) return false;

    // Substring match for longer strings (4+ characters)
    if (d.length >= 4 && englishName.includes(d)) return false;
  }

  return true;
}

/**
 * Validates a food item against all hard constraints:
 * - Dietary preference (Vegan / Vegetarian)
 * - Allergies
 * - Dislikes
 */
export function isFoodSafeAndAllowed(food: FoodItem, profile: PersonalHealthProfile): boolean {
  if (!isDietaryCompliant(food, profile.dietaryPreference)) return false;
  if (!isAllergyCompliant(food, profile.allergies)) return false;
  if (!isDislikeCompliant(food, profile.dislikedFoods)) return false;
  return true;
}

/**
 * Validates whether a food item is suitable for a specific meal time slot.
 */
export function isFoodSuitableForSlot(food: FoodItem, slotType: MealType): boolean {
  switch (slotType) {
    case 'Breakfast':
      return food.breakfastSuitable === true;
    case 'Lunch':
      return food.lunchSuitable === true;
    case 'Dinner':
      return food.dinnerSuitable === true;
    case 'Morning Snack':
    case 'Afternoon Snack':
      return food.snackSuitable === true;
    default:
      return true;
  }
}

/**
 * Evaluates pairwise ingredient compatibility between two food items within a meal.
 * Returns true if compatible, or false with reason if incompatible.
 */
export function checkFoodPairCompatibility(
  foodA: FoodItem, 
  foodB: FoodItem, 
  slotType: MealType
): { compatible: boolean; reason?: string } {
  if (foodA.id === foodB.id) {
    return { compatible: false, reason: 'Duplicate identical food item in same meal.' };
  }

  const aId = foodA.id;
  const bId = foodB.id;
  const aRoles = foodA.mealRoles || [];
  const bRoles = foodB.mealRoles || [];
  const aIncomp = foodA.incompatibleGroups || [];
  const bIncomp = foodB.incompatibleGroups || [];
  const aComb = foodA.combinationGroups || [];
  const bComb = foodB.combinationGroups || [];

  // Semantic Duplicate Protection: Multiple foods from the same semantic group cannot be in the same meal
  const groupA = foodA.foodGroup || foodA.semanticGroup;
  const groupB = foodB.foodGroup || foodB.semanticGroup;
  if (groupA && groupB && groupA === groupB && foodA.id !== foodB.id) {
    return {
      compatible: false,
      reason: `Semantic duplicate items: "${foodA.englishName}" and "${foodB.englishName}" share the same food group (${groupA}).`
    };
  }

  // Group-based incompatibility checks
  for (const group of aIncomp) {
    if (bComb.includes(group)) {
      return { compatible: false, reason: `Incompatible combination: ${foodA.englishName} conflicts with ${foodB.englishName} (${group}).` };
    }
  }
  for (const group of bIncomp) {
    if (aComb.includes(group)) {
      return { compatible: false, reason: `Incompatible combination: ${foodB.englishName} conflicts with ${foodA.englishName} (${group}).` };
    }
  }

  // 1. Oats specific rules
  const isAOats = aId === 'grain-07' || aRoles.includes('breakfast_cereal');
  const isBOats = bId === 'grain-07' || bRoles.includes('breakfast_cereal');
  if (isAOats || isBOats) {
    const other = isAOats ? foodB : foodA;
    // Oats is NEVER compatible with fish, shutki, poultry, meat, or savoury curry/shak
    if (
      other.category === 'Fish' ||
      other.category === 'Chicken & Other Poultry' ||
      other.category === 'Meat' ||
      other.category === 'Leafy Vegetables' ||
      other.id === 'fish-11' ||
      (other.category === 'Vegetables' && other.id !== 'veg-13' && other.id !== 'veg-14') // Except raw carrot/cucumber
    ) {
      return { compatible: false, reason: `Oats cannot be combined with savoury fish, meat, shutki, or curry vegetables.` };
    }
    if (slotType === 'Lunch' || slotType === 'Dinner') {
      return { compatible: false, reason: `Oats is not a suitable staple for Bangladeshi lunch or dinner.` };
    }
  }

  // 2. Shutki specific rules
  const isAShutki = aId === 'fish-11' || aRoles.includes('animal_protein_shutki');
  const isBShutki = bId === 'fish-11' || bRoles.includes('animal_protein_shutki');
  if (isAShutki || isBShutki) {
    const other = isAShutki ? foodB : foodA;
    if (
      other.category === 'Fruits' ||
      other.category === 'Dairy' ||
      other.category === 'Beverages' ||
      isAOats || isBOats ||
      other.id === 'grain-05' || // Chira
      other.id === 'grain-06'    // Muri
    ) {
      return { compatible: false, reason: `Shutki is a pungent traditional dish and cannot be combined with dairy, fruits, oats, or sweet snacks.` };
    }
  }

  // 3. Fish + Dairy / Milk rules
  const isAFish = foodA.category === 'Fish';
  const isBFish = foodB.category === 'Fish';
  const isAMilk = aId === 'dairy-01';
  const isBMilk = bId === 'dairy-01';
  if ((isAFish && isBMilk) || (isBFish && isAMilk)) {
    return { compatible: false, reason: `Fish and liquid cow milk are incompatible in traditional Bangladeshi meals.` };
  }

  // 4. Fish / Meat + Whole Fruit in Lunch/Dinner
  const isAAnimalProt = ['Fish', 'Chicken & Other Poultry', 'Meat'].includes(foodA.category);
  const isBAnimalProt = ['Fish', 'Chicken & Other Poultry', 'Meat'].includes(foodB.category);
  const isAFruit = foodA.category === 'Fruits';
  const isBFruit = foodB.category === 'Fruits';
  if ((slotType === 'Lunch' || slotType === 'Dinner') && ((isAAnimalProt && isBFruit) || (isBAnimalProt && isAFruit))) {
    return { compatible: false, reason: `Whole fruit cannot be served as a direct side to fish or meat curry in lunch/dinner.` };
  }

  // 5. Multiple unrelated heavy staples in one meal
  const isAStaple = foodA.primaryRole === 'staple' || foodA.category === 'Rice & Grains' || foodA.id === 'trad-01';
  const isBStaple = foodB.primaryRole === 'staple' || foodB.category === 'Rice & Grains' || foodB.id === 'trad-01';
  if (isAStaple && isBStaple) {
    // Both are staples - allow only if one is Khichuri + light bhaji, but prevent Rice + Oats or Rice + Chira
    if ((aId === 'grain-07' && bId !== 'grain-07') || (bId === 'grain-07' && aId !== 'grain-07')) {
      return { compatible: false, reason: `Cannot combine oats with traditional rice staple in the same meal.` };
    }
    if ((aId.startsWith('grain-0') && bId.startsWith('grain-0')) && aId !== bId) {
      return { compatible: false, reason: `Cannot combine multiple different grain staples in one meal.` };
    }
  }

  return { compatible: true };
}

/**
 * Checks whether an entire meal combination of 1 to 4 items is cohesive and valid.
 */
export function validateMealCombination(
  items: FoodItem[], 
  slotType: MealType, 
  profile: PersonalHealthProfile
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!items || items.length === 0) {
    return { valid: false, errors: ['Meal slot is empty.'] };
  }

  // 1. Hard constraints per food
  for (const food of items) {
    if (!isDietaryCompliant(food, profile.dietaryPreference)) {
      errors.push(`Food "${food.englishName}" violates dietary preference (${profile.dietaryPreference}).`);
    }
    if (!isAllergyCompliant(food, profile.allergies)) {
      errors.push(`Food "${food.englishName}" violates user allergy.`);
    }
    if (!isDislikeCompliant(food, profile.dislikedFoods)) {
      errors.push(`Food "${food.englishName}" is in user's disliked food list.`);
    }
    if (!isFoodSuitableForSlot(food, slotType)) {
      errors.push(`Food "${food.englishName}" is not suitable for ${slotType}.`);
    }
  }

  // 2. Pairwise compatibility check
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const check = checkFoodPairCompatibility(items[i], items[j], slotType);
      if (!check.compatible) {
        errors.push(check.reason || `Incompatible foods: ${items[i].englishName} + ${items[j].englishName}`);
      }
    }
  }

  // 3. Slot-specific archetype constraints
  if (slotType === 'Lunch' || slotType === 'Dinner') {
    // Must contain a main staple (Rice, Brown Rice, Red Rice, Parboiled Rice, Roti, Porota, Khichuri)
    const hasStaple = items.some(f => 
      ['grain-01', 'grain-02', 'grain-03', 'grain-04', 'grain-08', 'grain-09', 'trad-01'].includes(f.id) || f.primaryRole === 'staple'
    );
    if (!hasStaple) {
      errors.push(`${slotType} must contain a valid Bangladeshi staple (Rice, Roti, Porota, or Khichuri).`);
    }

    // Must have a protein source (Fish, Meat, Poultry, Egg, Dal, Legumes, Tofu)
    const hasProtein = items.some(f => 
      f.isProteinSource || 
      ['Fish', 'Chicken & Other Poultry', 'Meat', 'Eggs', 'Dal & Legumes'].includes(f.category) ||
      f.id === 'snack-01' || f.id === 'snack-02' || f.id === 'snack-03' || f.id === 'trad-01'
    );
    if (!hasProtein) {
      errors.push(`${slotType} must contain a protein source (Fish, Chicken, Egg, Dal, or Legumes).`);
    }

    // Must have a vegetable or leafy green or dal side
    const hasVegOrSide = items.some(f => 
      f.isVegetable || 
      f.category === 'Vegetables' || 
      f.category === 'Leafy Vegetables' || 
      f.category === 'Dal & Legumes' ||
      f.id.startsWith('veg-') ||
      f.id.startsWith('leafy-') ||
      f.id === 'trad-02' || f.id === 'trad-03' || f.id === 'trad-05'
    );
    if (!hasVegOrSide) {
      errors.push(`${slotType} must contain a vegetable, leafy shak, or dal side.`);
    }
  }

  if (slotType === 'Morning Snack' || slotType === 'Afternoon Snack') {
    // Snack should strictly be 1-2 items, snack-appropriate
    if (items.length > 2) {
      errors.push(`Snack slot should not contain more than 2 items (found ${items.length}).`);
    }
    const hasNonSnack = items.some(f => !f.snackSuitable);
    if (hasNonSnack) {
      errors.push(`Snack slot contains foods not suitable as snacks.`);
    }
  }

  if (slotType === 'Breakfast') {
    // Breakfast preferred 2-3 items, max 4 only under justified circumstances, never 5+
    if (items.length > 4) {
      errors.push(`Breakfast slot should not contain more than 4 items (found ${items.length}).`);
    }
  }

  if (slotType === 'Lunch' || slotType === 'Dinner') {
    // Lunch and dinner preferred 3 items, max 4 (classic thali), never 5+
    if (items.length > 4) {
      errors.push(`${slotType} slot should not contain more than 4 items (found ${items.length}). Never crowd meal with 5+ dishes.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export interface MealComplexityEvaluation {
  complexityScore: number;
  penalty: number;
  isOvercrowded: boolean;
  itemCount: number;
  preferredMax: number;
  reasons: string[];
}

/**
 * Calculates a measurable meal complexity score and ranking penalty based on:
 * - Number of food items
 * - Duplicate nutritional roles
 * - Redundant protein sources
 * - Redundant vegetables
 * - Unnecessary additional dishes / sides
 * - Culturally awkward combinations
 */
export function calculateMealComplexityScore(
  items: FoodItem[],
  slotType: MealType
): MealComplexityEvaluation {
  const reasons: string[] = [];
  let penalty = 0;
  const count = items.length;

  let preferredMin = 2;
  let preferredMax = 3;
  let hardLimit = 4;

  if (slotType === 'Morning Snack' || slotType === 'Afternoon Snack') {
    preferredMin = 1;
    preferredMax = 2;
    hardLimit = 2;
  } else if (slotType === 'Breakfast') {
    preferredMin = 2;
    preferredMax = 3;
    hardLimit = 4;
  } else if (slotType === 'Lunch' || slotType === 'Dinner') {
    preferredMin = 3;
    preferredMax = 3; // 3 items preferred (Staple + Protein + Veg or Staple + Dal + Veg)
    hardLimit = 4;    // 4 items only when classic thali [Staple, Non-Dal Protein, Dal, Veg]
  }

  // 1. Item count penalty
  if (count > hardLimit) {
    penalty += 150 + (count - hardLimit) * 50;
    reasons.push(`Meal has ${count} items, exceeding hard limit of ${hardLimit} for ${slotType}`);
  } else if (count > preferredMax) {
    penalty += (count - preferredMax) * 25;
    reasons.push(`Meal has ${count} items, exceeding preferred maximum of ${preferredMax} for ${slotType}`);
  } else if (count < preferredMin) {
    penalty += 10;
    reasons.push(`Meal has only ${count} items, below preferred minimum of ${preferredMin}`);
  }

  // 2. Duplicate nutritional roles & redundant sources
  const staples = items.filter(f => f.primaryRole === 'staple' || f.category === 'Rice & Grains' || f.id === 'trad-01');
  if (staples.length > 1) {
    penalty += 45;
    reasons.push(`Redundant staples: multiple grain/carb staples (${staples.map(s => s.englishName).join(', ')})`);
  }

  const nonDalProteins = items.filter(f => ['Fish', 'Chicken & Other Poultry', 'Meat', 'Eggs'].includes(f.category) || (f.isProteinSource && f.category !== 'Dal & Legumes'));
  if (nonDalProteins.length > 1) {
    penalty += 45;
    reasons.push(`Redundant protein sources: multiple heavy non-dal proteins (${nonDalProteins.map(p => p.englishName).join(', ')})`);
  }

  const liquidDals = items.filter(f => f.primaryRole === 'dal' || (f.category === 'Dal & Legumes' && f.primaryRole !== 'protein'));
  if (liquidDals.length > 1) {
    penalty += 35;
    reasons.push(`Redundant dal dishes: multiple liquid lentils in one meal`);
  }

  const vegDishes = items.filter(f => f.category === 'Vegetables' || f.category === 'Leafy Vegetables' || f.primaryRole === 'vegetable' || f.id.startsWith('veg-') || f.id.startsWith('leafy-'));
  if (vegDishes.length > 2) {
    penalty += 30;
    reasons.push(`Redundant vegetables: ${vegDishes.length} separate vegetable dishes in one meal`);
  }

  // 3. Unnecessary additional dishes / sides in main meals
  if (slotType === 'Lunch' || slotType === 'Dinner') {
    const snacksOrSweets = items.filter(f => 
      (f.category === 'Healthy Snacks' && !f.isProteinSource && f.primaryRole !== 'protein') || 
      f.category === 'Beverages' || 
      (f.category === 'Dairy' && f.id !== 'dairy-01')
    );
    if (snacksOrSweets.length > 0) {
      penalty += 35;
      reasons.push(`Unnecessary snack/side appended to main meal: ${snacksOrSweets.map(s => s.englishName).join(', ')}`);
    }
  }

  const complexityScore = Math.max(0, 100 - penalty);
  const isOvercrowded = count > hardLimit || (count > preferredMax && penalty >= 50);

  return {
    complexityScore,
    penalty,
    isOvercrowded,
    itemCount: count,
    preferredMax,
    reasons
  };
}

/**
 * Scores a candidate meal combination for ranking.
 * Optimization priority:
 * 1. Dietary/allergy safety (pre-filtered & validated)
 * 2. Appropriate meal structure & Bangladeshi culinary coherence
 * 3. Reasonable number of food items (simplicity preference)
 * 4. Nutritional adequacy
 * 5. Calorie proximity (via portion scaling, not item inflation)
 * 6. Food diversity
 */
export function scoreMealCombination(
  items: FoodItem[], 
  slotType: MealType, 
  targetCalories: number, 
  profile: PersonalHealthProfile,
  usedFoodIds: Set<string>,
  profileFingerprint?: string
): number {
  const validation = validateMealCombination(items, slotType, profile);
  if (!validation.valid) {
    return -999999; // Immediate hard rejection
  }

  const complexity = calculateMealComplexityScore(items, slotType);
  if (complexity.penalty >= 140) {
    return -99999; // Reject overcrowded or structurally flawed meals
  }

  let score = 100.0;

  // Apply complexity penalty: simpler meals get higher scores
  score -= complexity.penalty;

  // 1. Simplicity & Preferred Structure bonus
  if (slotType === 'Morning Snack' || slotType === 'Afternoon Snack') {
    if (items.length === 1 || items.length === 2) score += 25;
  } else if (slotType === 'Breakfast') {
    if (items.length === 2 || items.length === 3) score += 25;
    else if (items.length === 4) score -= 15; // 4-item breakfast penalized unless forced by extreme surplus
  } else if (slotType === 'Lunch' || slotType === 'Dinner') {
    if (items.length === 3) {
      score += 30; // 3-item lunch/dinner is the gold standard of simplicity
    } else if (items.length === 4) {
      // 4-item is good only if it's the classic [Staple, Non-Dal Protein, Dal, Veg]
      const hasStaple = items.some(f => f.primaryRole === 'staple' || f.category === 'Rice & Grains');
      const isPlantBased = profile.dietaryPreference === 'vegan' || profile.dietaryPreference === 'vegetarian';
      const hasProtein = items.some(f => ['Fish', 'Chicken & Other Poultry', 'Meat', 'Eggs'].includes(f.category) || (isPlantBased && (f.isProteinSource || f.id === 'veg-29' || f.id === 'nuts-10' || f.id.startsWith('snack-'))));
      const hasDal = items.some(f => f.category === 'Dal & Legumes' || f.primaryRole === 'dal');
      const hasVeg = items.some(f => f.category === 'Vegetables' || f.category === 'Leafy Vegetables' || f.primaryRole === 'vegetable');
      if (hasStaple && hasProtein && hasDal && hasVeg) {
        score += 15; // Culturally justified 4-item thali
      } else {
        score -= 25; // Unjustified 4-item combination
      }
    }
  }

  // 2. Bangladeshi culinary harmony bonus
  const foodIds = items.map(f => f.id);
  const categories = items.map(f => f.category);

  if (slotType === 'Lunch' || slotType === 'Dinner') {
    const hasRiceOrStaple = foodIds.some(id => ['grain-01', 'grain-02', 'grain-03', 'grain-04', 'grain-08', 'grain-09', 'trad-01'].includes(id)) || items.some(f => f.primaryRole === 'staple');
    const hasFish = categories.includes('Fish');
    const hasChicken = categories.includes('Chicken & Other Poultry');
    const hasMeat = categories.includes('Meat');
    const hasEgg = categories.includes('Eggs');
    const hasDal = categories.includes('Dal & Legumes');
    const hasShak = categories.includes('Leafy Vegetables');
    const hasVeg = categories.includes('Vegetables') || foodIds.some(id => id.startsWith('veg-') || id === 'trad-02' || id === 'trad-03' || id === 'trad-05');

    // Classic Bengali pairings:
    // Rice/Roti + Fish + Shak (+30)
    if (hasRiceOrStaple && hasFish && hasShak) score += 30;
    // Rice/Roti + Fish + Veg (+25)
    else if (hasRiceOrStaple && hasFish && hasVeg) score += 25;
    // Rice/Roti + Chicken/Meat + Veg (+25)
    else if (hasRiceOrStaple && (hasChicken || hasMeat) && hasVeg) score += 25;
    // Rice/Roti + Dal + Veg/Bhaji (+25)
    else if (hasRiceOrStaple && hasDal && hasVeg) score += 25;
    // Khichuri + Egg / Bhaji (+25)
    else if (foodIds.includes('trad-01') && (foodIds.includes('egg-01') || hasVeg || hasEgg)) score += 25;
  }

  if (slotType === 'Breakfast') {
    // Oats + Milk/Tok Doi/Fruit/Nuts (+30)
    if (foodIds.includes('grain-07') && (categories.includes('Fruits') || categories.includes('Nuts & Seeds') || categories.includes('Dairy') || foodIds.includes('snack-04'))) {
      score += 30;
    }
    // Roti / Porota / Rice + Dal / Egg / Bhaji (+30)
    if (
      (foodIds.some(id => id.startsWith('grain-0')) || foodIds.includes('trad-01')) &&
      (categories.includes('Dal & Legumes') || foodIds.includes('egg-01') || categories.includes('Vegetables') || foodIds.some(id => id.startsWith('veg-')) || foodIds.includes('trad-02'))
    ) {
      score += 30;
    }
    // Chira / Muri + Tok Doi / Banana / Milk / Nuts (+30)
    if ((foodIds.includes('grain-05') || foodIds.includes('grain-06') || foodIds.includes('trad-04')) && (categories.includes('Dairy') || foodIds.includes('fruit-03') || categories.includes('Nuts & Seeds') || foodIds.includes('snack-04'))) {
      score += 30;
    }
  }

  // 3. Intra-day repetition penalty & Multi-day rotation diversity score
  const mealGroups = new Set<string>();
  for (const food of items) {
    const grp = food.foodGroup || food.semanticGroup;
    if (grp) {
      if (mealGroups.has(grp)) {
        score -= 99999; // Reject combination with duplicate semantic group within same meal
      }
      mealGroups.add(grp);
    }
    if (usedFoodIds.has(food.id)) {
      score -= 45; // Penalty for reusing foods in the same day
    }
    // Rotation diversity modifier (rewards novel foods, penalizes recently repeated foods and groups)
    if (profileFingerprint) {
      score += getFoodDiversityScore(food, profileFingerprint, usedFoodIds);
    }
  }

  // 4. Goal-specific nutritional alignment
  if (profile.goal === 'lose_weight') {
    // Satiety and fiber support for healthy deficit
    const hasShakOrHighFiber = items.some(f => f.category === 'Leafy Vegetables' || (f.fiberGrams && f.fiberGrams >= 2.5));
    if (hasShakOrHighFiber) score += 12;
  } else if (profile.goal === 'gain_weight') {
    // Nutrient and protein density support for surplus
    const hasDenseProteinOrHealthyFat = items.some(f => f.isProteinSource || f.category === 'Nuts & Seeds' || f.category === 'Dairy');
    if (hasDenseProteinOrHealthyFat) score += 12;
  }

  // 5. Scalability evaluation
  // Scalable within realistic portion limits without overcrowding
  const rawMealCal = items.reduce((sum, f) => sum + (f.calories || 100), 0);
  if (targetCalories > 0) {
    const impliedMultiplier = targetCalories / (rawMealCal || 1);
    if (impliedMultiplier >= 0.6 && impliedMultiplier <= 2.2) {
      score += 15;
    }
  }

  return score;
}

/**
 * Validates the entire DailyMealPlan against all safety and quality rules.
 * Returns true if valid, or false with list of specific reasons.
 */
export function validateDailyMealPlan(
  plan: DailyMealPlan, 
  profile: PersonalHealthProfile
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!plan || !plan.meals || plan.meals.length !== 5) {
    return { isValid: false, errors: ['Plan does not have the required 5 meal slots.'] };
  }

  const allItems: PlannedFoodItem[] = plan.meals.flatMap(m => m.items || []);

  // 1. Check all individual food items
  for (const item of allItems) {
    const food = item.foodItem;
    // Vegan check
    if (profile.dietaryPreference === 'vegan' && !food.isVegan) {
      errors.push(`Vegan violation: "${food.englishName}" is not vegan.`);
    }
    // Vegetarian check
    if (profile.dietaryPreference === 'vegetarian' && !food.isVegetarian) {
      errors.push(`Vegetarian violation: "${food.englishName}" is not vegetarian.`);
    }
    // Allergy check
    if (!isAllergyCompliant(food, profile.allergies)) {
      errors.push(`Allergy violation: "${food.englishName}" conflicts with allergy.`);
    }
    // Dislike check
    if (!isDislikeCompliant(food, profile.dislikedFoods)) {
      errors.push(`Dislike violation: "${food.englishName}" is in disliked foods list.`);
    }
    // Portion bounds check
    if (item.portionMultiplier < 0.35 || item.portionMultiplier > 2.85) {
      errors.push(`Portion bound violation: "${food.englishName}" has multiplier ${item.portionMultiplier}x.`);
    }
  }

  // 2. Check each meal slot coherence
  for (const meal of plan.meals) {
    const foods = meal.items.map(i => i.foodItem);
    const slotValidation = validateMealCombination(foods, meal.type, profile);
    if (!slotValidation.valid) {
      errors.push(...slotValidation.errors.map(e => `[${meal.type}] ${e}`));
    }
  }

  // 3. Calorie reasonableness check
  const calDiff = Math.abs(plan.actualTotalCalories - plan.targetTotalCalories);
  const maxAllowedDiff = Math.max(250, Math.round(plan.targetTotalCalories * 0.15));
  if (calDiff > maxAllowedDiff) {
    errors.push(`Calorie deviation too large: Target ${plan.targetTotalCalories} kcal vs Actual ${plan.actualTotalCalories} kcal (Delta: ${calDiff} kcal).`);
  }

  return { isValid: errors.length === 0, errors };
}

export const validateCompleteMealPlan = validateDailyMealPlan;


/**
 * Validates the daily meal plan's calorie proximity against the target.
 * Reports target, planned, absolute difference, percentage difference, and status.
 */
export function validateDailyCalorieProximity(
  plan?: DailyMealPlan | null,
  targetCalories?: number,
  toleranceRatio: number = 0.05
): CalorieProximityValidationResult {
  if (!plan) {
    const target = targetCalories ?? 0;
    return {
      targetCalories: target,
      plannedCalories: 0,
      absoluteDifference: target,
      percentageDifference: -100,
      isWithinTolerance: false,
      status: 'FAIL',
      tolerancePercent: Number((toleranceRatio * 100).toFixed(2)),
      message: `No meal plan generated. Target: ${target} kcal | Planned: 0 kcal | Status: FAIL`,
    };
  }

  const target = targetCalories ?? plan.targetTotalCalories;
  const planned = plan.actualTotalCalories ?? 0;
  const absDiff = Math.abs(planned - target);
  const rawPctDiff = target > 0 ? ((planned - target) / target) * 100 : 0;
  const percentageDifference = Number(rawPctDiff.toFixed(2));
  const tolerancePercent = Number((toleranceRatio * 100).toFixed(2));
  const isWithinTolerance = Math.abs(rawPctDiff) <= tolerancePercent + 0.001;
  const status: 'PASS' | 'FAIL' = isWithinTolerance ? 'PASS' : 'FAIL';

  const sign = planned >= target ? '+' : '';
  const message = `Target: ${target} kcal | Planned: ${planned} kcal | Difference: ${sign}${planned - target} kcal (${sign}${percentageDifference}%) | Status: ${status}`;

  return {
    targetCalories: target,
    plannedCalories: planned,
    absoluteDifference: absDiff,
    percentageDifference,
    isWithinTolerance,
    status,
    tolerancePercent,
    message,
  };
}

/**
 * Validates portion realism across all items in a daily meal plan.
 * Multipliers must be between 0.5x and 2.0x (or 2.2x max under extreme high calorie targets).
 */
export function validatePortionRealism(plan: DailyMealPlan): { isValid: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const meal of plan.meals) {
    if (meal.skipped) continue;
    for (const item of meal.items) {
      if (item.portionMultiplier < 0.35 || item.portionMultiplier > 2.85) {
        violations.push(`Unrealistic portion for "${item.foodItem.englishName}": ${item.portionMultiplier}x in ${meal.type}`);
      }
    }
  }
  return { isValid: violations.length === 0, violations };
}

/**
 * Validates food diversity across the day.
 * - At least 6 distinct food items across non-skipped meals
 * - No single food item provides > 38% of total daily energy
 */
export function validateFoodDiversity(plan: DailyMealPlan): { isValid: boolean; violations: string[]; uniqueCount: number; uniqueSemanticGroupCount?: number } {
  const violations: string[] = [];
  const foodCounts = new Map<string, number>();
  const foodCalories = new Map<string, number>();
  const semanticGroupsSeen = new Set<string>();
  let totalCal = plan.actualTotalCalories || 1;

  for (const meal of plan.meals) {
    if (meal.skipped) continue;
    
    // Check intra-meal semantic duplicate violations
    const mealGroups = new Set<string>();
    for (const item of meal.items) {
      const id = item.foodItem.id;
      foodCounts.set(id, (foodCounts.get(id) || 0) + 1);
      foodCalories.set(id, (foodCalories.get(id) || 0) + item.calories);

      const grp = item.foodItem.foodGroup || item.foodItem.semanticGroup || id;
      if (grp) {
        if (mealGroups.has(grp)) {
          violations.push(`Meal "${meal.title}" contains duplicate foods from the same semantic group "${grp}".`);
        }
        mealGroups.add(grp);
        semanticGroupsSeen.add(grp);
      }
    }
  }

  const uniqueCount = foodCounts.size;
  if (uniqueCount < 6) {
    violations.push(`Low food diversity: Only ${uniqueCount} unique food items in daily plan.`);
  }

  for (const [id, cals] of foodCalories.entries()) {
    const pct = (cals / totalCal) * 100;
    const maxAllowedPct = plan.actualTotalCalories < 1400 ? 48.0 : 38.0;
    if (pct > maxAllowedPct) {
      violations.push(`Excessive dependence on single food (${id}): provides ${pct.toFixed(1)}% of total daily calories.`);
    }
  }

  return { 
    isValid: violations.length === 0, 
    violations, 
    uniqueCount,
    uniqueSemanticGroupCount: semanticGroupsSeen.size 
  };
}

/**
 * Validates macronutrient and fiber distribution.
 */
export function validateNutrientDistribution(plan: DailyMealPlan): { isValid: boolean; violations: string[] } {
  const violations: string[] = [];
  const totalCal = plan.actualTotalCalories || 1;

  const carbCal = plan.totalCarbsGrams * 4;
  const protCal = plan.totalProteinGrams * 4;
  const fatCal = plan.totalFatGrams * 9;

  const carbPct = (carbCal / totalCal) * 100;
  const protPct = (protCal / totalCal) * 100;
  const fatPct = (fatCal / totalCal) * 100;

  if (carbPct < 35 || carbPct > 78) {
    violations.push(`Carbohydrate percentage out of range: ${carbPct.toFixed(1)}% (expected 35-78%)`);
  }
  if (protPct < 10 || protPct > 35) {
    violations.push(`Protein percentage out of range: ${protPct.toFixed(1)}% (expected 10-35%)`);
  }
  if (fatPct < 10 || fatPct > 42) {
    violations.push(`Fat percentage out of range: ${fatPct.toFixed(1)}% (expected 10-42%)`);
  }
  if (plan.totalFiberGrams < 10) {
    violations.push(`Fiber too low: ${plan.totalFiberGrams}g (expected >= 10g)`);
  }

  return { isValid: violations.length === 0, violations };
}

/**
 * Calculates Jaccard similarity score between two daily meal plans based on food IDs.
 * Returns 0.0 (completely distinct) to 1.0 (exact duplicate).
 */
export function calculatePlanSimilarity(planA: DailyMealPlan, planB: DailyMealPlan): number {
  const setA = new Set(planA.meals.flatMap(m => m.items.map(i => i.foodItem.id)));
  const setB = new Set(planB.meals.flatMap(m => m.items.map(i => i.foodItem.id)));

  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return union.size > 0 ? intersection.size / union.size : 1;
}



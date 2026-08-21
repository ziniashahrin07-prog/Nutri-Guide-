/**
 * Nutri Guide - Domain Data Types & Models
 * Core type declarations for health profile, nutrition metrics, Bangladeshi foods,
 * meal plans, AI assistant, and user preferences.
 */

export type Sex = 'male' | 'female';

export type ActivityLevel = 
  | 'sedentary'          // Sedentary (little or no exercise)
  | 'lightly_active'     // Lightly active (exercise 1-3 days/week)
  | 'moderately_active'  // Moderately active (exercise 3-5 days/week)
  | 'very_active'        // Very active (exercise 6-7 days/week)
  | 'extremely_active'   // Extremely active (hard daily exercise / physical job)
  | 'extra_active';      // Alias for compatibility

export type DietaryPreference = 
  | 'no_preference'
  | 'vegetarian'
  | 'vegan'
  | 'other'
  | 'unrestricted';

export type HealthGoal = 
  | 'maintain_weight'
  | 'lose_weight'
  | 'gain_weight'
  | 'improve_nutrition';

export interface PersonalHealthProfile {
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  dietaryPreference: DietaryPreference;
  allergies: string[];
  dislikedFoods: string[];
  dietaryRestrictions: string[];
  goal: HealthGoal;
  createdAt?: string;
  updatedAt?: string;
  isDemo?: boolean;
  isReadOnly?: boolean;
}

export interface HealthProfile {
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  dietaryPreference: DietaryPreference;
  foodPreferences: string[];
  allergies: string[];
  notes?: string;
}

export interface HealthCalculations {
  bmi: number;
  bmiCategory: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obesity';
  bmrKcal: number;
  dailyEnergyNeedsKcal: number;
  macros: {
    carbsGrams: number;
    proteinGrams: number;
    fatGrams: number;
  };
  isValid: boolean;
  validationErrors?: string[];
}

export type FoodCategory =
  | 'Rice & Grains'
  | 'Dal & Legumes'
  | 'Fish'
  | 'Chicken & Other Poultry'
  | 'Meat'
  | 'Eggs'
  | 'Vegetables'
  | 'Leafy Vegetables'
  | 'Fruits'
  | 'Dairy'
  | 'Nuts & Seeds'
  | 'Healthy Snacks'
  | 'Traditional Bangladeshi Foods'
  | 'Oils & Fats'
  | 'Beverages';

export type MealRole =
  | 'staple_grain'
  | 'staple_composite'
  | 'breakfast_cereal'
  | 'breakfast_grain'
  | 'breakfast_bread'
  | 'animal_protein_fish'
  | 'animal_protein_shutki'
  | 'animal_protein_poultry'
  | 'animal_protein_meat'
  | 'egg_protein'
  | 'plant_protein_dal'
  | 'plant_protein_legume'
  | 'plant_protein_soy'
  | 'vegetable_curry'
  | 'vegetable_bhaji'
  | 'leafy_shak'
  | 'fresh_salad'
  | 'whole_fruit'
  | 'nut_seed'
  | 'dairy_curd'
  | 'dairy_milk'
  | 'beverage'
  | 'oil_fat';

export type PrimaryFoodRole =
  | 'staple'
  | 'protein'
  | 'vegetable'
  | 'dal'
  | 'fruit'
  | 'snack'
  | 'condiment'
  | 'beverage'
  | 'fat';

export interface FoodItem {
  id: string;
  englishName: string;
  banglaName: string;
  category: FoodCategory;
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  fiberGrams?: number;
  servingSize?: string;
  servingUnit?: string;
  preparationMethod?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  allergies?: string[];
  availability?: 'High' | 'Medium' | 'Low' | 'Seasonal';
  cookingNotes?: string;
  description?: string;

  // Semantic Food Roles, Grouping & Cuisine Coherence Metadata
  foodGroup?: string;
  semanticGroup?: string;
  mealRoles?: MealRole[];
  primaryRole?: PrimaryFoodRole;
  cuisineCompatibility?: string[];
  dietaryTags?: string[];
  isProteinSource?: boolean;
  isCarbohydrateSource?: boolean;
  isVegetable?: boolean;
  isFruit?: boolean;
  isHealthyFat?: boolean;
  breakfastSuitable?: boolean;
  lunchSuitable?: boolean;
  dinnerSuitable?: boolean;
  snackSuitable?: boolean;
  combinationGroups?: string[];
  incompatibleGroups?: string[];
}

export interface MealRecommendation {
  mealType: 'Breakfast' | 'Lunch' | 'Afternoon Snack' | 'Dinner';
  suggestedFoods: {
    foodItem: FoodItem;
    quantity: string;
  }[];
  totalCalories: number;
  rationale: string;
}

export type MealType = 'Breakfast' | 'Morning Snack' | 'Lunch' | 'Afternoon Snack' | 'Dinner';

export interface PlannedFoodItem {
  foodItem: FoodItem;
  portionMultiplier: number; // e.g. 1.0, 1.5, 0.5
  servingText: string;      // e.g. "1 bowl (150g cooked)", "1 piece (120g)"
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
}

export interface MealSlot {
  id: string;
  type: MealType;
  title: string;
  banglaTitle: string;
  targetCalorieRange: { min: number; max: number };
  items: PlannedFoodItem[];
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  totalFiberGrams: number;
  notes?: string;
  isOptional?: boolean;
  skipped?: boolean;
}

export interface MealPlanGenerationInput {
  profile: PersonalHealthProfile;
  seed?: number;
  calorieTarget?: number;
  macroTargets?: {
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    fiberGrams?: number;
  };
  options?: {
    seed?: number;
    forceRegenerate?: boolean;
  };
}

export interface DailyMealPlan {
  id: string;
  generatedAt: string;
  profileFingerprint: string;
  targetTotalCalories: number;
  actualTotalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  totalFiberGrams: number;
  meals: MealSlot[];
  profileSnapshot: {
    name: string;
    dietaryPreference: DietaryPreference;
    allergies: string[];
    dislikedFoods: string[];
    goal: HealthGoal;
    tdee: number;
  };
  isDemo?: boolean;
  isReadOnly?: boolean;
}

export type AppUserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  createdAt: string;
  role?: AppUserRole;
  healthProfile?: PersonalHealthProfile;
}

export interface DemoProfileRecord {
  configId: 'demo_profile' | 'demo_meal_plan';
  data: PersonalHealthProfile | DailyMealPlan;
  updatedAt: string;
  updatedBy?: string;
}

export interface CalorieProximityValidationResult {
  targetCalories: number;
  plannedCalories: number;
  absoluteDifference: number;
  percentageDifference: number;
  isWithinTolerance: boolean;
  status: 'PASS' | 'FAIL';
  tolerancePercent: number;
  message: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isEducationalDisclaimer?: boolean;
}

export interface UserSession {
  uid: string | null;
  email: string | null;
  displayName: string | null;
  isAuthenticated: boolean;
}

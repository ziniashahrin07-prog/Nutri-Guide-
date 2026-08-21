import { PersonalHealthProfile, HealthCalculations, DailyMealPlan, FoodItem, ChatMessage } from '../types';
import { BANGLADESH_FOOD_DATABASE } from '../data/bangladeshFoodDatabase';
import { isFoodAllergic } from '../utils/mealPlanner';

/**
 * Validates whether a candidate food item is safe for a given user profile.
 * Strictly enforces allergy/intolerance safety and dietary preference safety.
 */
export function validateFoodRecommendation(
  candidateFood: FoodItem,
  profile?: PersonalHealthProfile | null
): { safe: boolean; reason?: string } {
  if (!profile) return { safe: true };

  // 1. Allergy & Intolerance Safety Check
  if (profile.allergies && profile.allergies.length > 0) {
    if (isFoodAllergic(candidateFood, profile.allergies)) {
      return {
        safe: false,
        reason: `Triggers user allergy in profile (${profile.allergies.join(', ')})`,
      };
    }
  }

  // 2. Dietary Preference Safety Check
  if (profile.dietaryPreference === 'vegetarian' && !candidateFood.isVegetarian) {
    return {
      safe: false,
      reason: 'Contains meat/fish/non-vegetarian ingredients (User preference: Vegetarian)',
    };
  }

  if (profile.dietaryPreference === 'vegan' && !candidateFood.isVegan) {
    return {
      safe: false,
      reason: 'Contains animal products (User preference: Vegan)',
    };
  }

  // 3. Disliked Foods Notice
  if (profile.dislikedFoods && profile.dislikedFoods.length > 0) {
    const isDisliked = profile.dislikedFoods.some(disliked =>
      candidateFood.englishName.toLowerCase().includes(disliked.toLowerCase()) ||
      candidateFood.banglaName.includes(disliked)
    );
    if (isDisliked) {
      return {
        safe: true,
        reason: 'User noted this food as disliked in health profile.',
      };
    }
  }

  return { safe: true };
}

/**
 * Context-aware Food Retrieval:
 * Extracts relevant items from Bangladesh Food Database matching query terms
 * while filtering out allergy and dietary preference conflicts.
 */
export function getFoodContext(
  query: string,
  limit: number = 8,
  profile?: PersonalHealthProfile | null
): FoodItem[] {
  if (!Array.isArray(BANGLADESH_FOOD_DATABASE)) return [];

  const q = (query || '').toLowerCase().trim();
  const allergies = (profile?.allergies || []).map(a => a.toLowerCase());
  const isVeg = profile?.dietaryPreference === 'vegetarian';
  const isVegan = profile?.dietaryPreference === 'vegan';

  const scored = BANGLADESH_FOOD_DATABASE.map(food => {
    let score = 0;
    const eng = food.englishName.toLowerCase();
    const bng = food.banglaName.toLowerCase();
    const cat = (food.category || '').toLowerCase();

    // Allergy check
    const matchesAllergy = allergies.some(a =>
      eng.includes(a) || bng.includes(a) || cat.includes(a) || (food.allergies && food.allergies.some(fa => fa.toLowerCase().includes(a)))
    );
    if (matchesAllergy) return { food, score: -100 };

    // Dietary preference check
    if (isVegan && !food.isVegan) return { food, score: -100 };
    if (isVeg && !food.isVegetarian) return { food, score: -100 };

    if (q) {
      if (eng.includes(q) || bng.includes(q)) score += 10;
      const terms = q.split(/\s+/).filter(t => t.length > 2);
      for (const term of terms) {
        if (eng.includes(term) || bng.includes(term)) score += 5;
        if (cat.includes(term)) score += 3;
      }
    }

    if (food.breakfastSuitable && (q.includes('breakfast') || q.includes('shokal') || q.includes('morning'))) score += 4;
    if (food.lunchSuitable && (q.includes('lunch') || q.includes('dupur') || q.includes('midday'))) score += 4;
    if (food.dinnerSuitable && (q.includes('dinner') || q.includes('raat') || q.includes('night'))) score += 4;
    if (food.snackSuitable && (q.includes('snack') || q.includes('nasta') || q.includes('bikal'))) score += 4;

    return { food, score };
  });

  return scored
    .filter(item => item.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.food);
}

/**
 * Assembles application context payload for nutritional queries.
 */
export function buildNutritionContext(
  profile?: PersonalHealthProfile | null,
  calculations?: HealthCalculations | null,
  currentMealPlan?: DailyMealPlan | null,
  activeContext?: string
) {
  return {
    profile: profile ? {
      name: profile.name,
      age: profile.age,
      sex: profile.sex,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      activityLevel: profile.activityLevel,
      goal: profile.goal,
      dietaryPreference: profile.dietaryPreference,
      allergies: profile.allergies || [],
      dislikedFoods: profile.dislikedFoods || [],
    } : null,
    metrics: calculations ? {
      bmi: calculations.bmi,
      bmiCategory: calculations.bmiCategory,
      bmrKcal: calculations.bmrKcal,
      tdeeKcal: calculations.dailyEnergyNeedsKcal,
      macros: calculations.macros,
    } : null,
    mealPlan: currentMealPlan ? {
      targetTotalCalories: currentMealPlan.targetTotalCalories,
      actualTotalCalories: currentMealPlan.actualTotalCalories,
      meals: currentMealPlan.meals?.map(m => ({
        type: m.type,
        title: m.title,
        calories: m.totalCalories,
        items: m.items?.map(i => ({
          name: `${i.foodItem.banglaName} (${i.foodItem.englishName})`,
          portion: i.servingText,
          calories: i.calories,
        }))
      }))
    } : null,
    activePageContext: activeContext || 'General Assistant',
  };
}

export interface AssistantRequestOptions {
  profile?: PersonalHealthProfile | null;
  calculations?: HealthCalculations | null;
  currentMealPlan?: DailyMealPlan | null;
  activeContext?: string;
  chatHistory?: ChatMessage[];
  signal?: AbortSignal;
}

/**
 * Sends the current user prompt along with structured context and recent dialogue history
 * to the server-side AI endpoint (/api/ai/nutrition-assistant).
 */
export async function getNutritionAssistantResponse(
  prompt: string,
  options: AssistantRequestOptions = {}
): Promise<{ answer: string; isConfigured?: boolean; error?: string }> {
  const { profile, calculations, currentMealPlan, activeContext, chatHistory, signal } = options;
  const recentHistory = chatHistory?.map(m => ({ sender: m.sender, content: m.content })).slice(-10) || [];

  try {
    const foodDatabaseContext = getFoodContext(prompt, 8, profile);

    const body = {
      prompt,
      userProfile: profile ? {
        name: profile.name,
        age: profile.age,
        sex: profile.sex,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        activityLevel: profile.activityLevel,
        goal: profile.goal,
        dietaryPreference: profile.dietaryPreference,
        allergies: profile.allergies || [],
        dislikedFoods: profile.dislikedFoods || [],
      } : null,
      nutritionCalculations: calculations ? {
        bmi: calculations.bmi,
        bmiCategory: calculations.bmiCategory,
        bmrKcal: calculations.bmrKcal,
        dailyEnergyNeedsKcal: calculations.dailyEnergyNeedsKcal,
        macros: calculations.macros,
      } : null,
      currentMealPlan: currentMealPlan ? {
        targetTotalCalories: currentMealPlan.targetTotalCalories,
        actualTotalCalories: currentMealPlan.actualTotalCalories,
        meals: currentMealPlan.meals?.map(m => ({
          type: m.type,
          title: m.title,
          totalCalories: m.totalCalories,
          items: m.items?.map(i => ({
            foodItem: {
              banglaName: i.foodItem.banglaName,
              englishName: i.foodItem.englishName,
              calories: i.foodItem.calories,
              proteinGrams: i.foodItem.proteinGrams,
              carbsGrams: i.foodItem.carbsGrams,
              fatGrams: i.foodItem.fatGrams,
            },
            servingText: i.servingText,
            calories: i.calories,
          }))
        }))
      } : null,
      foodDatabaseContext,
      activeContext: activeContext || 'NutriGuide Assistant',
      chatHistory: recentHistory,
    };

    const response = await fetch('/api/ai/nutrition-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        answer: '',
        error: data.error || `Server returned error (${response.status})`,
        isConfigured: data.isConfigured !== false,
      };
    }

    if (data.answer) {
      return {
        answer: data.answer,
        isConfigured: true,
      };
    }

    return {
      answer: '',
      error: data.error || 'Unable to receive a valid response from the nutrition assistant.',
      isConfigured: true,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        answer: '',
        error: 'Request aborted',
      };
    }
    return {
      answer: '',
      error: err.message || 'Network error occurred while connecting to the assistant.',
    };
  }
}

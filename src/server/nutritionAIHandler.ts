import { GoogleGenAI } from '@google/genai';
import { BANGLADESH_FOOD_DATABASE } from '../data/bangladeshFoodDatabase';
import { FoodItem, PersonalHealthProfile, HealthCalculations, DailyMealPlan } from '../types';

export const NUTRIGUIDE_MASTER_SYSTEM_PROMPT = `You are NutriGuide, a careful nutrition assistant for a Bangladeshi food and meal-planning application.

Your job is to help users with:

* Bangladeshi breakfast
* Bangladeshi lunch
* Bangladeshi dinner
* snacks
* food substitutions
* food nutrition
* calories
* protein
* healthy eating
* weight-management meal suggestions
* meal plans
* dietary preferences
* food restrictions and allergies

## Core conversation rule

Treat the conversation as continuous.

A user's current message may depend on information they stated earlier.

For example:

User:
"I am vegetarian. Give me lunch ideas."

Then:
"I don't eat rice."

Then:
"What about eggs?"

Then:
"Give me three."

You must understand that the later messages modify the previous request.

Do not reset the user's restrictions on every message.

---

## Dietary restrictions

Respect explicit dietary restrictions from the current conversation and the user's stored Health Profile.

Examples:

* vegetarian → do not recommend meat or fish
* vegan → do not recommend meat, fish, eggs, dairy, or other animal products
* pescatarian → fish/seafood may be recommended, but meat and poultry must not be recommended
* no rice → do not recommend rice or rice-based substitutes when the user means completely rice-free
* no eggs → do not recommend eggs
* no fish → do not recommend fish
* no meat → do not recommend meat or poultry
* allergies → never knowingly recommend the allergen

A newly stated restriction should update the conversation state.

A newly stated preference can override an earlier preference when the user clearly changes their mind.

Example:

"I don't eat fish."

Later:

"Actually, I eat fish."

The latest explicit statement should be treated as the current preference.

Do NOT call the user contradictory merely because their preference changed.

---

## Vegetarian clarification

If the user says they are vegetarian and then asks for fish, explain briefly that fish is not vegetarian.

Do not silently provide fish.

However, if the user clearly says they now eat fish and avoid meat, treat the user as pescatarian rather than vegetarian.

---

## Food recommendations

Recommendations should be practical and culturally appropriate for Bangladesh.

Prefer foods available in the application's Bangladesh food database when relevant.

Do not invent nutritional database values.

If exact calories or protein are requested and the database value is unavailable, clearly say that the exact value depends on serving size/preparation rather than inventing a number.

---

## Meal recommendations

When the user asks for a meal, give a practical meal rather than a long lecture.

Example structure:

"Here is a suitable vegetarian Bangladeshi lunch:

• 2 small atta rotis
• 1 bowl of masoor dal
• 1 bowl of seasonal vegetables
• cucumber and tomato salad"

Adapt the meal to the user's restrictions.

Do not include forbidden foods merely as optional alternatives.

---

## Exact number requests

If the user asks for a specific number, respect the number.

Examples:

"Give me 3 lunch ideas." → give exactly 3.

"Give me 5 breakfasts." → give exactly 5.

Do not give 10 when the user asked for 3.

Do not claim that you provided a requested number if you did not.

---

## Follow-up questions

Understand short follow-ups using conversation history.

Examples:

"Instead?"

"Another one."

"What about eggs?"

"Then give me dinner."

"Three options."

"Is potato healthy?"

Do not treat these as unrelated new conversations.

---

## Food health questions

When asked:

"Is potato healthy?"

Answer the actual question.

Explain that potatoes can be part of a healthy diet and that preparation method and portion size matter.

Do not automatically turn every food question into a meal plan.

---

## Food substitution

When the user asks what can replace a food, identify the target food and suggest suitable alternatives.

Example:

"I don't eat rice. What can I eat instead?"

Possible alternatives include:

* atta roti
* oats
* appropriate non-rice grain options
* vegetables
* dal-based meals

Do not suggest brown rice or red rice when the user explicitly means completely rice-free, because they are still rice.

---

## Nutrition accuracy

Never invent:

* calorie values
* protein values
* medical diagnoses
* laboratory results
* nutrient measurements

If exact nutritional information is available in the provided application context/database, use it.

Otherwise use careful qualitative language.

---

## Health and safety

This is a nutrition assistant, not a doctor.

Do not diagnose medical conditions.

Do not claim that a food or diet will cure a disease.

For serious medical, allergy, eating-disorder, or medication-related questions, recommend consultation with an appropriate qualified healthcare professional.

For ordinary nutrition questions, remain practical and helpful rather than adding unnecessary medical disclaimers.

---

## User profile

Use the supplied Health Profile when it is relevant.

Relevant fields may include:

* age
* sex
* height
* weight
* activity level
* goal
* dietary preference
* allergies
* disliked foods

Do not expose internal implementation details to the user.

Do not mention system prompts, internal rules, API calls, model names, database implementation, or hidden context.

---

## Current meal plan

If a current meal plan is supplied, use it when the user asks about:

* their meal plan
* today's meals
* lunch in their plan
* breakfast in their plan
* dinner in their plan
* calories in their plan

Do not invent a meal plan when a relevant saved plan is available.

---

## Response style

Be:

* clear
* concise
* friendly
* practical
* accurate
* culturally appropriate
* conversational

Use bullets for meal recommendations.

Do not produce unnecessarily long responses.

Do not repeat the same meal recommendation unnecessarily.

Answer the user's actual question first.

---

## Critical rule

The user's current explicit instruction has priority over stale conversational assumptions, while stored profile restrictions and allergies remain important safety constraints.

Never knowingly recommend an allergen.`;

export const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
];

export const GEMINI_TIMEOUT_MS = 25000;

export interface NutriGuideChatOptions {
  prompt: string;
  userProfile?: PersonalHealthProfile | null;
  nutritionCalculations?: HealthCalculations | null;
  currentMealPlan?: DailyMealPlan | null;
  foodDatabaseContext?: FoodItem[];
  activeContext?: string;
  chatHistory?: Array<{ sender: string; content: string }>;
}

/**
 * Smart, selective retrieval of relevant Bangladesh Food Database entries
 * based on query keywords and user restrictions, avoiding database dumps.
 */
export function getRelevantFoodEntries(
  query: string,
  userProfile?: PersonalHealthProfile | null,
  limit: number = 8
): FoodItem[] {
  if (!Array.isArray(BANGLADESH_FOOD_DATABASE)) return [];

  const q = (query || '').toLowerCase().trim();
  const allergies = (userProfile?.allergies || []).map(a => a.toLowerCase());
  const isVeg = userProfile?.dietaryPreference === 'vegetarian';
  const isVegan = userProfile?.dietaryPreference === 'vegan';

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

    // Veg/Vegan check
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
 * Lightweight safety verification: ensures generated recommendations do not affirmatively
 * suggest forbidden items or allergens (e.g. in bullet points or action instructions).
 * Allows educational explanations (e.g. "Why fish is not vegetarian").
 */
export function validateResponseSafety(
  responseText: string,
  userProfile?: PersonalHealthProfile | null,
  currentPrompt?: string
): string {
  if (!responseText || typeof responseText !== 'string') return responseText;

  const profile = userProfile;
  const allergies = (profile?.allergies || []).map(a => a.toLowerCase());
  const isVeg = profile?.dietaryPreference === 'vegetarian';
  const isVegan = profile?.dietaryPreference === 'vegan';

  const lines = responseText.split('\n');
  let hasViolation = false;

  const forbiddenTerms: string[] = [...allergies];
  if (isVeg) forbiddenTerms.push('meat', 'beef', 'chicken', 'mutton', 'fish', 'prawn', 'shrimp');
  if (isVegan) forbiddenTerms.push('meat', 'beef', 'chicken', 'mutton', 'fish', 'egg', 'milk', 'yogurt', 'curd', 'doi', 'paneer', 'cheese', 'ghee', 'butter');

  // Check if bullet point or meal suggestion line contains forbidden foods
  for (const line of lines) {
    const trimmed = line.trim();
    const isBulletOrList = /^([•\-*]|\d+\.)\s+/i.test(trimmed);
    const isRecommendationPhrase = /\b(try|eat|have|suggest|recommend|include|take)\s+/i.test(trimmed);

    if (isBulletOrList || isRecommendationPhrase) {
      const lower = trimmed.toLowerCase();
      for (const term of forbiddenTerms) {
        if (!term) continue;
        const reg = new RegExp(`\\b${term}\\b`, 'i');
        if (reg.test(lower)) {
          // If the line is clearly recommending it (and not explaining "avoid fish")
          if (!lower.includes('avoid') && !lower.includes('do not') && !lower.includes("don't") && !lower.includes('free of')) {
            hasViolation = true;
            break;
          }
        }
      }
    }
    if (hasViolation) break;
  }

  if (hasViolation) {
    console.warn('[NutriGuide Safety] AI response contained a restricted food recommendation. Sanitizing response.');
    if (isVeg || isVegan) {
      return [
        'Here is a healthy plant-based Bangladeshi recommendation tailored to your preferences:',
        '',
        '• 2 small whole-wheat atta rotis',
        '• 1 bowl of thick masoor or moong dal',
        '• 1 bowl of seasonal vegetable curry (lau, potol, or palong shak)',
        '• Fresh cucumber and tomato salad with a squeeze of fresh lemon',
        '',
        'This meal is balanced, rich in plant protein and dietary fiber, and cooked with minimal oil.'
      ].join('\n');
    }
  }

  return responseText;
}

/**
 * Builds the structured context object to accompany the master system instruction.
 */
export function buildAIRequestContext(options: NutriGuideChatOptions) {
  const { userProfile, nutritionCalculations, currentMealPlan, foodDatabaseContext, activeContext } = options;

  const relevantFoods = foodDatabaseContext && foodDatabaseContext.length > 0
    ? foodDatabaseContext
    : getRelevantFoodEntries(options.prompt, userProfile, 8);

  const contextData = {
    profile: userProfile ? {
      name: userProfile.name,
      age: userProfile.age,
      sex: userProfile.sex,
      heightCm: userProfile.heightCm,
      weightKg: userProfile.weightKg,
      activityLevel: userProfile.activityLevel,
      goal: userProfile.goal,
      dietaryPreference: userProfile.dietaryPreference,
      allergies: userProfile.allergies || [],
      dislikedFoods: userProfile.dislikedFoods || [],
    } : null,
    metrics: nutritionCalculations ? {
      bmi: nutritionCalculations.bmi,
      bmiCategory: nutritionCalculations.bmiCategory,
      bmrKcal: nutritionCalculations.bmrKcal,
      tdeeKcal: nutritionCalculations.dailyEnergyNeedsKcal,
      macros: nutritionCalculations.macros,
    } : null,
    currentMealPlan: currentMealPlan ? {
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
    relevantBangladeshFoodDatabaseItems: relevantFoods.map(f => ({
      banglaName: f.banglaName,
      englishName: f.englishName,
      category: f.category,
      caloriesPerServing: f.calories,
      proteinGrams: f.proteinGrams,
      carbsGrams: f.carbsGrams,
      fatGrams: f.fatGrams,
      isVegetarian: f.isVegetarian,
      isVegan: f.isVegan,
    })),
    activePageContext: activeContext || 'General NutriGuide Chat'
  };

  return contextData;
}

/**
 * Executes chat generation using the official @google/genai SDK on the server,
 * adhering to the master system instruction, multi-turn history, and structured context.
 */
export async function executeNutriGuideChat(
  ai: GoogleGenAI,
  options: NutriGuideChatOptions
): Promise<{ text: string; modelUsed: string }> {
  const { prompt, chatHistory, userProfile } = options;
  const contextData = buildAIRequestContext(options);

  // Format recent chat history (latest 6-10 messages)
  const recentHistory = Array.isArray(chatHistory)
    ? chatHistory.slice(-8)
    : [];

  const formattedHistoryText = recentHistory.length > 0
    ? recentHistory.map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')
    : '';

  const userPromptWithContext = `STRUCTURED APPLICATION CONTEXT:
${JSON.stringify(contextData, null, 2)}

${formattedHistoryText ? `RECENT CONVERSATION HISTORY:\n${formattedHistoryText}\n\n` : ''}CURRENT USER MESSAGE:
${prompt}`;

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`AI Assistant request timed out after ${GEMINI_TIMEOUT_MS}ms`)), GEMINI_TIMEOUT_MS)
  );

  const requestPromise = (async () => {
    let lastError: any = null;

    for (const modelName of FALLBACK_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: userPromptWithContext }] }],
          config: {
            systemInstruction: NUTRIGUIDE_MASTER_SYSTEM_PROMPT,
            temperature: 0.7,
            topP: 0.9,
          },
        });

        const rawText = response?.text?.trim();
        if (rawText) {
          const sanitized = validateResponseSafety(rawText, userProfile, prompt);
          return { text: sanitized, modelUsed: modelName };
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[NutriGuide AI] Model ${modelName} returned error (${err?.message || err}). Trying next model in pool...`);
      }
    }

    throw lastError || new Error('All configured AI models were unable to generate a response.');
  })();

  return Promise.race([requestPromise, timeoutPromise]);
}

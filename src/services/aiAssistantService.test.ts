import { 
  validateFoodRecommendation, 
  getFoodContext, 
  buildNutritionContext
} from './aiAssistantService';
import {
  NUTRIGUIDE_MASTER_SYSTEM_PROMPT,
  getRelevantFoodEntries,
  validateResponseSafety,
  buildAIRequestContext
} from '../server/nutritionAIHandler';
import { PersonalHealthProfile, FoodItem } from '../types';

console.log('===========================================================');
console.log('   NUTRIGUIDE AI BACKEND CLEAN REBUILD TEST SUITE');
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

// Mock Foods
const ruiFish: FoodItem = {
  id: 'fish-01',
  englishName: 'Rui Fish',
  banglaName: 'রুই মাছ',
  category: 'Fish',
  calories: 140,
  proteinGrams: 19.5,
  carbsGrams: 0,
  fatGrams: 4.5,
  isVegetarian: false,
  isVegan: false,
  allergies: ['Fish'],
};

const masoorDal: FoodItem = {
  id: 'dal-01',
  englishName: 'Masoor Dal',
  banglaName: 'মসুর ডাল',
  category: 'Dal & Legumes',
  calories: 115,
  proteinGrams: 9.0,
  carbsGrams: 20.0,
  fatGrams: 0.6,
  isVegetarian: true,
  isVegan: true,
  allergies: [],
};

// Mock Profiles
const standardProfile: PersonalHealthProfile = {
  name: 'Tanvir Hossain',
  age: 28,
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

const vegetarianProfile: PersonalHealthProfile = {
  name: 'Anika Rahman',
  age: 24,
  sex: 'female',
  heightCm: 160,
  weightKg: 55,
  activityLevel: 'lightly_active',
  dietaryPreference: 'vegetarian',
  allergies: ['Fish'],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'maintain_weight',
};

// -----------------------------------------------------------------
// TEST 1: Master System Prompt Verification
// -----------------------------------------------------------------
console.log('--- TEST 1: Master System Prompt Content ---');
assert(
  'Test 1: Contains NutriGuide Persona and Bangladesh context',
  NUTRIGUIDE_MASTER_SYSTEM_PROMPT.includes('You are NutriGuide') &&
  NUTRIGUIDE_MASTER_SYSTEM_PROMPT.includes('Bangladeshi food and meal-planning application')
);
assert(
  'Test 1b: Contains Core conversation rule and follow-up guidance',
  NUTRIGUIDE_MASTER_SYSTEM_PROMPT.includes('Treat the conversation as continuous') &&
  NUTRIGUIDE_MASTER_SYSTEM_PROMPT.includes('Never knowingly recommend an allergen')
);

// -----------------------------------------------------------------
// TEST 2: Food Recommendation Safety Validation (Allergy)
// -----------------------------------------------------------------
console.log('\n--- TEST 2: Food Safety Validation (Allergies) ---');
const fishCheck = validateFoodRecommendation(ruiFish, vegetarianProfile);
assert('Test 2: Rejects fish for fish-allergic user', !fishCheck.safe);

const dalCheck = validateFoodRecommendation(masoorDal, vegetarianProfile);
assert('Test 2b: Approves safe vegetarian dal', dalCheck.safe);

// -----------------------------------------------------------------
// TEST 3: Smart Database Context Retrieval
// -----------------------------------------------------------------
console.log('\n--- TEST 3: Database Context Retrieval ---');
const breakfastFoods = getRelevantFoodEntries('breakfast', standardProfile, 6);
assert('Test 3: Retrieves relevant breakfast foods', breakfastFoods.length > 0 && breakfastFoods.some(f => f.breakfastSuitable || f.category.toLowerCase().includes('grain') || f.category.toLowerCase().includes('breakfast')));

const vegFilteredFoods = getRelevantFoodEntries('lunch', vegetarianProfile, 6);
assert('Test 3b: Filters out non-vegetarian foods for vegetarian profile', vegFilteredFoods.every(f => f.isVegetarian));

// -----------------------------------------------------------------
// TEST 4: Structured Context Builder
// -----------------------------------------------------------------
console.log('\n--- TEST 4: Context Payload Construction ---');
const contextPayload = buildAIRequestContext({
  prompt: 'Give me 3 lunch ideas',
  userProfile: standardProfile,
  nutritionCalculations: null,
  currentMealPlan: null,
  chatHistory: [
    { sender: 'user', content: 'Hello' },
    { sender: 'assistant', content: 'Hello! How can I assist you with your nutrition today?' }
  ]
});
assert('Test 4: Structured context contains user profile info', contextPayload.profile?.name === 'Tanvir Hossain');
assert('Test 4b: Relevant food database entries populated', Array.isArray(contextPayload.relevantBangladeshFoodDatabaseItems));

// -----------------------------------------------------------------
// TEST 5: Response Safety Validator (Prevents Allergen Recommendation)
// -----------------------------------------------------------------
console.log('\n--- TEST 5: Post-Generation Response Safety Validator ---');
const unsafeGeneratedResponse = `Here is a healthy lunch:
• 1 piece of Rui Fish curry
• 1 cup of white rice
• 1 bowl of vegetable`;

const sanitized = validateResponseSafety(unsafeGeneratedResponse, vegetarianProfile, 'Give me lunch');
assert('Test 5: Replaces forbidden fish recommendation for vegetarian/allergy user', !sanitized.toLowerCase().includes('rui fish') && sanitized.toLowerCase().includes('rotis'));

const safeEducationalQuery = "Why isn't fish vegetarian?";
const safeExplanation = "Fish is an animal and contains animal flesh, which is why fish is not considered vegetarian.";
const safeValidated = validateResponseSafety(safeExplanation, vegetarianProfile, safeEducationalQuery);
assert('Test 5b: Allows educational discussion of food terms', safeValidated === safeExplanation);

console.log('\n===========================================================');
if (failedTests === 0) {
  console.log('   ALL NUTRIGUIDE BACKEND TESTS PASSED (0 FAILURES)');
} else {
  console.error(`   TESTS FAILED WITH ${failedTests} FAILURE(S)`);
}
console.log('===========================================================\n');

if (failedTests > 0) {
  process.exit(1);
}

/**
 * NutriGuide - First-Time User Data Isolation & Onboarding Regression Test Suite
 * 
 * Tests A through H as strictly specified in Requirement 9:
 * TEST A: New account + no profile -> no meal plan displayed (onboarding state)
 * TEST B: Account A has a meal plan. Create/sign in as Account B with no profile -> Account B must NOT see Account A's meal plan
 * TEST C: Account A signs out. Account B signs in -> Account B must NOT inherit Account A's profile or plan
 * TEST D: New account + create profile -> only after profile creation should a personalized meal plan become available
 * TEST E: Existing account + existing profile -> correct personalized plan loads
 * TEST F: Profile A -> edit profile -> new fingerprint -> old plan is invalidated and new plan is generated/loaded
 * TEST G: Refresh browser while signed in with no profile -> onboarding state remains; no unrelated meal plan appears
 * TEST H: Sign out -> sign in as different user -> no stale meal-plan state is retained
 */

import { 
  isValidHealthProfile, 
  loadLocalProfile, 
  saveLocalProfile, 
  clearLocalProfile, 
  loadSavedMealPlan, 
  saveMealPlanLocally, 
  clearSavedMealPlan, 
  createProfileFingerprint,
  getProfileStorageKey,
  getMealPlanStorageKey
} from './profileStorage';
import { generateMealPlan } from './mealPlanner';
import { PersonalHealthProfile } from '../types';

// Mock localStorage for Node environment if not present
class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] !== undefined ? this.store[key] : null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value.toString();
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

if (typeof window === 'undefined') {
  (global as any).window = {
    localStorage: new MockLocalStorage()
  };
  (global as any).localStorage = (global as any).window.localStorage;
}

console.log('================================================================');
console.log('   NUTRI GUIDE USER DATA ISOLATION & ONBOARDING REGRESSION TEST ');
console.log('================================================================\n');

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail: string = '') {
  if (condition) {
    console.log(`[PASS] ${testName} ${detail ? `-> ${detail}` : ''}`);
    passedCount++;
  } else {
    console.error(`[FAIL] ${testName} ${detail ? `-> ${detail}` : ''}`);
    failedCount++;
  }
}

const profileA: PersonalHealthProfile = {
  name: 'Amina Begum',
  age: 40,
  sex: 'female',
  heightCm: 158,
  weightKg: 75,
  activityLevel: 'sedentary',
  dietaryPreference: 'no_preference',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'lose_weight',
};

const profileB: PersonalHealthProfile = {
  name: 'Rakibul Islam',
  age: 28,
  sex: 'male',
  heightCm: 175,
  weightKg: 68,
  activityLevel: 'moderately_active',
  dietaryPreference: 'no_preference',
  allergies: ['Peanuts'],
  dislikedFoods: ['Bitter gourd / Karola'],
  dietaryRestrictions: [],
  goal: 'maintain_weight',
};

async function runRegressionSuite() {
  localStorage.clear();

  // -------------------------------------------------------------
  // TEST A: New account + no profile -> no meal plan displayed
  // -------------------------------------------------------------
  console.log('\n--- TEST A: New account with no profile ---');
  const userNewId = 'user_new_12345';
  
  // 1. Profile check for new account
  const loadedNewProfile = loadLocalProfile(userNewId);
  assert(loadedNewProfile === null, 'TEST A.1: No profile exists for brand new account', `loadLocalProfile returned null`);
  
  // 2. Profile validity check
  assert(isValidHealthProfile(loadedNewProfile) === false, 'TEST A.2: Null profile fails validity check', 'isValidHealthProfile is false');
  
  // 3. Attempt to load meal plan for unconfigured account
  const newAccountMealPlan = loadSavedMealPlan(loadedNewProfile, userNewId);
  assert(newAccountMealPlan === null, 'TEST A.3: No meal plan is returned for new account with no profile', 'loadSavedMealPlan returned null');


  // -------------------------------------------------------------
  // TEST B: Account A has a meal plan. Create/sign in as Account B with no profile -> Account B must NOT see Account A's meal plan
  // -------------------------------------------------------------
  console.log('\n--- TEST B: Account B does not see Account A meal plan ---');
  const userAId = 'user_account_A';
  const userBId = 'user_account_B';

  // Set up Account A with Profile A and generated meal plan
  saveLocalProfile(profileA, userAId);
  const planARes = generateMealPlan(profileA, { seed: 100 });
  assert(planARes.success && Boolean(planARes.plan), 'TEST B.1: Generated meal plan for Account A');
  saveMealPlanLocally(planARes.plan!, profileA, userAId);

  // Verify Account A has its plan
  const planAFromStorage = loadSavedMealPlan(profileA, userAId);
  assert(planAFromStorage !== null, 'TEST B.2: Account A correctly retrieves its own saved meal plan');

  // Now inspect Account B (brand new, no profile)
  const profileForB = loadLocalProfile(userBId);
  assert(profileForB === null, 'TEST B.3: Account B has no profile loaded');
  const planForB = loadSavedMealPlan(profileForB, userBId);
  assert(planForB === null, 'TEST B.4: Account B cannot retrieve Account A meal plan', 'Returns null');

  // Even if Account B somehow queries with Profile A's object, user scoping isolates it
  const leakAttempt = loadSavedMealPlan(profileA, userBId);
  assert(leakAttempt === null, 'TEST B.5: User scoping strictly isolates meal plan by user ID key', 'Returns null');


  // -------------------------------------------------------------
  // TEST C: Account A signs out. Account B signs in -> Account B must NOT inherit Account A's profile or plan
  // -------------------------------------------------------------
  console.log('\n--- TEST C: Account A signs out -> Account B signs in ---');
  // Simulate Sign Out of Account A
  clearSavedMealPlan(userAId);
  
  // Simulate Sign In of Account B (fresh user)
  const profileAfterSwitch = loadLocalProfile(userBId);
  const planAfterSwitch = loadSavedMealPlan(profileAfterSwitch, userBId);
  assert(profileAfterSwitch === null, 'TEST C.1: Switched Account B profile is clean (null)');
  assert(planAfterSwitch === null, 'TEST C.2: Switched Account B meal plan is clean (null)');


  // -------------------------------------------------------------
  // TEST D: New account + create profile -> only after profile creation should a personalized meal plan become available
  // -------------------------------------------------------------
  console.log('\n--- TEST D: Account B completes profile -> receives personalized plan ---');
  // Account B creates Profile B
  const saveSuccessB = saveLocalProfile(profileB, userBId);
  assert(saveSuccessB, 'TEST D.1: Successfully saved Profile B for Account B');

  const loadedB = loadLocalProfile(userBId);
  assert(isValidHealthProfile(loadedB), 'TEST D.2: Loaded Profile B is valid and active', loadedB?.name);

  // Before plan generation, no cached plan exists yet
  const beforeGen = loadSavedMealPlan(loadedB, userBId);
  assert(beforeGen === null, 'TEST D.3: No plan before generation for Account B');

  // Generate and save plan for Account B
  const planBRes = generateMealPlan(loadedB!, { seed: 200 });
  assert(planBRes.success && Boolean(planBRes.plan), 'TEST D.4: Successfully generated personalized plan for Account B');
  saveMealPlanLocally(planBRes.plan!, loadedB!, userBId);

  const afterGenB = loadSavedMealPlan(loadedB, userBId);
  assert(afterGenB !== null, 'TEST D.5: Personalized plan is now available for Account B after profile creation');
  assert(afterGenB?.targetTotalCalories === planBRes.plan?.targetTotalCalories, 'TEST D.6: Saved plan target calories match Profile B target');


  // -------------------------------------------------------------
  // TEST E: Existing account + existing profile -> correct personalized plan loads
  // -------------------------------------------------------------
  console.log('\n--- TEST E: Existing account + existing profile ---');
  // Account A signs back in
  saveLocalProfile(profileA, userAId);
  saveMealPlanLocally(planARes.plan!, profileA, userAId);

  const loadedA = loadLocalProfile(userAId);
  assert(isValidHealthProfile(loadedA), 'TEST E.1: Loaded Profile A is valid');
  assert(loadedA?.name === 'Amina Begum', 'TEST E.2: Loaded Profile A belongs to Amina Begum');

  const loadedPlanA = loadSavedMealPlan(loadedA, userAId);
  assert(loadedPlanA !== null, 'TEST E.3: Loaded Plan A exists');
  assert(loadedPlanA?.profileFingerprint === createProfileFingerprint(profileA), 'TEST E.4: Plan A fingerprint strictly matches Profile A');


  // -------------------------------------------------------------
  // TEST F: Profile A -> edit profile -> new fingerprint -> old plan is invalidated and new plan is generated/loaded
  // -------------------------------------------------------------
  console.log('\n--- TEST F: Profile edit mutates fingerprint and invalidates stale plan ---');
  const originalFp = createProfileFingerprint(profileA);
  
  // Amina updates her weight from 75kg to 70kg and goal to maintain_weight
  const updatedProfileA: PersonalHealthProfile = {
    ...profileA,
    weightKg: 70,
    goal: 'maintain_weight'
  };
  const newFp = createProfileFingerprint(updatedProfileA);
  assert(originalFp !== newFp, 'TEST F.1: Fingerprint changed upon profile edit');

  // Attempting to load the previously cached plan with updatedProfileA will detect mismatch & invalidate
  const staleCheck = loadSavedMealPlan(updatedProfileA, userAId);
  assert(staleCheck === null, 'TEST F.2: Stale plan rejected and purged on fingerprint mismatch');

  // Save new profile & generate new plan
  saveLocalProfile(updatedProfileA, userAId);
  const newPlanARes = generateMealPlan(updatedProfileA, { seed: 300 });
  saveMealPlanLocally(newPlanARes.plan!, updatedProfileA, userAId);

  const freshPlanA = loadSavedMealPlan(updatedProfileA, userAId);
  assert(freshPlanA !== null, 'TEST F.3: New plan successfully loaded for updated profile');
  assert(freshPlanA?.profileFingerprint === newFp, 'TEST F.4: New plan has the updated fingerprint');


  // -------------------------------------------------------------
  // TEST G: Refresh browser while signed in with no profile -> onboarding state remains; no unrelated meal plan appears
  // -------------------------------------------------------------
  console.log('\n--- TEST G: Refresh browser with no profile ---');
  const userCId = 'user_account_C_no_profile';
  // Simulate page reload by querying storage directly
  const reloadedProfile = loadLocalProfile(userCId);
  const reloadedPlan = loadSavedMealPlan(reloadedProfile, userCId);
  assert(reloadedProfile === null, 'TEST G.1: Reloaded user with no profile remains null');
  assert(reloadedPlan === null, 'TEST G.2: Reloaded user with no profile receives null meal plan (onboarding view remains)');


  // -------------------------------------------------------------
  // TEST H: Sign out -> sign in as different user -> no stale meal-plan state is retained
  // -------------------------------------------------------------
  console.log('\n--- TEST H: Sign out -> Sign in as different user ---');
  // 1. Account A signs out
  clearSavedMealPlan(userAId);
  clearLocalProfile(userAId);

  // 2. Account D (new user) signs in
  const userDId = 'user_account_D_brand_new';
  const profileD = loadLocalProfile(userDId);
  const planD = loadSavedMealPlan(profileD, userDId);

  assert(profileD === null, 'TEST H.1: Account D has no inherited profile');
  assert(planD === null, 'TEST H.2: Account D has no inherited meal plan');

  // -------------------------------------------------------------
  // TEST I: Onboarding flow state progression test (Steps 1, 2, and 3)
  // -------------------------------------------------------------
  console.log('\n--- TEST I: Onboarding flow state progression ---');
  const userEId = 'user_account_E_first_time';
  
  // Step 1: New account starts with no profile -> Onboarding state (Welcome to NutriGuide)
  const initialProfileE = loadLocalProfile(userEId);
  const initialPlanE = loadSavedMealPlan(initialProfileE, userEId);
  const step1IsOnboarding = initialProfileE === null && initialPlanE === null;
  assert(step1IsOnboarding, 'TEST I.1: New account starts in Step 1 Onboarding Welcome state', 'No profile or plan loaded');

  // Step 2: User opens Health Profile creation form -> Fresh, clean state with no inherited data
  const isProfileValidBeforeForm = isValidHealthProfile(initialProfileE);
  assert(!isProfileValidBeforeForm, 'TEST I.2: Step 2 form begins in fresh unconfigured state without preloaded dummy values');

  // Attempting to generate meal plan before profile completion fails safely
  const prematurePlan = generateMealPlan(initialProfileE, { seed: 1 });
  assert(!prematurePlan.success, 'TEST I.3: Automatic meal-plan generation is prevented before profile completion');

  // Step 3: User submits valid profile -> Personalized plan is generated and persisted
  const completedProfileE: PersonalHealthProfile = {
    name: 'Tanvir Hossain',
    age: 32,
    sex: 'male',
    heightCm: 172,
    weightKg: 78,
    activityLevel: 'lightly_active',
    dietaryPreference: 'no_preference',
    allergies: [],
    dislikedFoods: [],
    dietaryRestrictions: ['Low Sodium'],
    goal: 'lose_weight',
  };
  saveLocalProfile(completedProfileE, userEId);
  const savedProfileE = loadLocalProfile(userEId);
  assert(isValidHealthProfile(savedProfileE), 'TEST I.4: Profile is successfully validated and saved to user-scoped storage');

  // Generate personalized meal plan now that profile exists
  const generatedPlanE = generateMealPlan(savedProfileE!, { seed: 500 });
  assert(generatedPlanE.success && Boolean(generatedPlanE.plan), 'TEST I.5: Personalized meal plan generated after profile completion');
  saveMealPlanLocally(generatedPlanE.plan!, savedProfileE!, userEId);

  const loadedPlanE = loadSavedMealPlan(savedProfileE, userEId);
  assert(loadedPlanE !== null, 'TEST I.6: Saved meal plan loaded successfully for completed user profile');
  assert(loadedPlanE?.profileFingerprint === createProfileFingerprint(savedProfileE), 'TEST I.7: Meal plan fingerprint exactly matches saved profile');

  // -------------------------------------------------------------
  // TEST J: Health Profile vs Daily Meal Plan Separation
  // -------------------------------------------------------------
  console.log('\n--- TEST J: Health Profile vs Daily Meal Plan Separation ---');
  const userFId = 'user_account_F_navigation_check';

  // 1. New user with NO profile queries Meal Plan -> returns null (triggers empty state, not pre-prepared diet)
  const profileF = loadLocalProfile(userFId);
  const planF = loadSavedMealPlan(profileF, userFId);
  assert(profileF === null, 'TEST J.1: User F profile is null');
  assert(planF === null, 'TEST J.2: User F meal plan is null (triggers empty state with "Create Health Profile" button, not pre-prepared diet)');

  // 2. User F creates profile -> Profile exists and is valid
  const profileFData: PersonalHealthProfile = {
    name: 'Farhana Ahmed',
    age: 26,
    sex: 'female',
    heightCm: 162,
    weightKg: 54,
    activityLevel: 'moderately_active',
    dietaryPreference: 'no_preference',
    allergies: [],
    dislikedFoods: [],
    dietaryRestrictions: [],
    goal: 'maintain_weight',
  };
  saveLocalProfile(profileFData, userFId);
  const loadedProfileF = loadLocalProfile(userFId);
  assert(isValidHealthProfile(loadedProfileF), 'TEST J.3: User F profile saved and valid on Health Profile page');

  // 3. User F navigates to Daily Meal Plan -> personalized plan is generated from Profile F
  const planFRes = generateMealPlan(loadedProfileF!, { seed: 777 });
  assert(planFRes.success && planFRes.plan !== undefined, 'TEST J.4: Daily Meal Plan generated specifically for User F profile');
  saveMealPlanLocally(planFRes.plan!, loadedProfileF!, userFId);
  const loadedPlanF = loadSavedMealPlan(loadedProfileF, userFId);
  assert(loadedPlanF !== null, 'TEST J.5: User F receives personalized daily plan on Daily Meal Plan page');
  assert(loadedPlanF?.profileFingerprint === createProfileFingerprint(loadedProfileF), 'TEST J.6: User F plan fingerprint matches User F profile');

  // 4. Verify Account Isolation between User F and Account A
  const planAForUserF = loadSavedMealPlan(profileA, userFId);
  assert(planAForUserF === null, 'TEST J.7: User F cannot access Account A plan even when requesting with Profile A object');

  // Summary
  console.log('\n================================================================');
  console.log(`   REGRESSION TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runRegressionSuite().catch((err) => {
  console.error('Fatal error running regression tests:', err);
  process.exit(1);
});

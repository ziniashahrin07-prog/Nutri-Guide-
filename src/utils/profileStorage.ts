import { PersonalHealthProfile, DailyMealPlan } from '../types';
import { migrateDailyMealPlan } from '../data/bangladeshFoodDatabase';

const BASE_STORAGE_KEY = 'nutri_guide_health_profile';
const BASE_MEAL_PLAN_STORAGE_KEY = 'nutri_guide_saved_meal_plan';

export interface StoredMealPlanWrapper {
  profileFingerprint: string;
  userId?: string;
  calorieTarget: number;
  generatedAt: string;
  plan: DailyMealPlan;
}

export const DEFAULT_PROFILE: PersonalHealthProfile = {
  name: '',
  age: 28,
  sex: 'female',
  heightCm: 165,
  weightKg: 62,
  activityLevel: 'moderately_active',
  dietaryPreference: 'no_preference',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'maintain_weight',
};

/**
 * Validates whether a profile contains real, user-provided data
 * rather than an uncompleted or empty placeholder.
 */
export function isValidHealthProfile(profile?: Partial<PersonalHealthProfile> | null): profile is PersonalHealthProfile {
  if (!profile) return false;
  if (!profile.name || typeof profile.name !== 'string' || profile.name.trim().length === 0) return false;
  if (typeof profile.age !== 'number' || profile.age < 10 || profile.age > 120) return false;
  if (typeof profile.heightCm !== 'number' || profile.heightCm < 50 || profile.heightCm > 250) return false;
  if (typeof profile.weightKg !== 'number' || profile.weightKg < 20 || profile.weightKg > 300) return false;
  return true;
}

/**
 * Resolves a storage key scoped to the authenticated user ID.
 */
export function getProfileStorageKey(userId?: string | null): string {
  if (userId && userId.trim().length > 0) {
    return `${BASE_STORAGE_KEY}_${userId.trim()}`;
  }
  return `${BASE_STORAGE_KEY}_guest`;
}

/**
 * Resolves a meal plan storage key scoped to the authenticated user ID.
 */
export function getMealPlanStorageKey(userId?: string | null): string {
  if (userId && userId.trim().length > 0) {
    return `${BASE_MEAL_PLAN_STORAGE_KEY}_${userId.trim()}`;
  }
  return `${BASE_MEAL_PLAN_STORAGE_KEY}_guest`;
}

/**
 * Creates a deterministic, normalized fingerprint string of all profile attributes
 * that affect nutrition calculation, dietary restrictions, or meal plan generation.
 */
export function createProfileFingerprint(profile?: Partial<PersonalHealthProfile> | null): string {
  if (!profile || !isValidHealthProfile(profile)) return 'anonymous_empty_profile';

  const normalizedAllergies = [...(profile.allergies || [])]
    .map(a => a.toLowerCase().trim())
    .filter(Boolean)
    .sort();

  const normalizedDislikes = [...(profile.dislikedFoods || [])]
    .map(d => d.toLowerCase().trim())
    .filter(Boolean)
    .sort();

  const normalizedRestrictions = [...(profile.dietaryRestrictions || [])]
    .map(r => r.toLowerCase().trim())
    .filter(Boolean)
    .sort();

  return JSON.stringify({
    name: (profile.name || '').trim().toLowerCase(),
    age: profile.age ?? 0,
    sex: profile.sex || 'female',
    heightCm: profile.heightCm ?? 0,
    weightKg: profile.weightKg ?? 0,
    activityLevel: profile.activityLevel || 'moderately_active',
    goal: profile.goal || 'maintain_weight',
    dietaryPreference: profile.dietaryPreference || 'no_preference',
    allergies: normalizedAllergies,
    dislikedFoods: normalizedDislikes,
    dietaryRestrictions: normalizedRestrictions,
  });
}

/**
 * Reads the personal health profile from localStorage scoped to the user ID.
 * Returns null if no valid profile exists or if localStorage is unavailable.
 * Never leaks data from another user ID.
 */
export function loadLocalProfile(userId?: string | null): PersonalHealthProfile | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const key = getProfileStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    
    // Ensure data is structured and valid
    const parsedProfile: PersonalHealthProfile = {
      ...DEFAULT_PROFILE,
      ...data,
      allergies: Array.isArray(data.allergies) ? data.allergies : [],
      dislikedFoods: Array.isArray(data.dislikedFoods) ? data.dislikedFoods : [],
      dietaryRestrictions: Array.isArray(data.dietaryRestrictions) ? data.dietaryRestrictions : [],
    };

    if (!isValidHealthProfile(parsedProfile)) {
      return null;
    }

    return parsedProfile;
  } catch (err) {
    console.warn('[ProfileStorage] Could not load profile from localStorage:', err);
    return null;
  }
}

/**
 * Persists the personal health profile to localStorage scoped to the user ID.
 * Refuses to overwrite or write to read-only demo profile records.
 */
export function saveLocalProfile(profile: PersonalHealthProfile, userId?: string | null): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    if (!isValidHealthProfile(profile)) {
      console.warn('[ProfileStorage] Attempted to save invalid profile');
      return false;
    }

    // Guard: Prevent saving demo/read-only profiles through normal user profile key
    if (profile.isReadOnly === true || profile.isDemo === true || userId === 'demo' || userId === 'canonical_demo') {
      console.warn('[ProfileStorage] Rejected attempt to write demo profile via normal user profile storage pathway.');
      return false;
    }

    const now = new Date().toISOString();
    const updatedProfile: PersonalHealthProfile = {
      ...profile,
      isDemo: false,
      isReadOnly: false,
      createdAt: profile.createdAt || now,
      updatedAt: now,
    };
    const key = getProfileStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(updatedProfile));
    return true;
  } catch (err) {
    console.error('[ProfileStorage] Could not save profile to localStorage:', err);
    return false;
  }
}

/**
 * Removes the saved profile from localStorage for the given user ID.
 */
export function clearLocalProfile(userId?: string | null): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const key = getProfileStorageKey(userId);
    localStorage.removeItem(key);
  } catch (err) {
    console.error('[ProfileStorage] Could not clear profile from localStorage:', err);
  }
}

/**
 * Loads a cached DailyMealPlan from localStorage ONLY if:
 * 1. The profile is valid
 * 2. Stored plan is scoped to the current user ID
 * 3. Stored profileFingerprint matches the current profile.
 * If fingerprint does not match or is missing, the stale plan is discarded and purged from storage.
 */
export function loadSavedMealPlan(currentProfile: PersonalHealthProfile | null | undefined, userId?: string | null): DailyMealPlan | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    if (!currentProfile || !isValidHealthProfile(currentProfile)) return null;

    const key = getMealPlanStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const stored: StoredMealPlanWrapper = JSON.parse(raw);
    const currentFingerprint = createProfileFingerprint(currentProfile);

    // CRITICAL: Strict Fingerprint & User Validation Gate
    if (
      !stored ||
      stored.profileFingerprint !== currentFingerprint ||
      !stored.plan ||
      (userId && stored.userId && stored.userId !== userId)
    ) {
      console.log('[MealPlan Storage] Invalidation: Stored plan fingerprint mismatch. Discarding stale plan.');
      localStorage.removeItem(key);
      return null;
    }

    return migrateDailyMealPlan(stored.plan);
  } catch (err) {
    console.warn('[ProfileStorage] Error loading saved meal plan:', err);
    return null;
  }
}

/**
 * Persists a DailyMealPlan to localStorage associated with the exact user ID and profile fingerprint.
 * Refuses to overwrite or write to read-only demo meal plan records via normal user pathways.
 */
export function saveMealPlanLocally(plan: DailyMealPlan, profile: PersonalHealthProfile, userId?: string | null): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    if (!profile || !isValidHealthProfile(profile)) return false;

    // Guard: Prevent saving demo/read-only meal plans through normal user pathway
    if (plan.isReadOnly === true || plan.isDemo === true || profile.isDemo === true || userId === 'demo' || userId === 'canonical_demo') {
      console.warn('[ProfileStorage] Rejected attempt to write demo meal plan via normal user storage pathway.');
      return false;
    }

    const currentFingerprint = createProfileFingerprint(profile);
    const wrapper: StoredMealPlanWrapper = {
      profileFingerprint: currentFingerprint,
      userId: userId || undefined,
      calorieTarget: plan.targetTotalCalories,
      generatedAt: plan.generatedAt || new Date().toISOString(),
      plan: {
        ...plan,
        isDemo: false,
        isReadOnly: false,
        profileFingerprint: currentFingerprint,
      },
    };
    const key = getMealPlanStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(wrapper));
    return true;
  } catch (err) {
    console.error('[ProfileStorage] Could not save meal plan to localStorage:', err);
    return false;
  }
}

/**
 * Clears saved meal plan from localStorage for the given user ID.
 */
export function clearSavedMealPlan(userId?: string | null): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const key = getMealPlanStorageKey(userId);
    localStorage.removeItem(key);
    // Also clean up any legacy un-scoped key
    localStorage.removeItem(BASE_MEAL_PLAN_STORAGE_KEY);
  } catch (err) {
    console.error('[ProfileStorage] Could not clear meal plan from localStorage:', err);
  }
}

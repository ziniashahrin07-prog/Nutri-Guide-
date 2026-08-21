import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PersonalHealthProfile, DailyMealPlan, AppUserRole } from '../types';
import { generateMealPlan } from './mealPlanner';
import { sanitizeForFirestore } from './firestoreSanitize';

/**
 * Storage keys dedicated exclusively to Canonical Public Demo Data.
 * Completely distinct and separated from any user-scoped storage key (`nutri_guide_health_profile_${userId}`).
 */
export const DEMO_PROFILE_STORAGE_KEY = 'nutri_guide_canonical_demo_profile';
export const DEMO_MEAL_PLAN_STORAGE_KEY = 'nutri_guide_canonical_demo_meal_plan';

/**
 * Authorized administrator emails.
 */
export const AUTHORIZED_ADMIN_EMAILS = [
  'admin@nutriguide.com',
];

/**
 * Baseline Canonical Public Demo Health Profile.
 * Read-only for all normal visitors and users.
 */
export const CANONICAL_DEFAULT_DEMO_PROFILE: PersonalHealthProfile = {
  name: "Demo User's Health Profile",
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
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isDemo: true,
  isReadOnly: true,
};

export const CANONICAL_DEMO_PROFILE = CANONICAL_DEFAULT_DEMO_PROFILE;

/**
 * Checks whether an authenticated actor has verified administrative authorization.
 *
 * @param user Firebase Auth user object or session info
 * @param userData User profile document from Firestore or AuthContext
 */
export function isUserAdmin(
  user?: { uid?: string; email?: string | null } | null,
  userData?: { role?: AppUserRole | string; email?: string | null } | null
): boolean {
  if (!user && !userData) return false;

  // 1. Check explicit Firestore role attribute
  if (userData?.role === 'admin') {
    return true;
  }

  // 2. Check verified admin email whitelist
  const userEmail = (user?.email || userData?.email || '').toLowerCase().trim();
  if (userEmail && AUTHORIZED_ADMIN_EMAILS.includes(userEmail)) {
    return true;
  }

  return false;
}

/**
 * Determines whether a given profile object or identifier represents the canonical demo profile.
 */
export function isDemoProfile(profile?: Partial<PersonalHealthProfile> | string | null): boolean {
  if (!profile) return false;
  if (typeof profile === 'string') {
    const s = profile.toLowerCase();
    return s.includes('demo') || s.includes('example') || s.includes('sample');
  }
  if (profile.isDemo === true || profile.isReadOnly === true) return true;
  const name = (profile.name || '').toLowerCase();
  return name.includes('demo user') || name.includes('example profile') || name.includes('sample daily profile') || name.includes('demo profile') || name.includes('dhaka resident');
}

/**
 * Reads the canonical public demo profile.
 * Available to all visitors and users as a strictly read-only reference.
 */
export function loadCanonicalDemoProfile(): PersonalHealthProfile {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(DEMO_PROFILE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...CANONICAL_DEFAULT_DEMO_PROFILE,
          ...parsed,
          isDemo: true,
          isReadOnly: true,
        };
      }
    }
  } catch (err) {
    console.warn('[DemoProfileManager] Error loading local demo profile:', err);
  }

  return { ...CANONICAL_DEFAULT_DEMO_PROFILE };
}

/**
 * Fetches the canonical demo profile from Firestore (public app_config collection).
 * Synced on initialization.
 */
export async function fetchRemoteDemoProfile(): Promise<PersonalHealthProfile> {
  if (!db) return loadCanonicalDemoProfile();

  try {
    const configRef = doc(db, 'app_config', 'demo_profile');
    const snap = await getDoc(configRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.data) {
        const remoteProfile: PersonalHealthProfile = {
          ...CANONICAL_DEFAULT_DEMO_PROFILE,
          ...data.data,
          isDemo: true,
          isReadOnly: true,
        };
        // Cache to local demo key
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(DEMO_PROFILE_STORAGE_KEY, JSON.stringify(remoteProfile));
        }
        return remoteProfile;
      }
    }
  } catch (err) {
    console.warn('[DemoProfileManager] Remote demo profile fetch fallback to default:', err);
  }

  return loadCanonicalDemoProfile();
}

/**
 * Loads the canonical public demo meal plan.
 * Returns a cloned, read-only plan so that visitor swaps or in-memory manipulations
 * do NOT overwrite the canonical demo meal plan.
 */
export function loadCanonicalDemoMealPlan(): DailyMealPlan {
  const demoProfile = loadCanonicalDemoProfile();

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(DEMO_MEAL_PLAN_STORAGE_KEY);
      if (raw) {
        const storedPlan: DailyMealPlan = JSON.parse(raw);
        return {
          ...storedPlan,
          isDemo: true,
          isReadOnly: true,
        };
      }
    }
  } catch (err) {
    console.warn('[DemoProfileManager] Error loading local demo meal plan:', err);
  }

  // Generate canonical demo plan on-the-fly if not stored
  const planResult = generateMealPlan(demoProfile, { seed: 12345 });
  const freshPlan: DailyMealPlan = planResult.plan || {
    id: 'canonical_demo_plan_default',
    generatedAt: '2026-01-01T00:00:00.000Z',
    profileFingerprint: 'canonical_demo_fingerprint',
    targetTotalCalories: 2230,
    actualTotalCalories: 2200,
    totalProteinGrams: 110,
    totalCarbsGrams: 275,
    totalFatGrams: 74,
    totalFiberGrams: 28,
    meals: [],
    profileSnapshot: {
      name: demoProfile.name,
      dietaryPreference: demoProfile.dietaryPreference,
      allergies: demoProfile.allergies,
      dislikedFoods: demoProfile.dislikedFoods,
      goal: demoProfile.goal,
      tdee: 2230,
    },
    isDemo: true,
    isReadOnly: true,
  };

  const canonicalPlan: DailyMealPlan = {
    ...freshPlan,
    isDemo: true,
    isReadOnly: true,
  };

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(DEMO_MEAL_PLAN_STORAGE_KEY, JSON.stringify(canonicalPlan));
    }
  } catch {
    // Non-blocking
  }

  return canonicalPlan;
}

/**
 * Admin-Only: Saves modifications to the canonical public demo profile.
 * REJECTS requests made by non-admin users or unauthenticated visitors.
 */
export async function saveCanonicalDemoProfile(
  updatedProfile: PersonalHealthProfile,
  currentUser?: { uid?: string; email?: string | null } | null,
  currentUserData?: { role?: string; email?: string | null } | null
): Promise<{ success: boolean; profile?: PersonalHealthProfile; error?: string }> {
  // 1. Strict Administrative Security Gate
  if (!isUserAdmin(currentUser, currentUserData)) {
    const errorMsg = 'Permission Denied: Only authorized administrators may edit and publish the public demo profile.';
    console.error(`[Security Violation] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const now = new Date().toISOString();
  const cleanDemoProfile: PersonalHealthProfile = {
    ...updatedProfile,
    name: updatedProfile.name || 'Example Profile',
    isDemo: true,
    isReadOnly: true,
    updatedAt: now,
  };

  // 2. Persist to local demo storage
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(DEMO_PROFILE_STORAGE_KEY, JSON.stringify(cleanDemoProfile));
  }

  // 3. Persist to Firestore app_config/demo_profile
  if (db && currentUser?.uid) {
    try {
      const configRef = doc(db, 'app_config', 'demo_profile');
      const payload = sanitizeForFirestore({
        configId: 'demo_profile',
        data: cleanDemoProfile,
        updatedAt: now,
        updatedBy: currentUser.uid,
      });
      await setDoc(configRef, payload, { merge: true });
    } catch (err: unknown) {
      console.error('[DemoProfileManager] Error saving remote demo profile:', err);
      // Non-blocking if offline, but throw if security rule denied
      if (err instanceof Error && err.message.includes('permission-denied')) {
        throw new Error('Firestore Security Rule Violation: Unauthorized write to app_config.');
      }
    }
  }

  return { success: true, profile: cleanDemoProfile };
}

/**
 * Admin-Only: Saves modifications to the canonical public demo meal plan.
 * REJECTS requests made by non-admin users or unauthenticated visitors.
 */
export async function saveCanonicalDemoMealPlan(
  updatedMealPlan: DailyMealPlan,
  currentUser?: { uid?: string; email?: string | null } | null,
  currentUserData?: { role?: string; email?: string | null } | null
): Promise<{ success: boolean; mealPlan?: DailyMealPlan; error?: string }> {
  // 1. Strict Administrative Security Gate
  if (!isUserAdmin(currentUser, currentUserData)) {
    const errorMsg = 'Permission Denied: Only authorized administrators may edit the canonical demo meal plan.';
    console.error(`[Security Violation] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const now = new Date().toISOString();
  const cleanDemoPlan: DailyMealPlan = {
    ...updatedMealPlan,
    isDemo: true,
    isReadOnly: true,
    generatedAt: now,
  };

  // 2. Persist to local demo storage
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(DEMO_MEAL_PLAN_STORAGE_KEY, JSON.stringify(cleanDemoPlan));
  }

  // 3. Persist to Firestore app_config/demo_meal_plan
  if (db && currentUser?.uid) {
    try {
      const configRef = doc(db, 'app_config', 'demo_meal_plan');
      const payload = sanitizeForFirestore({
        configId: 'demo_meal_plan',
        data: cleanDemoPlan,
        updatedAt: now,
        updatedBy: currentUser.uid,
      });
      await setDoc(configRef, payload, { merge: true });
    } catch (err: unknown) {
      console.error('[DemoProfileManager] Error saving remote demo meal plan:', err);
      if (err instanceof Error && err.message.includes('permission-denied')) {
        throw new Error('Firestore Security Rule Violation: Unauthorized write to app_config.');
      }
    }
  }

  return { success: true, mealPlan: cleanDemoPlan };
}

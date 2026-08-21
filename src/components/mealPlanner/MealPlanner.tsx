import React, { useState, useEffect, useMemo } from 'react';
import { PersonalHealthProfile, DailyMealPlan, FoodItem } from '../../types';
import { 
  loadLocalProfile, 
  createProfileFingerprint, 
  loadSavedMealPlan, 
  saveMealPlanLocally,
  isValidHealthProfile 
} from '../../utils/profileStorage';
import { 
  isDemoProfile, 
  loadCanonicalDemoMealPlan,
  isUserAdmin 
} from '../../utils/demoProfileManager';
import { useAuth } from '../../context/AuthContext';
import { 
  generateMealPlan, 
  swapFoodItemInPlan, 
  toggleSlotSkippedInPlan, 
  regenerateMealSlotInPlan,
  MEAL_PLAN_DISCLAIMER 
} from '../../utils/mealPlanner';
import { MealCard } from './MealCard';
import { 
  Utensils, 
  RefreshCw, 
  Sparkles, 
  ShieldAlert, 
  HeartPulse, 
  CheckCircle2, 
  Flame, 
  User, 
  AlertCircle,
  FileSpreadsheet,
  Download,
  Share2,
  Lock
} from 'lucide-react';

interface MealPlannerProps {
  profile?: PersonalHealthProfile | null;
  userId?: string | null;
  onNavigateToProfile?: () => void;
  className?: string;
}

export const MealPlanner: React.FC<MealPlannerProps> = ({ 
  profile: propProfile, 
  userId, 
  onNavigateToProfile, 
  className = '' 
}) => {
  const { user, userData } = useAuth();
  const isAdmin = isUserAdmin(user, userData);
  const [profile, setProfile] = useState<PersonalHealthProfile | null>(() => {
    if (propProfile && isValidHealthProfile(propProfile)) return propProfile;
    if (userId) {
      const local = loadLocalProfile(userId);
      if (local && isValidHealthProfile(local)) return local;
    }
    return null;
  });
  const [plan, setPlan] = useState<DailyMealPlan | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [seed, setSeed] = useState<number>(1);

  // Compute active valid profile
  const activeProfile = useMemo(() => {
    if (propProfile && isValidHealthProfile(propProfile)) return propProfile;
    if (profile && isValidHealthProfile(profile)) return profile;
    if (userId) {
      const local = loadLocalProfile(userId);
      if (local && isValidHealthProfile(local)) return local;
    }
    return null;
  }, [propProfile, profile, userId]);

  const isDemo = Boolean(activeProfile && (activeProfile.isDemo || activeProfile.isReadOnly || isDemoProfile(activeProfile)));

  // Compute normalized fingerprint for the current active profile
  const currentFingerprint = useMemo(() => createProfileFingerprint(activeProfile), [activeProfile]);

  // Keep internal profile synchronized with prop changes and user switching
  useEffect(() => {
    if (propProfile && isValidHealthProfile(propProfile)) {
      setProfile(propProfile);
    } else if (userId) {
      const active = loadLocalProfile(userId);
      setProfile(active && isValidHealthProfile(active) ? active : null);
    } else {
      setProfile(null);
    }
  }, [propProfile, userId]);

  // Main lifecycle: Check cached plan vs current fingerprint; regenerate if mismatch or absent
  useEffect(() => {
    if (!activeProfile || !isValidHealthProfile(activeProfile)) {
      setPlan(null);
      return;
    }

    // 1. If demo profile, load canonical demo meal plan
    if (isDemo) {
      const demoPlan = loadCanonicalDemoMealPlan();
      setPlan(demoPlan);
      setErrorMsg(null);
      return;
    }

    // 2. Check if existing in-memory plan already matches current profile fingerprint
    if (plan && plan.profileFingerprint === currentFingerprint) {
      return;
    }

    // 3. Check if a valid stored plan exists in localStorage with exact fingerprint match and user scoping
    const cachedPlan = loadSavedMealPlan(activeProfile, userId);
    if (cachedPlan && cachedPlan.profileFingerprint === currentFingerprint) {
      setPlan(cachedPlan);
      setErrorMsg(null);
      return;
    }

    // 4. Otherwise: Profile has changed or no cached plan exists -> Generate fresh personalized plan
    generateNewPlan(activeProfile, 1);
  }, [activeProfile, currentFingerprint, userId, isDemo]);

  const generateNewPlan = (p: PersonalHealthProfile, s: number) => {
    if (!isValidHealthProfile(p)) {
      setPlan(null);
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    setTimeout(() => {
      const res = generateMealPlan(p, { seed: s });
      if (res.success && res.plan) {
        setPlan(res.plan);
        // Only persist user-scoped private plans; never overwrite demo via this path
        if (!isDemo && userId) {
          saveMealPlanLocally(res.plan, p, userId);
        }
      } else {
        setErrorMsg(res.errors?.join(' ') || 'Could not generate meal plan for current profile.');
      }
      setIsGenerating(false);
    }, 200);
  };

  const handleRegenerate = () => {
    if (!activeProfile || !isValidHealthProfile(activeProfile)) return;
    const nextSeed = seed + 1;
    setSeed(nextSeed);
    generateNewPlan(activeProfile, nextSeed);
  };

  const handleSwapItem = (slotId: string, itemIndex: number, newFood: FoodItem) => {
    if (!plan || !activeProfile || !isValidHealthProfile(activeProfile)) return;
    const updated = swapFoodItemInPlan(plan, slotId, itemIndex, newFood);
    setPlan(updated);
    // In demo mode: changes are in-memory only and never persist to canonical storage
    if (!isDemo && userId) {
      saveMealPlanLocally(updated, activeProfile, userId);
    }
  };

  const handleToggleSkipSlot = (slotId: string) => {
    if (!plan || !activeProfile || !isValidHealthProfile(activeProfile)) return;
    const updated = toggleSlotSkippedInPlan(plan, slotId);
    setPlan(updated);
    if (!isDemo && userId) {
      saveMealPlanLocally(updated, activeProfile, userId);
    }
  };

  const handleRegenerateSlot = (slotId: string) => {
    if (!plan || !activeProfile || !isValidHealthProfile(activeProfile)) return;
    const nextSeed = Date.now();
    const updated = regenerateMealSlotInPlan(plan, slotId, activeProfile, { seed: nextSeed });
    setPlan(updated);
    if (!isDemo && userId) {
      saveMealPlanLocally(updated, activeProfile, userId);
    }
  };

  // 1. Missing or Invalid Profile Empty State View
  if (!activeProfile || !isValidHealthProfile(activeProfile) || errorMsg) {
    return (
      <div className={`bg-clay rounded-3xl border border-warm p-8 sm:p-12 text-center space-y-6 card-shadow ${className}`}>
        <div className="w-16 h-16 bg-olive/10 text-olive rounded-full flex items-center justify-center mx-auto border border-olive/20">
          <Utensils className="w-8 h-8 text-olive" />
        </div>

        <div className="space-y-3 max-w-lg mx-auto">
          <h3 className="serif text-2xl sm:text-3xl font-bold text-[#2c3333]">
            Your personalized meal plan is not ready yet.
          </h3>
          <p className="text-sm sm:text-base font-medium text-slate-700 leading-relaxed">
            Create your Health Profile first, and NutriGuide will generate your personalized Bangladeshi meal plan based on your body measurements, lifestyle, goals, and dietary preferences.
          </p>
        </div>

        {onNavigateToProfile && (
          <div className="pt-2">
            <button
              onClick={onNavigateToProfile}
              className="px-6 py-3 text-sm font-bold text-white bg-olive hover:bg-[#4a6854] rounded-full shadow-md transition-all inline-flex items-center gap-2 cursor-pointer hover:shadow-lg hover:scale-105"
            >
              <span>Create Health Profile</span>
              <span className="text-base">→</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. Active Meal Planner Interface
  return (
    <div className={`space-y-8 ${className}`}>
      
      {/* Top Banner & Control Bar */}
      <div className="bg-clay rounded-3xl border border-warm p-6 sm:p-8 card-shadow space-y-6">
        
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fdfcf8] text-olive border border-warm">
                <Sparkles className="w-3.5 h-3.5 text-olive" /> Automated Daily Meal Planner
              </span>
              {isDemo && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <Lock className="w-3 h-3 text-amber-700" /> Demo Meal Plan — Read Only 🔒
                </span>
              )}
            </div>
            <h2 className="serif text-2xl sm:text-3xl font-bold text-[#2c3333]">
              {isDemo ? 'Sample Demonstration Bangladeshi Meal Plan' : 'Personalized Bangladeshi Daily Meal Plan'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {isDemo && !isAdmin ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Demo Plan — Locked</span>
              </div>
            ) : (
              <button
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-olive hover:bg-[#4a6854] rounded-full shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Generating...' : isDemo ? 'Regenerate (Admin)' : 'Regenerate Day'}
              </button>
            )}
          </div>
        </div>

        {/* User Context & Nutrition Targets Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Box 1: Profile Summary */}
          <div className="bg-[#fdfcf8] p-4 rounded-2xl border border-warm space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-olive" /> User Profile Context
            </span>
            <p className="font-bold text-slate-800 text-sm">{activeProfile.name || 'Anonymous User'}</p>
            <p className="text-xs text-slate-600">
              Goal: <strong className="capitalize text-slate-800">{activeProfile.goal.replace('_', ' ')}</strong>
            </p>
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
              <span className="bg-clay text-slate-700 px-2 py-0.5 rounded-md border border-warm font-medium capitalize">
                {activeProfile.dietaryPreference.replace('_', ' ')}
              </span>
              {activeProfile.allergies.length > 0 && (
                <span className="bg-rose-50 text-rose-800 px-2 py-0.5 rounded-md border border-rose-200 font-bold">
                  Allergies: {activeProfile.allergies.join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* Box 2: Total Daily Calories Target vs Actual */}
          <div className="bg-[#fdfcf8] p-4 rounded-2xl border border-warm space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-terracotta" /> Daily Energy Target
              </span>
              {plan && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {Math.abs(plan.actualTotalCalories - plan.targetTotalCalories) <= Math.round(plan.targetTotalCalories * 0.05)
                    ? `±${((Math.abs(plan.actualTotalCalories - plan.targetTotalCalories) / (plan.targetTotalCalories || 1)) * 100).toFixed(1)}% target`
                    : `${plan.actualTotalCalories - plan.targetTotalCalories > 0 ? '+' : ''}${plan.actualTotalCalories - plan.targetTotalCalories} kcal`}
                </span>
              )}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="serif text-3xl font-extrabold text-[#2c3333]">
                {plan?.actualTotalCalories ?? 0}
              </span>
              <span className="text-xs text-slate-500 font-bold">
                / {plan?.targetTotalCalories ?? 0} kcal
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Planned vs Estimated Goal Calorie Target
            </p>
          </div>

          {/* Box 3: Daily Macro Totals */}
          <div className="bg-[#fdfcf8] p-4 rounded-2xl border border-warm space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Estimated Macro Totals
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-clay p-2 rounded-xl border border-warm">
                <span className="text-slate-500 block text-[10px]">Protein</span>
                <span className="font-bold text-[#2c3333]">{plan?.totalProteinGrams ?? 0}g</span>
              </div>
              <div className="bg-clay p-2 rounded-xl border border-warm">
                <span className="text-slate-500 block text-[10px]">Carbohydrates</span>
                <span className="font-bold text-[#2c3333]">{plan?.totalCarbsGrams ?? 0}g</span>
              </div>
              <div className="bg-clay p-2 rounded-xl border border-warm">
                <span className="text-slate-500 block text-[10px]">Healthy Fat</span>
                <span className="font-bold text-[#2c3333]">{plan?.totalFatGrams ?? 0}g</span>
              </div>
              <div className="bg-clay p-2 rounded-xl border border-warm">
                <span className="text-slate-500 block text-[10px]">Dietary Fiber</span>
                <span className="font-bold text-olive">{plan?.totalFiberGrams ?? 0}g</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 5 Daily Meal Cards Stack */}
      <div className="space-y-6">
        {plan?.meals.map(slot => (
          <MealCard
            key={slot.id}
            slot={slot}
            profile={profile}
            onSwapItem={isDemo && !isAdmin ? undefined : handleSwapItem}
            onToggleSkip={isDemo && !isAdmin ? undefined : handleToggleSkipSlot}
            onRegenerateSlot={isDemo && !isAdmin ? undefined : handleRegenerateSlot}
          />
        ))}
      </div>

      {/* Medical & Meal Plan Disclaimer Banner */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Medical & Nutritional Disclaimer</span>
        </div>
        <p className="leading-relaxed text-amber-800">
          {MEAL_PLAN_DISCLAIMER}
        </p>
      </div>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Sparkles, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  Eye, 
  Lock,
  Layers,
  Utensils
} from 'lucide-react';
import { PersonalHealthProfile, DailyMealPlan, Sex, ActivityLevel, DietaryPreference, HealthGoal } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  isUserAdmin, 
  loadCanonicalDemoProfile, 
  saveCanonicalDemoProfile, 
  loadCanonicalDemoMealPlan, 
  saveCanonicalDemoMealPlan 
} from '../../utils/demoProfileManager';
import { generateMealPlan } from '../../utils/mealPlanner';

export const ManageDemoProfileSection: React.FC = () => {
  const { user, userData } = useAuth();
  const isAdmin = isUserAdmin(user, userData);

  const [demoProfile, setDemoProfile] = useState<PersonalHealthProfile>(() => loadCanonicalDemoProfile());
  const [demoMealPlan, setDemoMealPlan] = useState<DailyMealPlan>(() => loadCanonicalDemoMealPlan());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState(demoProfile.name || 'Example Profile');
  const [age, setAge] = useState(demoProfile.age || 28);
  const [sex, setSex] = useState<Sex>(demoProfile.sex || 'female');
  const [heightCm, setHeightCm] = useState(demoProfile.heightCm || 165);
  const [weightKg, setWeightKg] = useState(demoProfile.weightKg || 62);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(demoProfile.activityLevel || 'moderately_active');
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>(demoProfile.dietaryPreference || 'no_preference');
  const [goal, setGoal] = useState<HealthGoal>(demoProfile.goal || 'maintain_weight');

  useEffect(() => {
    const loaded = loadCanonicalDemoProfile();
    setDemoProfile(loaded);
    setName(loaded.name);
    setAge(loaded.age);
    setSex(loaded.sex);
    setHeightCm(loaded.heightCm);
    setWeightKg(loaded.weightKg);
    setActivityLevel(loaded.activityLevel);
    setDietaryPreference(loaded.dietaryPreference);
    setGoal(loaded.goal);
    setDemoMealPlan(loadCanonicalDemoMealPlan());
  }, []);

  if (!isAdmin) {
    return null; // Strict Security Gate: Never render admin interface for normal users
  }

  const handleSaveDemoProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMessage(null);
    setErrorMessage(null);

    try {
      const updatedProfile: PersonalHealthProfile = {
        ...demoProfile,
        name: name.trim() || 'Example Profile',
        age: Number(age),
        sex,
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        activityLevel,
        dietaryPreference,
        goal,
        isDemo: true,
        isReadOnly: true,
      };

      const result = await saveCanonicalDemoProfile(updatedProfile, user, userData);
      if (result.success && result.profile) {
        setDemoProfile(result.profile);

        // Also automatically re-optimize and save the canonical demo meal plan
        const planResult = generateMealPlan(result.profile, { seed: 12345 });
        if (planResult.plan) {
          await saveCanonicalDemoMealPlan(planResult.plan, user, userData);
          setDemoMealPlan(planResult.plan);
        }

        setSaveSuccessMessage('Canonical public demo profile and meal plan updated and published successfully!');
        setTimeout(() => setSaveSuccessMessage(null), 6000);
      }
    } catch (err: unknown) {
      console.error('[Admin Manage Demo Error]', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to publish demo profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateDemoPlan = async () => {
    setIsSaving(true);
    setSaveSuccessMessage(null);
    setErrorMessage(null);

    try {
      const planResult = generateMealPlan(demoProfile, { seed: Date.now() });
      if (planResult.plan) {
        await saveCanonicalDemoMealPlan(planResult.plan, user, userData);
        setDemoMealPlan(planResult.plan);
        setSaveSuccessMessage('Canonical demo meal plan regenerated and published!');
        setTimeout(() => setSaveSuccessMessage(null), 5000);
      }
    } catch (err: unknown) {
      console.error('[Admin Regenerate Demo Plan Error]', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to regenerate demo plan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-clay rounded-3xl border border-amber-300/80 p-6 sm:p-8 card-shadow space-y-6 relative overflow-hidden">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-900 border border-amber-200 shadow-xs">
            <ShieldAlert className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="serif text-xl font-bold text-[#2c3333]">
                Manage Demo Profile
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                Admin Exclusive
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Only authorized administrators can edit and publish the public landing page demo profile and sample diet.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <Lock className="w-3 h-3 text-emerald-600" /> Verified Admin Access
          </span>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Admin Demo Profile Form */}
      <form onSubmit={handleSaveDemoProfile} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2c3333]">Demo Profile Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#fdfcf8] border border-warm text-[#2c3333] focus:outline-hidden focus:border-olive"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2c3333]">Age (years)</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#fdfcf8] border border-warm text-[#2c3333] focus:outline-hidden focus:border-olive"
              min={12}
              max={100}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2c3333]">Biological Sex</label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as Sex)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#fdfcf8] border border-warm text-[#2c3333] focus:outline-hidden focus:border-olive"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2c3333]">Height (cm)</label>
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#fdfcf8] border border-warm text-[#2c3333] focus:outline-hidden focus:border-olive"
              min={100}
              max={230}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2c3333]">Weight (kg)</label>
            <input
              type="number"
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#fdfcf8] border border-warm text-[#2c3333] focus:outline-hidden focus:border-olive"
              min={30}
              max={200}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2c3333]">Activity Level</label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#fdfcf8] border border-warm text-[#2c3333] focus:outline-hidden focus:border-olive"
            >
              <option value="sedentary">Sedentary (desk work)</option>
              <option value="lightly_active">Lightly Active (1-3 days)</option>
              <option value="moderately_active">Moderately Active (3-5 days)</option>
              <option value="very_active">Very Active (6-7 days)</option>
              <option value="extremely_active">Extremely Active (hard labor)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2c3333]">Dietary Preference</label>
            <select
              value={dietaryPreference}
              onChange={(e) => setDietaryPreference(e.target.value as DietaryPreference)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#fdfcf8] border border-warm text-[#2c3333] focus:outline-hidden focus:border-olive"
            >
              <option value="no_preference">Standard Bangladeshi (Non-Veg)</option>
              <option value="vegetarian">Vegetarian (Niramish)</option>
              <option value="vegan">Vegan</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2c3333]">Health Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as HealthGoal)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#fdfcf8] border border-warm text-[#2c3333] focus:outline-hidden focus:border-olive"
            >
              <option value="maintain_weight">Maintain Weight</option>
              <option value="lose_weight">Gradual Weight Loss (-400 kcal)</option>
              <option value="gain_weight">Healthy Weight Gain (+400 kcal)</option>
              <option value="improve_nutrition">Improve Nutrition & Energy</option>
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-warm">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 text-xs font-bold text-white bg-olive hover:bg-[#4a6854] disabled:opacity-50 rounded-full shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Publishing Changes...' : 'Publish Demo Profile & Plan'}
            </button>

            <button
              type="button"
              onClick={handleRegenerateDemoPlan}
              disabled={isSaving}
              className="px-4 py-2.5 text-xs font-semibold text-[#2c3333] bg-[#fdfcf8] hover:bg-clay border border-warm rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-olive ${isSaving ? 'animate-spin' : ''}`} />
              Regenerate Canonical Demo Plan
            </button>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-olive" />
            Public changes will appear immediately in the Landing Page showcase.
          </div>
        </div>
      </form>
    </div>
  );
};

import React from 'react';
import { 
  User, 
  Ruler, 
  Weight, 
  Activity, 
  Utensils, 
  Target, 
  Edit3, 
  Save, 
  Database,
  Calendar,
  CheckCircle2,
  Tag,
  ShieldCheck
} from 'lucide-react';
import { PersonalHealthProfile } from '../../types';
import { NutritionSummary } from './NutritionSummary';
import { useAuth } from '../../context/AuthContext';
import { isUserAdmin, isDemoProfile } from '../../utils/demoProfileManager';
import { Lock } from 'lucide-react';

interface HealthProfileSummaryProps {
  profile: PersonalHealthProfile;
  onEdit: () => void;
  onSave?: () => void;
  savedNotification?: boolean;
}

export const HealthProfileSummary: React.FC<HealthProfileSummaryProps> = ({
  profile,
  onEdit,
  onSave,
  savedNotification = false,
}) => {
  const { user, userData } = useAuth();
  const isAdmin = isUserAdmin(user, userData);
  const isDemo = Boolean(profile && (profile.isDemo === true || profile.isReadOnly === true || isDemoProfile(profile)));
  const getActivityLabel = (level: string) => {
    switch (level) {
      case 'sedentary':
        return 'Sedentary (Little or no exercise)';
      case 'lightly_active':
        return 'Lightly Active (Exercise 1–3 days/week)';
      case 'moderately_active':
        return 'Moderately Active (Exercise 3–5 days/week)';
      case 'very_active':
        return 'Very Active (Heavy exercise 6–7 days/week)';
      case 'extremely_active':
      case 'extra_active':
        return 'Extremely Active (Hard daily training / physical job)';
      default:
        return level;
    }
  };

  const getDietaryPrefLabel = (pref: string) => {
    switch (pref) {
      case 'no_preference':
      case 'unrestricted':
        return 'No Specific Preference';
      case 'vegetarian':
        return 'Vegetarian';
      case 'vegan':
        return 'Vegan';
      case 'other':
        return 'Other';
      default:
        return pref;
    }
  };

  const getGoalLabel = (goal: string) => {
    switch (goal) {
      case 'maintain_weight':
        return 'Maintain Current Weight';
      case 'lose_weight':
        return 'Lose Weight';
      case 'gain_weight':
        return 'Gain Weight / Build Muscle';
      case 'improve_nutrition':
        return 'Improve General Nutrition';
      default:
        return goal;
    }
  };

  const formattedDate = profile.updatedAt
    ? new Date(profile.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Just now';

  return (
    <div className="space-y-6">
      {/* Saved Success Toast Banner */}
      {savedNotification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Health Profile saved successfully in browser local storage!</span>
          </div>
          <span className="text-[11px] font-medium bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full shrink-0">
            Local Browser Storage
          </span>
        </div>
      )}

      {/* Automated Nutrition & Energy Calculations Summary */}
      <NutritionSummary profile={profile} />

      {/* Main Profile Summary Card */}
      <div className="bg-clay rounded-3xl border border-warm p-6 sm:p-8 card-shadow space-y-8">
        {/* Card Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isDemo ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <Lock className="w-3.5 h-3.5 text-amber-700" /> Read-Only Demo Profile
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fdfcf8] text-olive border border-warm">
                  <Database className="w-3.5 h-3.5 text-olive" /> Local Browser Profile
                </span>
              )}
              <span className="text-xs text-slate-500 hidden sm:inline">•</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Updated {formattedDate}
              </span>
            </div>
            <h2 className="serif text-2xl font-bold text-[#2c3333] pt-1">
              {isDemo ? "Demo User's Health Profile" : `${profile.name}'s Health Profile`}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {isDemo ? (
              isAdmin ? (
                <>
                  <button
                    onClick={onEdit}
                    className="px-4 py-2.5 text-xs font-bold text-[#2c3333] bg-[#fdfcf8] hover:bg-white border border-warm rounded-full shadow-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-olive" />
                    Edit Profile (Admin)
                  </button>

                  {onSave && (
                    <button
                      onClick={onSave}
                      className="px-4 py-2.5 text-xs font-bold text-white bg-olive hover:bg-[#4a6854] rounded-full shadow-xs transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Profile
                    </button>
                  )}
                </>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>🔒 Demo Profile — Locked</span>
                </div>
              )
            ) : (
              <>
                <button
                  onClick={onEdit}
                  className="px-4 py-2.5 text-xs font-bold text-[#2c3333] bg-[#fdfcf8] hover:bg-white border border-warm rounded-full shadow-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5 text-olive" />
                  Edit Profile
                </button>

                {onSave && (
                  <button
                    onClick={onSave}
                    className="px-4 py-2.5 text-xs font-bold text-white bg-olive hover:bg-[#4a6854] rounded-full shadow-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Profile
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Basic & Physical Stats */}
          <div className="bg-[#fdfcf8] rounded-2xl border border-warm p-5 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-warm/60 pb-3 text-olive font-bold text-sm">
              <User className="w-4 h-4" />
              <span>Basic Information & Measurements</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Full Name</span>
                <span className="font-bold text-[#2c3333]">{profile.name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Age</span>
                <span className="font-bold text-[#2c3333]">{profile.age} years</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Biological Sex</span>
                <span className="font-bold text-[#2c3333] capitalize">{profile.sex}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Height</span>
                <span className="font-bold text-[#2c3333]">{profile.heightCm} cm</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Weight</span>
                <span className="font-bold text-[#2c3333]">{profile.weightKg} kg</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">BMI (Est.)</span>
                <span className="font-bold text-[#2c3333]">
                  {(profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Lifestyle & Goals */}
          <div className="bg-[#fdfcf8] rounded-2xl border border-warm p-5 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-warm/60 pb-3 text-olive font-bold text-sm">
              <Activity className="w-4 h-4" />
              <span>Lifestyle & Primary Goal</span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Activity Level</span>
                <span className="font-bold text-[#2c3333]">{getActivityLabel(profile.activityLevel)}</span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Primary Health Goal</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-olive/10 text-olive border border-olive/20 mt-0.5">
                  <Target className="w-3.5 h-3.5" />
                  {getGoalLabel(profile.goal)}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Dietary Information & Preferences */}
          <div className="bg-[#fdfcf8] rounded-2xl border border-warm p-5 space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5 border-b border-warm/60 pb-3 text-olive font-bold text-sm">
              <Utensils className="w-4 h-4" />
              <span>Dietary Preferences, Allergies & Intolerances</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs sm:text-sm">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Dietary Preference</span>
                <span className="font-bold text-[#2c3333] bg-clay px-3 py-1.5 rounded-xl border border-warm inline-block">
                  {getDietaryPrefLabel(profile.dietaryPreference)}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block mb-1">Food Allergies / Intolerances</span>
                {profile.allergies && profile.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.allergies.map((allergy) => (
                      <span
                        key={allergy}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500 italic">None reported</span>
                )}
              </div>

              <div>
                <span className="text-xs text-slate-500 block mb-1">Disliked Foods</span>
                {profile.dislikedFoods && profile.dislikedFoods.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.dislikedFoods.map((food) => (
                      <span
                        key={food}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f3e3da] text-[#8c482d] border border-[#e8ccbc]"
                      >
                        {food}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500 italic">None reported</span>
                )}
              </div>
            </div>

            {profile.dietaryRestrictions && profile.dietaryRestrictions.length > 0 && (
              <div className="pt-2 border-t border-warm/40">
                <span className="text-xs text-slate-500 block mb-1.5">Dietary Restrictions & Guidelines</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.dietaryRestrictions.map((req) => (
                    <span
                      key={req}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-clay text-[#2c3333] border border-warm flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3 text-olive" /> {req}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Local Storage Informational Banner */}
        <div className="p-4 rounded-2xl bg-[#faf6f0] border border-[#e8ded0] text-slate-600 text-xs flex items-center gap-3">
          <Database className="w-4 h-4 text-olive shrink-0" />
          <p>
            <strong className="text-[#2c3333]">Browser Local Storage:</strong> This health profile is saved locally on your device. When signed in with Firebase, this data will automatically sync with your secure cloud account.
          </p>
        </div>
      </div>
    </div>
  );
};

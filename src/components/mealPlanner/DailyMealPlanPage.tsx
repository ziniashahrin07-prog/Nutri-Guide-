import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  Home, 
  LayoutDashboard, 
  HeartPulse, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Database
} from 'lucide-react';
import { PersonalHealthProfile } from '../../types';
import { loadLocalProfile, isValidHealthProfile } from '../../utils/profileStorage';
import { useAuth } from '../../context/AuthContext';
import { MealPlanner } from './MealPlanner';
import { NutriGuideLogo } from '../common/NutriGuideLogo';
import { HealthSafetyNotice } from '../profile/HealthSafetyNotice';

interface DailyMealPlanPageProps {
  onNavigateToHome: () => void;
  onNavigateToProfile: () => void;
  onNavigateToDashboard?: () => void;
  onOpenAuth?: () => void;
  onNavigateToSignUp?: () => void;
}

export const DailyMealPlanPage: React.FC<DailyMealPlanPageProps> = ({
  onNavigateToHome,
  onNavigateToProfile,
  onNavigateToDashboard,
  onOpenAuth,
  onNavigateToSignUp,
}) => {
  const { user, userData, signOut } = useAuth();
  const [profile, setProfile] = useState<PersonalHealthProfile | null>(() => {
    if (userData?.healthProfile && isValidHealthProfile(userData.healthProfile)) {
      return userData.healthProfile;
    }
    if (user?.uid) {
      const local = loadLocalProfile(user.uid);
      if (local && isValidHealthProfile(local)) return local;
    }
    return null;
  });

  // Keep active profile synced with authentication and storage
  useEffect(() => {
    if (userData?.healthProfile && isValidHealthProfile(userData.healthProfile)) {
      setProfile(userData.healthProfile);
    } else if (user?.uid) {
      const local = loadLocalProfile(user.uid);
      setProfile(local && isValidHealthProfile(local) ? local : null);
    } else {
      // Unauthenticated user
      const guestLocal = loadLocalProfile(null);
      setProfile(guestLocal && isValidHealthProfile(guestLocal) ? guestLocal : null);
    }
  }, [userData, user]);

  const hasValidProfile = Boolean(profile && isValidHealthProfile(profile));

  return (
    <div className="min-h-screen bg-[#fdfcf8] py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header Navigation */}
      <header className="max-w-5xl mx-auto bg-clay rounded-3xl border border-warm p-5 card-shadow flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div onClick={onNavigateToHome} className="cursor-pointer">
            <NutriGuideLogo size="sm" />
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          <button
            onClick={onNavigateToHome}
            className="px-4 py-2 text-xs font-semibold text-[#2c3333] bg-[#fdfcf8] hover:bg-clay border border-warm rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" /> Landing Page
          </button>

          <button
            onClick={onNavigateToProfile}
            className="px-4 py-2 text-xs font-semibold text-olive bg-[#fdfcf8] hover:bg-clay border border-olive/20 rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <HeartPulse className="w-3.5 h-3.5 text-olive" /> Health Profile
          </button>

          {user && onNavigateToDashboard && (
            <button
              onClick={onNavigateToDashboard}
              className="px-4 py-2 text-xs font-semibold text-white bg-olive hover:bg-[#4a6854] rounded-full shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </button>
          )}

          {!user && onNavigateToSignUp && (
            <button
              onClick={onNavigateToSignUp}
              className="px-4 py-2 text-xs font-semibold text-white bg-olive hover:bg-[#4a6854] rounded-full shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              Create Account
            </button>
          )}
        </div>
      </header>

      {/* Main Page Container */}
      <main className="max-w-5xl mx-auto space-y-6">
        {/* Page Hero Banner */}
        <div className="bg-[#233128] text-white rounded-3xl p-6 sm:p-8 border border-[#3e5646] card-shadow relative overflow-hidden space-y-3">
          <div className="relative z-10 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#354a3c] text-[#e5e2d9] border border-[#4a6854]">
                <Utensils className="w-3.5 h-3.5 text-olive" /> Daily Meal Plan
              </span>
              {hasValidProfile && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1a241e] text-[#d6c7b0] border border-[#354a3c]">
                  <Database className="w-3.5 h-3.5 text-[#d67d5c]" />
                  {user ? `Personalized for ${profile?.name}` : 'Local Guest Profile'}
                </span>
              )}
            </div>

            <h1 className="serif text-3xl sm:text-4xl font-bold text-[#fdfcf8] tracking-tight">
              Personalized Daily Meal Plan
            </h1>

            <p className="text-xs sm:text-sm text-[#e5e2d9]/90 max-w-2xl leading-relaxed">
              {hasValidProfile
                ? 'Your 5-meal daily schedule adhering to authentic Bangladeshi culinary pairings, macro distributions, and personal dietary restrictions.'
                : 'NutriGuide generates a tailored Bangladeshi meal plan calculated from your body measurements, lifestyle, goals, and food preferences.'}
            </p>
          </div>
        </div>

        {/* Medical Notice */}
        <HealthSafetyNotice />

        {/* Meal Planner Component (Strictly Isolated - Shows clean empty state if no profile) */}
        <MealPlanner
          profile={hasValidProfile ? profile : null}
          userId={user?.uid}
          onNavigateToProfile={onNavigateToProfile}
        />
      </main>
    </div>
  );
};

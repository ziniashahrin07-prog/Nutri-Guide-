import React, { useState } from 'react';
import { User, LogOut, ShieldCheck, Mail, Calendar, Key, AlertCircle, Home, HeartPulse, ChevronRight, Utensils } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NutriGuideLogo } from '../common/NutriGuideLogo';
import { loadLocalProfile, isValidHealthProfile, loadSavedMealPlan } from '../../utils/profileStorage';
import { getFullHealthMetrics } from '../../utils/nutritionCalculator';
import { PersonalHealthProfile } from '../../types';
import { NutritionSummary } from '../profile/NutritionSummary';
import { MealPlanner } from '../mealPlanner/MealPlanner';
import { NutritionAssistantChat } from '../assistant/NutritionAssistantChat';
import { ManageDemoProfileSection } from '../admin/ManageDemoProfileSection';
import { isUserAdmin } from '../../utils/demoProfileManager';

interface DashboardProps {
  onNavigateToHome?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToMealPlan?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  onNavigateToHome, 
  onNavigateToProfile,
  onNavigateToMealPlan
}) => {
  const { user, userData, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const isAdmin = isUserAdmin(user, userData);

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

  // Keep profile updated if userData loads/updates
  React.useEffect(() => {
    if (userData?.healthProfile && isValidHealthProfile(userData.healthProfile)) {
      setProfile(userData.healthProfile);
    } else if (user?.uid) {
      const local = loadLocalProfile(user.uid);
      setProfile(local && isValidHealthProfile(local) ? local : null);
    } else {
      setProfile(null);
    }
  }, [userData, user]);

  const healthMetrics = React.useMemo(() => {
    return profile && isValidHealthProfile(profile) ? getFullHealthMetrics(profile) : null;
  }, [profile]);

  const savedPlan = React.useMemo(() => {
    return loadSavedMealPlan(profile, user?.uid);
  }, [profile, user?.uid]);

  const handleSignOut = async () => {
    setSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
      if (onNavigateToHome) {
        onNavigateToHome();
      }
    } catch (err: any) {
      console.error("Sign out error:", err);
      setSignOutError("Failed to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  };

  const displayName = userData?.name || user?.displayName || 'Nutri Guide Member';
  const displayEmail = userData?.email || user?.email || 'N/A';
  const createdAtFormatted = userData?.createdAt 
    ? new Date(userData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Recently';

  return (
    <div className="min-h-screen bg-[#fdfcf8] py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Bar */}
      <header className="max-w-5xl mx-auto bg-clay rounded-3xl border border-warm p-5 card-shadow flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <NutriGuideLogo size="sm" />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          {onNavigateToHome && (
            <button
              onClick={onNavigateToHome}
              className="px-4 py-2 text-xs font-semibold text-[#2c3333] bg-[#fdfcf8] hover:bg-clay border border-warm rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" /> Landing Page
            </button>
          )}

          {onNavigateToProfile && (
            <button
              onClick={onNavigateToProfile}
              className="px-4 py-2 text-xs font-semibold text-[#2c3333] bg-[#fdfcf8] hover:bg-clay border border-warm rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <HeartPulse className="w-3.5 h-3.5 text-olive" /> Health Profile
            </button>
          )}

          {onNavigateToMealPlan && (
            <button
              onClick={onNavigateToMealPlan}
              className="px-4 py-2 text-xs font-semibold text-[#2c3333] bg-[#fdfcf8] hover:bg-clay border border-warm rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Utensils className="w-3.5 h-3.5 text-olive" /> Daily Meal Plan
            </button>
          )}

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="px-4 py-2 text-xs font-semibold text-white bg-olive hover:bg-[#4a6854] disabled:opacity-50 rounded-full shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            {signingOut ? 'Signing Out...' : 'Sign Out'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-6">
        {signOutError && (
          <div className="p-4 rounded-2xl bg-[#faf6f0] border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{signOutError}</span>
          </div>
        )}

        {/* Welcome Card */}
        <div className="bg-[#233128] text-white rounded-3xl p-8 border border-[#3e5646] card-shadow relative overflow-hidden space-y-4">
          <div className="relative z-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#354a3c] text-[#e5e2d9] border border-[#4a6854]">
              <ShieldCheck className="w-3.5 h-3.5 text-olive" /> Authenticated Dashboard
            </span>

            <h1 className="serif text-3xl sm:text-4xl font-bold text-[#fdfcf8] tracking-tight">
              Welcome, {displayName}!
            </h1>

            <p className="text-sm text-[#e5e2d9]/90 max-w-2xl leading-relaxed">
              Your account is securely authenticated with Firebase. You are signed in and your user profile document is synced with Firestore.
            </p>
          </div>
        </div>

        {/* Personal Health Profile Quick Status Card */}
        <div className="bg-clay rounded-3xl border border-warm p-6 sm:p-8 card-shadow space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#fdfcf8] text-olive border border-warm shadow-xs">
                <HeartPulse className="w-6 h-6 text-olive" />
              </div>
              <div>
                <h2 className="serif text-xl font-bold text-[#2c3333]">
                  Personal Health Profile
                </h2>
                <p className="text-xs text-slate-600">
                  {profile && isValidHealthProfile(profile)
                    ? `Configured for ${profile.name} (${profile.heightCm}cm, ${profile.weightKg}kg)`
                    : 'Personal health metrics, body measurements, & dietary preferences'}
                </p>
              </div>
            </div>

            {onNavigateToProfile && (
              <button
                onClick={onNavigateToProfile}
                className="px-5 py-2.5 text-xs font-bold text-white bg-olive hover:bg-[#4a6854] rounded-full shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                {profile && isValidHealthProfile(profile) ? 'View / Edit Health Profile' : 'Complete Health Profile'}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {profile && isValidHealthProfile(profile) ? (
            <div className="space-y-4 pt-1">
              <NutritionSummary profile={profile} />
            </div>
          ) : (
            <p className="text-xs text-slate-600 bg-[#fdfcf8] p-4 rounded-2xl border border-warm">
              You haven&apos;t created a Personal Health Profile yet. Complete your profile to enable personalized nutrition recommendations.
            </p>
          )}
        </div>

        {/* Personalized Daily Meal Planner Section */}
        <section id="personalized-meal-planner">
          <MealPlanner 
            profile={profile} 
            userId={user?.uid}
            onNavigateToProfile={onNavigateToProfile} 
          />
        </section>

        {/* Dedicated Gemini Nutrition Assistant Section */}
        <section id="ai-nutrition-assistant" className="space-y-4">
          <NutritionAssistantChat
            profile={profile}
            calculations={healthMetrics}
            currentMealPlan={savedPlan}
            activeContext="Nutri Guide Main Dashboard"
            onNavigateToProfile={onNavigateToProfile}
          />
        </section>

        {/* Admin Exclusive: Manage Demo Profile Section */}
        {isAdmin && (
          <section id="admin-manage-demo" className="space-y-4">
            <ManageDemoProfileSection />
          </section>
        )}

        {/* User Account Details Card */}
        <div className="bg-clay rounded-3xl border border-warm p-6 sm:p-8 card-shadow space-y-6">
          <div className="border-b border-warm pb-4 flex items-center justify-between">
            <div>
              <h2 className="serif text-xl font-bold text-[#2c3333]">
                User Profile Summary
              </h2>
              <p className="text-xs text-slate-600">
                Minimum necessary information stored in Firestore (`users/{user?.uid || '...'}`)
              </p>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#fdfcf8] text-olive border border-warm">
              Active Session
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#fdfcf8] border border-warm flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-clay text-olive shrink-0 border border-warm">
                <User className="w-5 h-5 text-olive" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-500 block">Full Name</span>
                <span className="text-sm font-bold text-[#2c3333]">{displayName}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#fdfcf8] border border-warm flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-clay text-olive shrink-0 border border-warm">
                <Mail className="w-5 h-5 text-olive" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-500 block">Email Address</span>
                <span className="text-sm font-bold text-[#2c3333]">{displayEmail}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#fdfcf8] border border-warm flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-clay text-olive shrink-0 border border-warm">
                <Key className="w-5 h-5 text-olive" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-500 block">Firebase User UID</span>
                <span className="text-xs font-mono font-bold text-[#2c3333] break-all">{user?.uid || 'N/A'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#fdfcf8] border border-warm flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-clay text-olive shrink-0 border border-warm">
                <Calendar className="w-5 h-5 text-olive" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-500 block">Account Created</span>
                <span className="text-sm font-bold text-[#2c3333]">{createdAtFormatted}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

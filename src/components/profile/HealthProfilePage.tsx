import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  ArrowLeft, 
  CheckCircle2, 
  Home, 
  ShieldCheck, 
  Edit3, 
  Sparkles,
  Database,
  LayoutDashboard,
  Utensils,
  ArrowRight
} from 'lucide-react';
import { PersonalHealthProfile } from '../../types';
import { loadLocalProfile, saveLocalProfile, isValidHealthProfile } from '../../utils/profileStorage';
import { 
  loadCanonicalDemoProfile, 
  saveCanonicalDemoProfile, 
  isUserAdmin, 
  isDemoProfile 
} from '../../utils/demoProfileManager';
import { sanitizeForFirestore } from '../../utils/firestoreSanitize';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { HealthProfileForm } from './HealthProfileForm';
import { HealthProfileSummary } from './HealthProfileSummary';
import { HealthSafetyNotice } from './HealthSafetyNotice';
import { NutriGuideLogo } from '../common/NutriGuideLogo';
import { Lock, Plus } from 'lucide-react';

interface HealthProfilePageProps {
  onNavigateToHome?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToMealPlan?: () => void;
}

export const HealthProfilePage: React.FC<HealthProfilePageProps> = ({
  onNavigateToHome,
  onNavigateToDashboard,
  onNavigateToMealPlan,
}) => {
  const { user, userData } = useAuth();
  const isAdmin = isUserAdmin(user, userData);
  const [profile, setProfile] = useState<PersonalHealthProfile | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isNewProfile, setIsNewProfile] = useState<boolean>(false);
  const [showSavedToast, setShowSavedToast] = useState<boolean>(false);

  const isDemo = Boolean(profile && (profile.isDemo === true || profile.isReadOnly === true || isDemoProfile(profile)));

  useEffect(() => {
    // 1. Check if authenticated user has Firestore-synced profile
    if (user && userData?.healthProfile && isValidHealthProfile(userData.healthProfile)) {
      setProfile(userData.healthProfile);
      setIsEditing(false);
      setIsNewProfile(false);
      return;
    }

    // 2. Check if user has local scoped profile
    const loaded = loadLocalProfile(user?.uid);
    if (loaded && isValidHealthProfile(loaded)) {
      setProfile(loaded);
      setIsEditing(false);
      setIsNewProfile(false);
    } else {
      // 3. For visitors or users who have not yet created a personal profile:
      // Display the canonical public Demo User's Health Profile (locked & read-only)
      const demo = loadCanonicalDemoProfile();
      setProfile(demo);
      setIsEditing(false);
      setIsNewProfile(false);
    }
  }, [user, userData]);

  const handleStartCreateMyProfile = () => {
    setProfile(null);
    setIsEditing(true);
    setIsNewProfile(true);
  };

  const handleStartEdit = () => {
    if (isDemo && !isAdmin) {
      return; // Disallow editing demo profile for non-admins
    }
    setIsEditing(true);
  };

  const handleSaveProfile = async (updatedProfile: PersonalHealthProfile) => {
    if (isDemo && !isAdmin) {
      console.warn('Unauthorized attempt to edit demo profile');
      return;
    }

    // If saving the Canonical Demo Profile as Administrator
    if (isDemo && isAdmin) {
      const cleanDemo: PersonalHealthProfile = {
        ...updatedProfile,
        name: "Demo User's Health Profile",
        isDemo: true,
        isReadOnly: true,
        updatedAt: new Date().toISOString(),
      };
      const result = await saveCanonicalDemoProfile(cleanDemo, user, userData);
      if (result.success) {
        setProfile(result.profile);
        setIsEditing(false);
        setIsNewProfile(false);
        setShowSavedToast(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setShowSavedToast(false), 5000);
      }
      return;
    }

    const now = new Date().toISOString();
    const cleanProfile: PersonalHealthProfile = {
      ...updatedProfile,
      isDemo: false,
      isReadOnly: false,
      createdAt: updatedProfile.createdAt || now,
      updatedAt: now,
      allergies: Array.isArray(updatedProfile.allergies) ? updatedProfile.allergies : [],
      dislikedFoods: Array.isArray(updatedProfile.dislikedFoods) ? updatedProfile.dislikedFoods : [],
      dietaryRestrictions: Array.isArray(updatedProfile.dietaryRestrictions) ? updatedProfile.dietaryRestrictions : [],
    };

    const success = saveLocalProfile(cleanProfile, user?.uid);
    if (success) {
      setProfile(cleanProfile);
      setIsEditing(false);
      setIsNewProfile(false);
      setShowSavedToast(true);

      // If user is authenticated, save profile to Firestore document under /users/{user.uid}
      if (user && db) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const sanitizedPayload = sanitizeForFirestore({ healthProfile: cleanProfile });
          await setDoc(userRef, sanitizedPayload, { merge: true });
        } catch (err) {
          console.error('[Firestore Profile Sync Error]', err);
        }
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setShowSavedToast(false), 5000);
    }
  };

  const initialFormData: Partial<PersonalHealthProfile> = profile || {
    name: userData?.name || user?.displayName || '',
  };

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
          {onNavigateToHome && (
            <button
              onClick={onNavigateToHome}
              className="px-4 py-2 text-xs font-semibold text-[#2c3333] bg-[#fdfcf8] hover:bg-clay border border-warm rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" /> Landing Page
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

          {onNavigateToDashboard && (
            <button
              onClick={onNavigateToDashboard}
              className="px-4 py-2 text-xs font-semibold text-white bg-olive hover:bg-[#4a6854] rounded-full shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto space-y-6">
        {/* Page Hero Banner */}
        <div className="bg-[#233128] text-white rounded-3xl p-6 sm:p-8 border border-[#3e5646] card-shadow relative overflow-hidden space-y-3">
          <div className="relative z-10 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#354a3c] text-[#e5e2d9] border border-[#4a6854]">
                <HeartPulse className="w-3.5 h-3.5 text-olive" /> {isNewProfile ? 'Step 2: Profile Creation' : isDemo ? "Demo User's Health Profile" : 'Personal Health Profile'}
              </span>
              {isDemo ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-900/40 text-amber-200 border border-amber-500/50">
                  <Lock className="w-3.5 h-3.5 text-amber-300" /> Read-Only Demo Profile
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1a241e] text-[#d6c7b0] border border-[#354a3c]">
                  <Database className="w-3.5 h-3.5 text-[#d67d5c]" /> {user ? 'Secure User Account Storage' : 'Local Browser Storage'}
                </span>
              )}
            </div>

            <h1 className="serif text-3xl sm:text-4xl font-bold text-[#fdfcf8] tracking-tight">
              {isNewProfile ? 'Create your Health Profile' : isDemo ? "Demo User's Health Profile" : 'Personal Health Profile'}
            </h1>

            <p className="text-xs sm:text-sm text-[#e5e2d9]/90 max-w-2xl leading-relaxed">
              {isNewProfile
                ? 'Tell us about yourself to get a personalized Bangladeshi meal plan.'
                : isDemo
                ? 'This is a public demonstration profile showcasing Bangladesh-specific nutrition planning.'
                : 'Your personal health metrics, body measurements, activity level, health goals, dietary preferences, and allergies.'}
            </p>

            {isDemo && !isAdmin && !isEditing && (
              <div className="pt-3 sm:pt-4">
                <button
                  id="create-my-personal-profile-btn"
                  onClick={handleStartCreateMyProfile}
                  className="w-full sm:w-auto px-6 py-3.5 text-sm sm:text-base font-bold text-[#233128] bg-[#fdfcf8] hover:bg-white hover:shadow-lg active:scale-[0.99] border-2 border-emerald-400/80 rounded-full transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#233128]"
                >
                  <Plus className="w-5 h-5 text-olive stroke-[2.5]" />
                  <span>Create My Personal Profile</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Health & Safety Medical Disclaimer Notice */}
        <HealthSafetyNotice />

        {/* Form vs Summary Display */}
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div>
                <h2 className="serif text-xl font-bold text-[#2c3333]">
                  {isNewProfile ? 'Create your Health Profile' : 'Edit Health Profile'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isNewProfile
                    ? 'Tell us about yourself to get a personalized Bangladeshi meal plan.'
                    : 'Update your biometric measurements or dietary preferences.'}
                </p>
              </div>

              {!isNewProfile && profile && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-[#fdfcf8] hover:bg-clay border border-warm rounded-full transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Cancel Editing
                </button>
              )}
            </div>

            <HealthProfileForm
              initialData={initialFormData as PersonalHealthProfile}
              onSave={handleSaveProfile}
              onCancel={!isNewProfile && profile ? () => setIsEditing(false) : undefined}
            />
          </div>
        ) : (
          profile && (
            <div className="space-y-8">
              <HealthProfileSummary
                profile={profile}
                onEdit={handleStartEdit}
                onSave={isDemo && !isAdmin ? undefined : () => handleSaveProfile(profile)}
                savedNotification={showSavedToast}
              />

              {/* Action Banner to proceed to Daily Meal Plan */}
              {onNavigateToMealPlan && (
                <div className="bg-clay rounded-3xl border border-warm p-6 sm:p-8 card-shadow flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-olive" />
                      <h3 className="serif text-lg sm:text-xl font-bold text-[#2c3333]">
                        Ready to view your Daily Meal Plan?
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600">
                      Your personalized 5-meal Bangladeshi nutrition plan has been configured to match this profile.
                    </p>
                  </div>

                  <button
                    onClick={onNavigateToMealPlan}
                    className="px-6 py-3 text-xs sm:text-sm font-bold text-white bg-olive hover:bg-[#4a6854] rounded-full shadow-md transition-all inline-flex items-center gap-2 cursor-pointer hover:shadow-lg shrink-0"
                  >
                    <span>View Daily Meal Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )
        )}
      </main>
    </div>
  );
};


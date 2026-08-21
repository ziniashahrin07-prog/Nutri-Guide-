import React, { useState, useEffect } from 'react';
import { PersonalHealthProfile, HealthCalculations, DailyMealPlan } from '../../types';
import { loadLocalProfile, isValidHealthProfile, loadSavedMealPlan } from '../../utils/profileStorage';
import { isDemoProfile, loadCanonicalDemoMealPlan } from '../../utils/demoProfileManager';
import { getFullHealthMetrics } from '../../utils/nutritionCalculator';
import { generateMealPlan } from '../../utils/mealPlanner';
import { useAuth } from '../../context/AuthContext';
import { NutritionAssistantChat } from './NutritionAssistantChat';
import { AskNutriGuideLogo } from '../common/AskNutriGuideLogo';
import { X } from 'lucide-react';

interface NutritionAssistantWidgetProps {
  activeContext?: string;
  onNavigateToProfile?: () => void;
}

export const NutritionAssistantWidget: React.FC<NutritionAssistantWidgetProps> = ({
  activeContext = 'Dashboard',
  onNavigateToProfile
}) => {
  const { user, userData } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [profile, setProfile] = useState<PersonalHealthProfile | null>(null);
  const [calculations, setCalculations] = useState<HealthCalculations | null>(null);
  const [mealPlan, setMealPlan] = useState<DailyMealPlan | null>(null);

  // Fast-load context on open without unnecessary re-generation
  useEffect(() => {
    if (isOpen) {
      const active = (userData?.healthProfile && isValidHealthProfile(userData.healthProfile))
        ? userData.healthProfile
        : (user?.uid ? loadLocalProfile(user.uid) : null);

      if (active && isValidHealthProfile(active)) {
        setProfile(active);
        const calc = getFullHealthMetrics(active);
        if (calc.isValid) {
          setCalculations(calc);
        }

        // Check if user already has a saved plan to avoid redundant generation
        const saved = loadSavedMealPlan(active, user?.uid);
        if (saved) {
          setMealPlan(saved);
        } else if (isDemoProfile(active)) {
          setMealPlan(loadCanonicalDemoMealPlan());
        } else {
          // Generate once if not yet present
          const planRes = generateMealPlan(active);
          if (planRes.success && planRes.plan) {
            setMealPlan(planRes.plan);
          }
        }
      } else {
        setProfile(null);
        setCalculations(null);
        setMealPlan(null);
      }
    }
  }, [isOpen, user, userData]);

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative bg-[#233128] hover:bg-[#2d4034] active:scale-95 text-white pl-3.5 pr-4 py-2.5 sm:py-3 rounded-full shadow-xl hover:shadow-2xl flex items-center gap-3 transition-all duration-200 cursor-pointer border border-[#4a6854]/40"
            aria-label="Open Ask NutriGuide AI Nutrition Assistant"
          >
            <AskNutriGuideLogo size="sm" variant="icon-only" theme="dark" />

            <div className="flex flex-col text-left pr-1">
              <span className="text-xs sm:text-sm font-semibold tracking-tight leading-tight text-white group-hover:text-[#e5ede8] transition-colors">
                Ask NutriGuide
              </span>
              <span className="hidden sm:inline-block text-[10px] font-normal text-white/70 leading-none pt-0.5">
                AI Nutrition Assistant
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#fdfcf8] w-full sm:max-w-2xl sm:rounded-3xl border border-warm shadow-2xl overflow-hidden relative">
            
            {/* Modal Top Bar */}
            <div className="bg-clay px-6 py-3.5 border-b border-warm flex items-center justify-between">
              <AskNutriGuideLogo size="md" variant="full" theme="light" />

              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close Assistant"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-2 sm:p-4">
              <NutritionAssistantChat
                profile={profile}
                calculations={calculations}
                currentMealPlan={mealPlan}
                activeContext={activeContext}
                onNavigateToProfile={onNavigateToProfile}
              />
            </div>

          </div>
        </div>
      )}
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  Shield, 
  HeartPulse, 
  Flame, 
  CheckCircle, 
  BrainCircuit, 
  Activity,
  Utensils,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { loadLocalProfile, isValidHealthProfile } from '../../utils/profileStorage';
import { loadCanonicalDemoProfile, loadCanonicalDemoMealPlan } from '../../utils/demoProfileManager';
import { getFullHealthMetrics } from '../../utils/nutritionCalculator';

interface LandingHeroProps {
  onNavigateToSignUp?: () => void;
  onNavigateToSignIn?: () => void;
  onNavigateToProfile: () => void;
  onNavigateToDashboard: () => void;
  onNavigateToMealPlan?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ 
  onNavigateToProfile,
  onNavigateToDashboard,
  onNavigateToMealPlan
}) => {
  const { user, userData } = useAuth();
  const [demoProfile, setDemoProfile] = useState(() => loadCanonicalDemoProfile());
  const [demoMealPlan, setDemoMealPlan] = useState(() => loadCanonicalDemoMealPlan());

  useEffect(() => {
    setDemoProfile(loadCanonicalDemoProfile());
    setDemoMealPlan(loadCanonicalDemoMealPlan());
  }, []);

  const demoMetrics = getFullHealthMetrics(demoProfile);

  const hasValidProfile = Boolean(
    (userData?.healthProfile && isValidHealthProfile(userData.healthProfile)) ||
    (user?.uid && isValidHealthProfile(loadLocalProfile(user.uid)))
  );

  return (
    <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 bg-[#fdfcf8]">
      {/* Decorative subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e2d930_1px,transparent_1px),linear-gradient(to_bottom,#e5e2d930_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* National & Purpose Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-clay border border-warm text-[#2c3333] text-xs sm:text-sm font-semibold shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-olive animate-pulse"></span>
              <span className="text-olive font-semibold">Designed for Bangladesh</span>
              <span className="text-[#c0bdb5]">|</span>
              <span className="text-slate-600 font-normal">AI Educational Nutrition</span>
            </div>

            {/* Main Display Headline */}
            <h1 className="serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2c3333] tracking-tight leading-[1.18]">
              Personalized Nutrition & Healthy Meal Planning Made Simple for <span className="text-olive italic underline decoration-terracotta/40 decoration-2 underline-offset-4">Bangladesh</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Understand your personal daily energy requirements, explore comprehensive nutrition profiles of traditional Bangladeshi foods, and receive tailored meal guidance powered by Gemini AI.
            </p>

            {/* Bullet Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-w-xl mx-auto lg:mx-0 text-left">
              <div className="flex items-center gap-2 text-sm text-[#2c3333] font-medium">
                <CheckCircle className="w-4 h-4 text-olive shrink-0" />
                <span>Mifflin-St Jeor BMR & TDEE Calculations</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#2c3333] font-medium">
                <CheckCircle className="w-4 h-4 text-olive shrink-0" />
                <span>Curated Bangladesh Food Dictionary</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#2c3333] font-medium">
                <CheckCircle className="w-4 h-4 text-olive shrink-0" />
                <span>Gemini AI Personal Nutrition Companion</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#2c3333] font-medium">
                <CheckCircle className="w-4 h-4 text-olive shrink-0" />
                <span>Firebase Private Auth & Data Privacy</span>
              </div>
            </div>

            {/* Authenticated State-Aware Action Buttons (if signed in) */}
            {user && (
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                {!hasValidProfile ? (
                  <button
                    onClick={onNavigateToProfile}
                    className="w-full sm:w-auto px-7 py-3.5 text-base font-semibold text-white bg-olive hover:bg-[#4a6854] rounded-full shadow-lg shadow-[#5a7d66]/20 transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
                  >
                    <HeartPulse className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Complete Health Profile</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={onNavigateToMealPlan || onNavigateToDashboard}
                      className="w-full sm:w-auto px-7 py-3.5 text-base font-semibold text-white bg-olive hover:bg-[#4a6854] rounded-full shadow-lg shadow-[#5a7d66]/20 transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
                    >
                      <Utensils className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>View My Meal Plan</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={onNavigateToProfile}
                      className="w-full sm:w-auto px-6 py-3.5 text-base font-semibold text-[#2c3333] bg-clay hover:bg-[#e8e8e0] border border-warm rounded-full shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <HeartPulse className="w-4 h-4 text-olive" />
                      <span>My Health Profile</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Micro disclaimer note */}
            <p className="text-xs text-slate-500 pt-1">
              * Educational & wellness application. Not intended for medical diagnosis or clinical prescription.
            </p>
          </div>

          {/* Right Column: Visual Product Showcase Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Card Surface */}
              <div className="relative rounded-3xl bg-clay border border-warm card-shadow p-6 sm:p-7 space-y-5">
                {/* Showcase Header */}
                <div className="flex items-center justify-between pb-4 border-b border-warm">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-olive text-white font-bold text-xs">
                      Demo
                    </div>
                    <div>
                      <h3 className="serif font-bold text-[#2c3333] text-base">{demoProfile.name || 'Example Profile'}</h3>
                      <p className="text-xs text-slate-500">Public Example • {demoProfile.age} yrs • {demoProfile.activityLevel.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-700" /> Read-Only Demo
                  </span>
                </div>

                {/* Metric Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3.5 rounded-2xl bg-[#fdfcf8] border border-warm text-center space-y-0.5">
                    <div className="flex items-center justify-center text-xs text-slate-500 gap-1">
                      <Activity className="w-3.5 h-3.5 text-olive" /> BMI
                    </div>
                    <div className="font-bold text-[#2c3333] text-lg">{demoMetrics.bmi || '22.4'}</div>
                    <div className="text-[10px] text-olive font-semibold">{demoMetrics.bmiCategory}</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#fdfcf8] border border-warm text-center space-y-0.5">
                    <div className="flex items-center justify-center text-xs text-slate-500 gap-1">
                      <Flame className="w-3.5 h-3.5 text-[#d67d5c]" /> BMR
                    </div>
                    <div className="font-bold text-[#2c3333] text-lg">{demoMetrics.bmrKcal?.toLocaleString() || '1,540'}</div>
                    <div className="text-[10px] text-slate-500">kcal/day</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#fdfcf8] border border-warm text-center space-y-0.5">
                    <div className="flex items-center justify-center text-xs text-slate-500 gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-olive" /> TDEE
                    </div>
                    <div className="font-bold text-[#2c3333] text-lg">{demoMetrics.dailyEnergyNeedsKcal?.toLocaleString() || '2,230'}</div>
                    <div className="text-[10px] text-olive font-semibold">Maintenance</div>
                  </div>
                </div>

                {/* Meal Suggestion Preview Box */}
                <div className="p-4 rounded-2xl bg-[#fdfcf8] border border-warm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2c3333] flex items-center gap-1.5">
                      <BrainCircuit className="w-4 h-4 text-olive" /> AI Balanced Lunch Suggestion
                    </span>
                    <span className="text-[11px] font-semibold text-[#d67d5c] bg-terracotta/10 px-2 py-0.5 rounded-full">~620 kcal</span>
                  </div>
                  <div className="text-xs text-slate-700 space-y-1.5">
                    <div className="flex justify-between border-b border-warm/60 pb-1">
                      <span>• Red Rice (Lal Bhaat)</span>
                      <span className="font-medium">1 bowl (180 kcal)</span>
                    </div>
                    <div className="flex justify-between border-b border-warm/60 pb-1">
                      <span>• Ruhi Fish Curry (Light Gravy)</span>
                      <span className="font-medium">1 pc (165 kcal)</span>
                    </div>
                    <div className="flex justify-between border-b border-warm/60 pb-1">
                      <span>• Masoor Dal + Palong Shak</span>
                      <span className="font-medium">1 bowl (170 kcal)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Unsweetened Tok Doi</span>
                      <span className="font-medium">1/2 cup (85 kcal)</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Trust Badge */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-olive" /> Scientific Macro Ratios
                  </span>
                  <span className="text-olive font-medium">
                    Carbs: 50% | Prot: 20% | Fat: 30%
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};


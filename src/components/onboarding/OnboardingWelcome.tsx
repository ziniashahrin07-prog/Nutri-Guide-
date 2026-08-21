import React from 'react';
import { 
  HeartPulse, 
  ArrowRight, 
  Sparkles, 
  Calculator, 
  Utensils, 
  ShieldCheck, 
  LogOut, 
  Home,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NutriGuideLogo } from '../common/NutriGuideLogo';

interface OnboardingWelcomeProps {
  onStartProfileSetup: () => void;
  onNavigateToHome?: () => void;
}

export const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({
  onStartProfileSetup,
  onNavigateToHome,
}) => {
  const { user, userData, signOut } = useAuth();

  const displayName = userData?.name || user?.displayName || 'there';

  return (
    <div className="min-h-screen bg-[#fdfcf8] py-8 px-4 sm:px-6 lg:px-8 space-y-8 flex flex-col justify-between">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full bg-clay rounded-3xl border border-warm p-5 card-shadow flex items-center justify-between">
        <div className="flex items-center gap-3">
          <NutriGuideLogo size="sm" />
        </div>

        <div className="flex items-center gap-2.5">
          {onNavigateToHome && (
            <button
              onClick={onNavigateToHome}
              className="px-4 py-2 text-xs font-semibold text-[#2c3333] bg-[#fdfcf8] hover:bg-clay border border-warm rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" /> Landing Page
            </button>
          )}

          {user && (
            <button
              onClick={() => signOut()}
              className="px-3.5 py-2 text-xs font-semibold text-[#2c3333] hover:text-red-700 hover:bg-[#f5f5f0] rounded-full transition-colors flex items-center gap-1.5 border border-[#e5e2d9] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto w-full space-y-8">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-olive/10 border border-olive/20 text-olive text-xs font-bold">
            <span className="flex h-2 w-2 rounded-full bg-olive animate-pulse"></span>
            <span>Step 1: Welcome & Setup</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-clay border border-warm text-slate-500 text-xs font-medium">
            <span>Step 2: Health Profile</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-clay border border-warm text-slate-500 text-xs font-medium">
            <span>Step 3: Daily Meal Plan</span>
          </div>
        </div>

        {/* Hero Welcome Card */}
        <div className="bg-[#233128] text-white rounded-3xl p-8 sm:p-12 border border-[#3e5646] card-shadow relative overflow-hidden text-center space-y-6">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#5a7d66]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#d67d5c]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 bg-[#354a3c] border border-[#4a6854] text-[#fdfcf8] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <HeartPulse className="w-8 h-8 text-olive" />
            </div>

            <h1 className="serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#fdfcf8] tracking-tight">
              Welcome to NutriGuide 👋
            </h1>

            <p className="text-sm sm:text-base text-[#e5e2d9]/90 leading-relaxed font-normal">
              Create your Health Profile to receive a personalized Bangladeshi meal plan tailored to your body, lifestyle, and dietary preferences.
            </p>

            {/* Primary Action Button */}
            <div className="pt-4">
              <button
                onClick={onStartProfileSetup}
                className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-olive hover:bg-[#4a6854] rounded-full shadow-lg shadow-[#5a7d66]/30 hover:shadow-xl transition-all inline-flex items-center justify-center gap-3 cursor-pointer group hover:scale-[1.02]"
              >
                <span>Create Health Profile</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Value Proposition Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-clay rounded-2xl border border-warm p-5 space-y-2 card-shadow">
            <div className="w-9 h-9 rounded-xl bg-[#fdfcf8] border border-warm flex items-center justify-center text-olive">
              <Calculator className="w-4 h-4" />
            </div>
            <h3 className="serif text-sm font-bold text-[#2c3333]">
              Scientific Energy Target
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mifflin-St Jeor BMR & TDEE calculation adapted for your height, weight, and activity level.
            </p>
          </div>

          <div className="bg-clay rounded-2xl border border-warm p-5 space-y-2 card-shadow">
            <div className="w-9 h-9 rounded-xl bg-[#fdfcf8] border border-warm flex items-center justify-center text-olive">
              <Utensils className="w-4 h-4" />
            </div>
            <h3 className="serif text-sm font-bold text-[#2c3333]">
              Local Food Dictionary
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tailored portions of red rice, macher jhol, dal, and fresh shaks matching authentic Bengali diets.
            </p>
          </div>

          <div className="bg-clay rounded-2xl border border-warm p-5 space-y-2 card-shadow">
            <div className="w-9 h-9 rounded-xl bg-[#fdfcf8] border border-warm flex items-center justify-center text-olive">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="serif text-sm font-bold text-[#2c3333]">
              Gemini AI Guidance
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ask nutrition questions and explore healthy food alternatives tailored to your health goals.
            </p>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 text-center">
          <ShieldCheck className="w-4 h-4 text-olive" />
          <span>Your personal health data is securely scoped to your account and stored privately.</span>
        </div>

      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-4">
        NutriGuide Bangladesh • Educational Nutrition & Meal Planning
      </footer>
    </div>
  );
};

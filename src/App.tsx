import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/navigation/Navbar';
import { LandingHero } from './components/landing/LandingHero';
import { FeaturesSection } from './components/landing/FeaturesSection';
import { FoodDatabaseShowcase } from './components/landing/FoodDatabaseShowcase';
import { HowItWorks } from './components/landing/HowItWorks';
import { MedicalDisclaimer } from './components/common/MedicalDisclaimer';
import { AuthModal } from './components/auth/AuthModal';
import { Footer } from './components/navigation/Footer';
import { SignInPage } from './components/auth/SignInPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { HealthProfilePage } from './components/profile/HealthProfilePage';
import { DailyMealPlanPage } from './components/mealPlanner/DailyMealPlanPage';
import { OnboardingWelcome } from './components/onboarding/OnboardingWelcome';
import { MealPlanner } from './components/mealPlanner/MealPlanner';
import { NutritionAssistantWidget } from './components/assistant/NutritionAssistantWidget';
import { loadLocalProfile, isValidHealthProfile } from './utils/profileStorage';

type ViewMode = 'landing' | 'signin' | 'signup' | 'onboarding' | 'dashboard' | 'profile' | 'meal-plan';

function AppContent() {
  const { user, userData, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>('landing');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Check if current authenticated user has a completed and valid health profile
  const hasValidProfile = Boolean(
    (userData?.healthProfile && isValidHealthProfile(userData.healthProfile)) ||
    (user?.uid && isValidHealthProfile(loadLocalProfile(user.uid)))
  );

  // Protected route enforcement and redirect logic
  useEffect(() => {
    if (!loading) {
      if (user) {
        if (currentView === 'signup') {
          // After successful account creation, take the user to Step 1 Onboarding Welcome state
          setCurrentView('onboarding');
        } else if (currentView === 'signin') {
          // If returning user has valid profile, send to dashboard; otherwise show onboarding welcome state
          setCurrentView(hasValidProfile ? 'dashboard' : 'onboarding');
        }
      } else {
        // If user is unauthenticated and tries to access dashboard or onboarding, redirect to signin
        if (currentView === 'dashboard' || currentView === 'onboarding') {
          setCurrentView('signin');
        }
      }
    }
  }, [user, loading, currentView, hasValidProfile]);

  const handleNavigateToDashboard = () => {
    if (!user) {
      setCurrentView('signin');
      return;
    }
    setCurrentView(hasValidProfile ? 'dashboard' : 'onboarding');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfcf8] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-olive/20 border-t-olive rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-[#2c3333]">Loading Nutri Guide...</p>
        </div>
      </div>
    );
  }

  // Render Step 1: First-Time User Onboarding Welcome View
  if (currentView === 'onboarding') {
    if (!user) {
      return (
        <SignInPage
          onNavigateToSignUp={() => setCurrentView('signup')}
          onNavigateToHome={() => setCurrentView('landing')}
        />
      );
    }

    return (
      <OnboardingWelcome
        onStartProfileSetup={() => setCurrentView('profile')}
        onNavigateToHome={() => setCurrentView('landing')}
      />
    );
  }

  // Render Step 2: Personal Health Profile View (Strictly dedicated to profile info & biometrics, NOT meal plan)
  if (currentView === 'profile') {
    return (
      <HealthProfilePage
        onNavigateToHome={() => setCurrentView('landing')}
        onNavigateToDashboard={handleNavigateToDashboard}
        onNavigateToMealPlan={() => setCurrentView('meal-plan')}
      />
    );
  }

  // Render Step 3: Separate Dedicated Daily Meal Plan View
  if (currentView === 'meal-plan') {
    return (
      <DailyMealPlanPage
        onNavigateToHome={() => setCurrentView('landing')}
        onNavigateToProfile={() => setCurrentView('profile')}
        onNavigateToDashboard={handleNavigateToDashboard}
        onOpenAuth={() => setCurrentView('signin')}
        onNavigateToSignUp={() => setCurrentView('signup')}
      />
    );
  }

  // Render Protected Dashboard View
  if (currentView === 'dashboard') {
    if (!user) {
      return (
        <SignInPage
          onNavigateToSignUp={() => setCurrentView('signup')}
          onNavigateToHome={() => setCurrentView('landing')}
        />
      );
    }

    // If user has no valid profile, route to Onboarding Welcome
    if (!hasValidProfile) {
      return (
        <OnboardingWelcome
          onStartProfileSetup={() => setCurrentView('profile')}
          onNavigateToHome={() => setCurrentView('landing')}
        />
      );
    }

    return (
      <Dashboard
        onNavigateToHome={() => setCurrentView('landing')}
        onNavigateToProfile={() => setCurrentView('profile')}
        onNavigateToMealPlan={() => setCurrentView('meal-plan')}
      />
    );
  }

  // Render Sign In Page View
  if (currentView === 'signin') {
    return (
      <SignInPage
        onNavigateToSignUp={() => setCurrentView('signup')}
        onNavigateToHome={() => setCurrentView('landing')}
      />
    );
  }

  // Render Sign Up Page View
  if (currentView === 'signup') {
    return (
      <SignUpPage
        onNavigateToSignIn={() => setCurrentView('signin')}
        onNavigateToHome={() => setCurrentView('landing')}
      />
    );
  }

  // Public Landing Page View
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcf8] text-slate-800">
      {/* Header Navigation */}
      <Navbar
        onOpenAuth={() => setCurrentView('signin')}
        onNavigateToSignUp={() => setCurrentView('signup')}
        onNavigateToDashboard={handleNavigateToDashboard}
        onNavigateToProfile={() => setCurrentView('profile')}
        onNavigateToMealPlan={() => setCurrentView('meal-plan')}
        onNavigateToHome={() => setCurrentView('landing')}
        activeView={currentView}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Hero Banner */}
        <LandingHero
          onNavigateToProfile={() => setCurrentView('profile')}
          onNavigateToDashboard={handleNavigateToDashboard}
          onNavigateToMealPlan={() => setCurrentView('meal-plan')}
        />

        {/* Core Capabilities */}
        <FeaturesSection />

        {/* Bangladesh Food Database Preview */}
        <FoodDatabaseShowcase />

        {/* Interactive Personalized Daily Meal Planner Preview (Shows clean empty state if no profile exists) */}
        <section id="meal-planner" className="py-16 md:py-24 bg-clay/40 border-y border-warm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <MealPlanner 
              profile={hasValidProfile ? (userData?.healthProfile || (user?.uid ? loadLocalProfile(user.uid) : null)) : null}
              userId={user?.uid}
              onNavigateToProfile={() => setCurrentView('profile')} 
            />
          </div>
        </section>

        {/* How It Works Journey */}
        <HowItWorks />

        {/* Health & Safety Disclaimer Section */}
        <section id="disclaimer" className="py-12 bg-white border-t border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <MedicalDisclaimer />
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Auth Modal Overlay */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => handleNavigateToDashboard()}
      />

      {/* Global Floating Gemini AI Nutrition Assistant Widget */}
      <NutritionAssistantWidget
        activeContext={
          currentView === 'landing'
            ? 'Landing Page'
            : currentView === 'dashboard'
            ? 'Dashboard'
            : currentView === 'meal-plan'
            ? 'Daily Meal Plan'
            : 'Health Profile'
        }
        onNavigateToProfile={() => setCurrentView('profile')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

import React, { useState } from 'react';
import { NutriGuideLogo } from '../common/NutriGuideLogo';
import { Menu, X, User, Sparkles, BookOpen, ShieldCheck, HeartPulse, Utensils, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onOpenAuth: () => void;
  onNavigateToSignUp?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToMealPlan?: () => void;
  onNavigateToHome?: () => void;
  activeView?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onNavigateToSignUp,
  onNavigateToDashboard,
  onNavigateToProfile,
  onNavigateToMealPlan,
  onNavigateToHome,
  activeView = 'landing',
}) => {
  const { user, userData, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (activeView !== 'landing' && onNavigateToHome) {
      onNavigateToHome();
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBrandClick = () => {
    if (onNavigateToHome) {
      onNavigateToHome();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displayName = userData?.name || user?.displayName || 'Account';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#fdfcf8]/90 border-b border-[#e5e2d9] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <div onClick={handleBrandClick} className="cursor-pointer">
          <NutriGuideLogo size="md" />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
          {/* Health Profile Navigation Item */}
          {onNavigateToProfile && (
            <button
              onClick={onNavigateToProfile}
              className={`px-3.5 py-2 text-sm font-semibold rounded-full transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeView === 'profile'
                  ? 'bg-olive text-white shadow-xs'
                  : 'text-olive hover:text-[#4a6854] hover:bg-[#f5f5f0] border border-olive/20'
              }`}
            >
              <HeartPulse className={`w-4 h-4 ${activeView === 'profile' ? 'text-white' : 'text-olive'}`} />
              Health Profile
            </button>
          )}

          {/* Daily Meal Plan Navigation Item */}
          {onNavigateToMealPlan ? (
            <button
              onClick={onNavigateToMealPlan}
              className={`px-3.5 py-2 text-sm font-semibold rounded-full transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeView === 'meal-plan'
                  ? 'bg-olive text-white shadow-xs'
                  : 'text-[#2c3333] hover:text-[#5a7d66] hover:bg-[#f5f5f0]'
              }`}
            >
              <Utensils className={`w-4 h-4 ${activeView === 'meal-plan' ? 'text-white' : 'text-olive'}`} />
              Daily Meal Plan
            </button>
          ) : (
            <button
              onClick={() => scrollToSection('meal-planner')}
              className="px-3.5 py-2 text-sm font-medium text-[#2c3333] hover:text-[#5a7d66] hover:bg-[#f5f5f0] rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Utensils className="w-4 h-4 text-olive" />
              Daily Meal Plan
            </button>
          )}

          {/* BD Food Database Navigation Item */}
          <button
            onClick={() => scrollToSection('food-database')}
            className="px-3.5 py-2 text-sm font-medium text-[#2c3333] hover:text-[#5a7d66] hover:bg-[#f5f5f0] rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#5a7d66]" />
            BD Food Database
          </button>

          {/* How It Works Navigation Item */}
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="px-3.5 py-2 text-sm font-medium text-[#2c3333] hover:text-[#5a7d66] hover:bg-[#f5f5f0] rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#5a7d66]" />
            How It Works
          </button>

          {/* Health & Safety Navigation Item */}
          <button
            onClick={() => scrollToSection('disclaimer')}
            className="px-3.5 py-2 text-sm font-medium text-[#2c3333] hover:text-[#5a7d66] hover:bg-[#f5f5f0] rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-olive" />
            Health & Safety
          </button>
        </nav>

        {/* Desktop Action CTAs */}
        <div className="hidden md:flex items-center gap-2.5">
          {user ? (
            <>
              {onNavigateToDashboard && (
                <button
                  onClick={onNavigateToDashboard}
                  className={`px-4 py-2 text-sm font-semibold rounded-full shadow-xs transition-colors flex items-center gap-2 cursor-pointer ${
                    activeView === 'dashboard'
                      ? 'bg-[#233128] text-white'
                      : 'text-white bg-olive hover:bg-[#4a6854]'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard ({displayName.split(' ')[0]})
                </button>
              )}

              <button
                onClick={() => signOut()}
                className="px-3.5 py-2 text-xs font-semibold text-[#2c3333] hover:text-red-700 hover:bg-[#f5f5f0] rounded-full transition-colors flex items-center gap-1.5 border border-[#e5e2d9] cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              {onNavigateToSignUp && (
                <button
                  onClick={onNavigateToSignUp}
                  className="px-4.5 py-2 text-sm font-semibold text-white bg-olive hover:bg-[#4a6854] rounded-full shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Create Account
                </button>
              )}

              <button
                onClick={onOpenAuth}
                className="px-4 py-2 text-sm font-semibold text-[#2c3333] hover:text-[#5a7d66] hover:bg-[#f5f5f0] rounded-full transition-colors flex items-center gap-1.5 border border-[#e5e2d9] cursor-pointer"
              >
                <User className="w-4 h-4 text-[#5a7d66]" />
                Sign In
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          {user ? (
            <button
              onClick={onNavigateToDashboard}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-olive rounded-full shadow-xs flex items-center gap-1"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-olive rounded-full shadow-xs"
            >
              Sign In
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#2c3333] hover:text-[#5a7d66] hover:bg-[#f5f5f0] rounded-full border border-[#e5e2d9]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Slide-down */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#e5e2d9] bg-[#fdfcf8] px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-1">
            {onNavigateToProfile && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateToProfile();
                }}
                className={`px-3 py-2.5 text-left text-sm font-semibold rounded-xl flex items-center gap-2 border ${
                  activeView === 'profile'
                    ? 'bg-olive text-white border-olive'
                    : 'text-olive bg-olive/10 hover:bg-olive/20 border-olive/20'
                }`}
              >
                <HeartPulse className="w-4 h-4" />
                Health Profile
              </button>
            )}

            {onNavigateToMealPlan && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateToMealPlan();
                }}
                className={`px-3 py-2.5 text-left text-sm font-semibold rounded-xl flex items-center gap-2 ${
                  activeView === 'meal-plan'
                    ? 'bg-olive text-white'
                    : 'text-[#2c3333] hover:bg-[#f5f5f0]'
                }`}
              >
                <Utensils className="w-4 h-4 text-olive" />
                Daily Meal Plan
              </button>
            )}

            <button
              onClick={() => scrollToSection('food-database')}
              className="px-3 py-2.5 text-left text-sm font-medium text-[#2c3333] hover:bg-[#f5f5f0] rounded-xl flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-[#5a7d66]" />
              BD Food Database
            </button>

            <button
              onClick={() => scrollToSection('how-it-works')}
              className="px-3 py-2.5 text-left text-sm font-medium text-[#2c3333] hover:bg-[#f5f5f0] rounded-xl flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#5a7d66]" />
              How It Works
            </button>

            <button
              onClick={() => scrollToSection('disclaimer')}
              className="px-3 py-2.5 text-left text-sm font-medium text-[#2c3333] hover:bg-[#f5f5f0] rounded-xl flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-olive" />
              Health & Safety
            </button>
          </div>

          <div className="pt-3 border-t border-[#e5e2d9] flex flex-col gap-2">
            {user ? (
              <>
                {onNavigateToDashboard && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigateToDashboard();
                    }}
                    className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-olive hover:bg-[#4a6854] rounded-full text-center shadow-sm flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Go to Dashboard ({displayName})
                  </button>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-[#2c3333] bg-[#f5f5f0] hover:bg-[#e8e8e0] rounded-full text-center border border-[#e5e2d9] flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                {onNavigateToSignUp && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigateToSignUp();
                    }}
                    className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-olive hover:bg-[#4a6854] rounded-full text-center shadow-sm flex items-center justify-center gap-2"
                  >
                    Create Account
                  </button>
                )}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-[#2c3333] bg-[#f5f5f0] hover:bg-[#e8e8e0] rounded-full text-center flex items-center justify-center gap-2 border border-[#e5e2d9]"
                >
                  <User className="w-4 h-4 text-[#5a7d66]" />
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

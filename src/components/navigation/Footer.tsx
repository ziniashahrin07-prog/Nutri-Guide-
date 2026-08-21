import React from 'react';
import { NutriGuideLogo } from '../common/NutriGuideLogo';
import { ShieldCheck, Heart, Info, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#233128] text-[#e5e2d9] border-t border-[#3e5646] pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-[#3e5646]">
          
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-3">
            <div className="bg-[#fdfcf8] p-3 rounded-2xl inline-block border border-warm">
              <NutriGuideLogo size="md" />
            </div>
            <p className="text-xs text-[#e5e2d9]/80 leading-relaxed max-w-sm">
              Nutri Guide is an educational nutrition and personal meal-planning platform built specifically for Bangladesh. Powered by verified food databases, scientific energy formulas, and Gemini AI.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="serif text-xs font-bold text-[#fdfcf8] uppercase tracking-wider">Application Modules</h4>
            <ul className="text-xs text-[#e5e2d9]/80 space-y-2">
              <li><a href="#features" className="hover:text-olive transition-colors">Personal Health Profile & Math</a></li>
              <li><a href="#food-database" className="hover:text-olive transition-colors">Bangladesh Food Database</a></li>
              <li><a href="#how-it-works" className="hover:text-olive transition-colors">How Nutri Guide Works</a></li>
              <li><a href="#disclaimer" className="hover:text-olive transition-colors">Health & Safety Disclaimer</a></li>
            </ul>
          </div>

          {/* Regional Context */}
          <div className="md:col-span-4 space-y-2.5">
            <h4 className="serif text-xs font-bold text-[#fdfcf8] uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-olive" /> Regional Context
            </h4>
            <p className="text-xs text-[#e5e2d9]/80 leading-relaxed">
              Designed around familiar Bangladeshi dietary patterns, authentic portion sizes, and everyday household staple dishes.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2d4034] border border-[#4a6854] text-[11px] text-[#e5e2d9] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-olive" /> Educational & Wellness Application
            </div>
          </div>

        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#e5e2d9]/60 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Nutri Guide Bangladesh. Educational and wellness tool. Not medical advice.</p>
          <div className="flex items-center gap-1 text-[#e5e2d9]/80">
            <span>Built with care for Bangladesh</span>
            <Heart className="w-3.5 h-3.5 text-[#d67d5c] fill-[#d67d5c]" />
          </div>
        </div>

      </div>
    </footer>
  );
};

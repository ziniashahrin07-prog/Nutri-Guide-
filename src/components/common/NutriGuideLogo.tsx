import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const NutriGuideLogo: React.FC<LogoProps> = ({ size = 'md', showSubtitle = true }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-11 h-11',
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-2.5 group cursor-pointer select-none">
      <div className={`${iconSizes[size]} relative flex items-center justify-center rounded-full bg-olive text-white shadow-md shadow-[#5a7d66]/20 transition-transform group-hover:scale-105`}>
        {/* Leaf & Bowl Motif SVG */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3/5 h-3/5">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 9 0 5-4 9-10 9z" />
          <path d="M11 20v-9" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center">
          <span className={`serif font-bold tracking-tight text-[#2c3333] ${titleSizes[size]}`}>
            Nutri<span className="text-olive">Guide</span>
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] font-medium text-slate-500 -mt-0.5 tracking-wide">
            Nutrition & Meal Planner
          </span>
        )}
      </div>
    </div>
  );
};

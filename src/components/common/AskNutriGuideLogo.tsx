import React from 'react';

interface AskNutriGuideLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon-only' | 'full' | 'compact';
  theme?: 'dark' | 'light' | 'colored';
}

export const AskNutriGuideLogo: React.FC<AskNutriGuideLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  theme = 'light'
}) => {
  const iconDimensions = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const containerSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11'
  };

  const isDark = theme === 'dark';
  const isLight = theme === 'light';

  // Minimal, distinctive Health + AI emblem combining a clean organic leaf silhouette and an intelligence spark
  const IconGraphic = (
    <div
      className={`relative flex items-center justify-center rounded-xl transition-transform shrink-0 ${
        containerSizes[size]
      } ${
        isDark
          ? 'bg-[#233128] text-white shadow-xs border border-[#4a6854]/40'
          : isLight
          ? 'bg-[#f4f7f4] text-[#3e5646] border border-[#d2ded5] shadow-2xs'
          : 'bg-[#5a7d66]/10 text-[#3e5646] border border-[#5a7d66]/20'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconDimensions[size]} transition-all`}
        aria-hidden="true"
      >
        {/* Organic Wellness Leaf Silhouette */}
        <path
          d="M19 4.5C14.5 4.5 8.5 7.5 7 13.5C5.8 17 8 20 11.5 20C17 20 20.5 14 20.5 9C20.5 5.5 19.8 4.5 19 4.5Z"
          fill="currentColor"
          fillOpacity={isDark ? "0.22" : "0.15"}
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Central Vein & Graceful Flow */}
        <path
          d="M7.5 19C10.5 16 14.5 11.5 19 4.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Precision Four-Point Intelligence Spark (AI Guide) */}
        <path
          d="M4.5 2.5L5.2 4.3L7 5L5.2 5.7L4.5 7.5L3.8 5.7L2 5L3.8 4.3L4.5 2.5Z"
          fill={isDark ? '#f8f5ee' : '#3e5646'}
        />

        {/* Delicate Guidance Accent Sparkle */}
        <circle
          cx="3.5"
          cy="11"
          r="1"
          fill="currentColor"
          fillOpacity={isDark ? "0.7" : "0.5"}
        />
      </svg>
    </div>
  );

  if (variant === 'icon-only') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {IconGraphic}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {IconGraphic}
      <div className="flex flex-col text-left">
        <span
          className={`font-semibold tracking-tight leading-tight ${
            size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
          } ${isDark ? 'text-white' : 'text-[#2c3333]'}`}
        >
          Ask <span className={isDark ? 'text-[#c6dcce]' : 'text-olive'}>NutriGuide</span>
        </span>
        <span
          className={`text-[10px] font-medium tracking-wide leading-none pt-0.5 ${
            isDark ? 'text-white/70' : 'text-slate-500'
          }`}
        >
          AI Nutrition Assistant
        </span>
      </div>
    </div>
  );
};

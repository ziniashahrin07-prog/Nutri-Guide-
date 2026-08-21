import React from 'react';
import { UserCheck, Sparkles, Utensils } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      icon: UserCheck,
      title: 'Enter Basic Profile Data',
      description: 'Input age, height, weight, activity level, and dietary preferences (e.g. Vegetarian, Diabetic-friendly, Unrestricted).'
    },
    {
      step: '02',
      icon: Utensils,
      title: 'Review Energy & Local Food Breakdown',
      description: 'Instantly view calculated BMR, TDEE energy targets, and balanced portion recommendations using familiar Bangladeshi foods.'
    },
    {
      step: '03',
      icon: Sparkles,
      title: 'Ask Gemini AI & Fine-Tune Meals',
      description: 'Interact with the AI assistant to explore healthier local food swaps, clarify nutrition questions, and log your progress.'
    }
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-[#233128] text-white relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#5a7d66]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#d67d5c]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-[#354a3c] border border-[#4a6854] text-[#e5e2d9] text-xs font-semibold">
            Simple 3-Step Journey
          </span>
          <h2 className="serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#fdfcf8] tracking-tight">
            How Nutri Guide Empowers Your Eating Habits
          </h2>
          <p className="text-sm sm:text-base text-[#e5e2d9]/80 leading-relaxed">
            No complicated diet jargon or unreachable ingredients. Built around everyday Bangladeshi living.
          </p>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item, index) => {
            const IconComp = item.icon;
            return (
              <div
                key={index}
                className="bg-[#2d4034] border border-[#3e5646] rounded-3xl p-7 relative space-y-4 shadow-lg hover:border-[#5a7d66] transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="serif text-3xl font-bold text-[#d67d5c]">
                      {item.step}
                    </span>
                    <div className="p-3 rounded-2xl bg-[#354a3c] text-[#fdfcf8] border border-[#4a6854]">
                      <IconComp className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="serif text-lg font-bold text-[#fdfcf8] tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#e5e2d9]/80 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};



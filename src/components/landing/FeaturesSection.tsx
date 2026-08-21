import React from 'react';
import { UserCheck, Calculator, Utensils, Sparkles, Shield, LineChart, BrainCircuit, HeartPulse } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Calculator,
      color: 'emerald',
      title: 'Scientifically Validated Health Calculations',
      description: 'Calculates Body Mass Index (BMI), Basal Metabolic Rate (BMR) via Mifflin-St Jeor formula, and Total Daily Energy Expenditure (TDEE) adapted to your activity level.'
    },
    {
      icon: Utensils,
      color: 'teal',
      title: 'Bangladesh Food Database',
      description: 'Curated nutrition values, macronutrient compositions, and portion measurements for authentic Bangladeshi food items and regional recipes.'
    },
    {
      icon: BrainCircuit,
      color: 'emerald',
      title: 'Gemini AI Educational Assistant',
      description: 'Ask nutrition questions, receive simple explanations of macronutrients, and get recommendations using familiar Bangladeshi ingredients in conversational English & Bengali.'
    },
    {
      icon: HeartPulse,
      color: 'amber',
      title: 'Culturally Relevant Meal Guidance',
      description: 'Meal distribution crafted around authentic Bangladeshi eating patterns (Morning, Midday Bhaat/Curry, Afternoon Tea/Snack, Evening Dinner).'
    },
    {
      icon: Shield,
      color: 'blue',
      title: 'Firebase Private Auth & Security',
      description: 'Built on Firebase Authentication and Firestore security rules to ensure every user maintains full control and private ownership of their personal health profile.'
    },
    {
      icon: LineChart,
      color: 'teal',
      title: 'Non-Medical Progress Tracker',
      description: 'Log weight history, set realistic nutrition goals, and track daily meal habit consistency over time with intuitive visual progress charts.'
    }
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-[#fdfcf8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-clay border border-warm text-olive text-xs font-semibold">
            Core Application Capabilities
          </span>
          <h2 className="serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2c3333] tracking-tight">
            Designed for Everyday Health & Cultural Authenticity
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Nutri Guide combines modern nutritional science with deep respect for Bangladeshi food culture and user privacy.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, index) => {
            const IconComp = item.icon;
            return (
              <div
                key={index}
                className="p-7 rounded-3xl bg-clay border border-warm card-shadow hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#fdfcf8] border border-warm shadow-xs flex items-center justify-center text-olive">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="serif text-lg font-bold text-[#2c3333] tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="pt-2 text-xs font-semibold text-olive flex items-center gap-1">
                  <span>Explore Feature</span> &rarr;
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

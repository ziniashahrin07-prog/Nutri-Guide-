import React from 'react';
import { 
  Flame, 
  Activity, 
  Target, 
  Ruler, 
  Weight, 
  ShieldAlert, 
  Info, 
  Sparkles, 
  HeartPulse, 
  Scale, 
  Zap,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { PersonalHealthProfile } from '../../types';
import { 
  getFullHealthMetrics, 
  HEALTH_CALCULATION_DISCLAIMER, 
  BMI_SCREENING_NOTICE,
  VALID_ACTIVITY_MULTIPLIERS
} from '../../utils/nutritionCalculator';

interface NutritionSummaryProps {
  profile: PersonalHealthProfile;
  className?: string;
}

export const NutritionSummary: React.FC<NutritionSummaryProps> = ({ profile, className = '' }) => {
  const metrics = getFullHealthMetrics(profile);

  const getActivityLabel = (level: string) => {
    switch (level) {
      case 'sedentary':
        return 'Sedentary (1.20x multiplier • little/no exercise)';
      case 'lightly_active':
        return 'Lightly Active (1.375x multiplier • exercise 1–3 days/week)';
      case 'moderately_active':
        return 'Moderately Active (1.55x multiplier • exercise 3–5 days/week)';
      case 'very_active':
        return 'Very Active (1.725x multiplier • exercise 6–7 days/week)';
      case 'extremely_active':
      case 'extra_active':
        return 'Extremely Active (1.90x multiplier • hard daily training / job)';
      default:
        return level;
    }
  };

  const getGoalInfo = (goal: string, tdeeKcal: number) => {
    switch (goal) {
      case 'maintain_weight':
        return {
          title: 'Maintain Current Weight',
          description: `Your estimated daily maintenance requirement is approximately ${tdeeKcal} kcal/day. Consuming around this amount helps keep your weight stable.`,
          badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
        };
      case 'lose_weight':
        return {
          title: 'Lose Weight (Sustainable Management)',
          description: `Your estimated maintenance energy requirement is ${tdeeKcal} kcal/day. If weight loss is your goal, any caloric adjustment should be determined cautiously and gradually (e.g., a modest 200–300 kcal/day adjustment), avoiding aggressive restriction.`,
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'gain_weight':
        return {
          title: 'Gain Weight / Build Muscle',
          description: `Your estimated maintenance energy requirement is ${tdeeKcal} kcal/day. For weight or muscle gain, an individualized caloric approach should be introduced cautiously alongside progressive resistance exercise and sufficient protein.`,
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'improve_nutrition':
      default:
        return {
          title: 'Improve General Health & Nutrition',
          description: `Your estimated maintenance energy requirement is ${tdeeKcal} kcal/day. Focus on nutrient-dense, balanced Bangladeshi whole foods, adequate dietary fiber, and hydration rather than calorie counting.`,
          badgeBg: 'bg-olive/10 text-olive border-olive/20',
        };
    }
  };

  const getBmiBadgeStyle = (category: string) => {
    switch (category) {
      case 'Underweight':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Normal weight':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Overweight':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Obesity':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const goalDetails = getGoalInfo(profile.goal, metrics.dailyEnergyNeedsKcal);

  // Handle invalid profile state gracefully
  if (!metrics.isValid) {
    return (
      <div className={`bg-amber-50 rounded-3xl border border-amber-200 p-6 space-y-3 ${className}`}>
        <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
          <AlertCircle className="w-5 h-5 text-amber-700" />
          <span>Nutrition Calculation Notice</span>
        </div>
        <p className="text-xs text-amber-800 leading-relaxed">
          Calculations cannot be performed because required health profile values are missing or out of valid bounds (Age must be between 18 and 60 inclusive; height and weight must be positive numbers).
        </p>
        {metrics.validationErrors && (
          <ul className="list-disc list-inside text-xs text-amber-800 space-y-1 pt-1">
            {metrics.validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-clay rounded-3xl border border-warm p-6 sm:p-8 card-shadow space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warm pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fdfcf8] text-olive border border-warm">
              <Zap className="w-3.5 h-3.5 text-olive" /> Automated Calculation Engine
            </span>
          </div>
          <h3 className="serif text-2xl font-bold text-[#2c3333] pt-0.5">
            Personalized Nutrition & Energy Summary
          </h3>
        </div>

        <div className="shrink-0 text-xs text-slate-500 bg-[#fdfcf8] px-3.5 py-2 rounded-2xl border border-warm flex items-center gap-1.5">
          <HeartPulse className="w-4 h-4 text-olive" />
          <span>Mifflin–St Jeor & WHO Standards</span>
        </div>
      </div>

      {/* Primary 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: BMI */}
        <div className="bg-[#fdfcf8] p-5 rounded-2xl border border-warm space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-olive" /> Body Mass Index
              </span>
              <span className="text-[10px] font-bold uppercase text-slate-400">BMI</span>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="serif text-3xl font-extrabold text-[#2c3333]">
                {metrics.bmi.toFixed(1)}
              </span>
            </div>
            <div className="pt-1">
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getBmiBadgeStyle(metrics.bmiCategory)}`}>
                {metrics.bmiCategory}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug pt-2 border-t border-warm/60 italic">
            Screening measure based on height & weight.
          </p>
        </div>

        {/* Card 2: BMR */}
        <div className="bg-[#fdfcf8] p-5 rounded-2xl border border-warm space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-terracotta" /> Basal Metabolic Rate
              </span>
              <span className="text-[10px] font-bold uppercase text-slate-400">BMR</span>
            </div>
            <div className="flex items-baseline gap-1.5 pt-1">
              <span className="serif text-3xl font-extrabold text-[#2c3333]">
                {metrics.bmrKcal}
              </span>
              <span className="text-xs font-bold text-slate-500">kcal/day</span>
            </div>
            <p className="text-xs text-slate-600 font-medium pt-1">
              Minimum energy required at complete rest.
            </p>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug pt-2 border-t border-warm/60">
            Calculated via Mifflin–St Jeor formula.
          </p>
        </div>

        {/* Card 3: Estimated Daily Energy Needs (TDEE) */}
        <div className="bg-[#fdfcf8] p-5 rounded-2xl border border-warm space-y-3 relative overflow-hidden flex flex-col justify-between sm:col-span-2 lg:col-span-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 font-bold text-olive">
                <Activity className="w-4 h-4 text-olive" /> Estimated Daily Energy Needs (TDEE)
              </span>
              <span className="text-[10px] font-bold uppercase bg-olive/10 text-olive px-2 py-0.5 rounded-full border border-olive/20">
                Estimate
              </span>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="serif text-3xl sm:text-4xl font-extrabold text-[#2c3333]">
                {metrics.dailyEnergyNeedsKcal}
              </span>
              <span className="text-sm font-bold text-slate-600">kcal/day</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Estimated energy expenditure incorporating your physical activity level: <strong>{getActivityLabel(profile.activityLevel)}</strong>.
            </p>
          </div>

          <div className="bg-clay p-3 rounded-xl border border-warm flex items-center justify-between text-xs text-slate-600">
            <span>Macro Baseline (50% Carb / 20% Pro / 30% Fat):</span>
            <span className="font-bold text-[#2c3333]">
              {metrics.macros.carbsGrams}g C • {metrics.macros.proteinGrams}g P • {metrics.macros.fatGrams}g F
            </span>
          </div>
        </div>

      </div>

      {/* Summary Profile Parameters Matrix */}
      <div className="bg-[#fdfcf8] rounded-2xl border border-warm p-5 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-olive" /> Profile Input Overview
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
          <div className="bg-clay p-3 rounded-xl border border-warm">
            <span className="text-xs text-slate-500 block">Current Weight</span>
            <span className="font-bold text-[#2c3333]">{profile.weightKg} kg</span>
          </div>
          <div className="bg-clay p-3 rounded-xl border border-warm">
            <span className="text-xs text-slate-500 block">Height</span>
            <span className="font-bold text-[#2c3333]">{profile.heightCm} cm</span>
          </div>
          <div className="bg-clay p-3 rounded-xl border border-warm">
            <span className="text-xs text-slate-500 block">Age & Biological Sex</span>
            <span className="font-bold text-[#2c3333]">{profile.age} yrs • <span className="capitalize">{profile.sex}</span></span>
          </div>
          <div className="bg-clay p-3 rounded-xl border border-warm">
            <span className="text-xs text-slate-500 block">Activity Multiplier</span>
            <span className="font-bold text-[#2c3333]">{VALID_ACTIVITY_MULTIPLIERS[profile.activityLevel] || 1.20}x</span>
          </div>
        </div>
      </div>

      {/* Goal Guidance Card */}
      <div className="bg-[#fdfcf8] p-5 rounded-2xl border border-warm space-y-2.5">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-olive" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Weight Goal & Caloric Guidance</h4>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ml-auto ${goalDetails.badgeBg}`}>
            {goalDetails.title}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          {goalDetails.description}
        </p>
      </div>

      {/* Medical Safety Disclaimer & BMI Screening Notice */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Health Disclaimer & Screening Notice</span>
        </div>
        <p className="leading-relaxed text-amber-800/90">
          {HEALTH_CALCULATION_DISCLAIMER} {BMI_SCREENING_NOTICE}
        </p>
      </div>

    </div>
  );
};

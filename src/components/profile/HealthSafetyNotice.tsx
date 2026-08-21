import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const HealthSafetyNotice: React.FC = () => {
  return (
    <div className="bg-[#faf7f2] border border-[#e6decb] rounded-2xl p-4 sm:p-5 text-slate-700 flex items-start gap-3.5 shadow-xs">
      <div className="p-2 bg-[#f0e6d2] text-[#8c5e38] rounded-xl shrink-0 mt-0.5">
        <ShieldAlert className="w-5 h-5 text-[#8c5e38]" />
      </div>
      <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
        <h4 className="font-semibold text-[#2c3333] text-sm sm:text-base">
          Health & Wellness Guidance Notice
        </h4>
        <p className="text-slate-600">
          The information collected in this Personal Health Profile and any future nutrition calculations are designed purely for general wellness and educational reference. They do not constitute a medical diagnosis, clinical prescription, or personalized dietary advice.
        </p>
        <p className="text-slate-500 text-xs italic pt-0.5">
          Always consult a licensed medical doctor or registered clinical dietitian for specific health conditions, severe food allergies, or medical dietary planning.
        </p>
      </div>
    </div>
  );
};

import React from 'react';
import { AlertTriangle, ShieldCheck, Info } from 'lucide-react';

interface MedicalDisclaimerProps {
  compact?: boolean;
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#faf6f0] border border-warm text-[#2c3333] text-xs leading-relaxed">
        <AlertTriangle className="w-4 h-4 text-[#d67d5c] shrink-0 mt-0.5" />
        <p>
          <strong className="font-semibold text-[#2c3333]">Educational Disclaimer:</strong> Nutri Guide provides general nutritional information and meal planning ideas for healthy adults. It does not provide medical diagnosis or substitute for professional medical care.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#faf6f0] p-6 sm:p-7 border border-warm card-shadow">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="p-3 rounded-2xl bg-clay text-[#d67d5c] shrink-0 border border-warm">
          <ShieldCheck className="w-6 h-6 text-olive" />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="serif font-bold text-[#2c3333] text-lg">Health & Safety Disclaimer</h4>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-clay text-olive border border-warm">
              <Info className="w-3.5 h-3.5 text-olive" /> Non-Diagnostic
            </span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            Nutri Guide is an educational wellness tool designed to assist users in understanding basic nutrition, daily energy needs, and meal planning using foods commonly available in Bangladesh.
          </p>
          <ul className="text-xs text-slate-600 space-y-1 pt-1 list-disc list-inside">
            <li>This application does NOT diagnose, treat, cure, or prevent any disease or medical condition.</li>
            <li>Users with medical conditions, diabetes, hypertension, renal conditions, pregnancy, or eating disorders must consult a qualified physician or registered dietitian before altering their diet.</li>
            <li>AI-generated recommendations provide general educational guidance only and should not be treated as clinical prescriptions.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

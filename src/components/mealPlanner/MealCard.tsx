import React, { useState } from 'react';
import { MealSlot, FoodItem, PersonalHealthProfile } from '../../types';
import { MealSwapModal } from './MealSwapModal';
import { 
  Flame, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  CheckCircle2, 
  EyeOff, 
  Utensils, 
  Sparkles, 
  Info,
  Clock
} from 'lucide-react';

interface MealCardProps {
  slot: MealSlot;
  profile: PersonalHealthProfile;
  onSwapItem: (slotId: string, itemIndex: number, newFood: FoodItem) => void;
  onToggleSkip?: (slotId: string) => void;
  onRegenerateSlot?: (slotId: string) => void;
}

export const MealCard: React.FC<MealCardProps> = ({
  slot,
  profile,
  onSwapItem,
  onToggleSkip,
  onRegenerateSlot,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [swapModalItemIndex, setSwapModalItemIndex] = useState<number | null>(null);

  const isSkipped = slot.skipped ?? false;

  const getMealTimeBadge = (type: string) => {
    switch (type) {
      case 'Breakfast':
        return '8:00 AM – 9:00 AM';
      case 'Morning Snack':
        return '11:00 AM – 11:30 AM';
      case 'Lunch':
        return '1:30 PM – 2:30 PM';
      case 'Afternoon Snack':
        return '5:00 PM – 5:30 PM';
      case 'Dinner':
        return '8:00 PM – 9:00 PM';
      default:
        return 'Flexible Meal';
    }
  };

  return (
    <div 
      className={`bg-[#fdfcf8] rounded-3xl border transition-all duration-200 card-shadow overflow-hidden ${
        isSkipped 
          ? 'border-slate-200 opacity-60 bg-slate-50/50' 
          : 'border-warm hover:border-olive/40'
      }`}
    >
      {/* Slot Header */}
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-olive bg-olive/10 px-3 py-1 rounded-full border border-olive/20 inline-flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-olive" />
              {slot.type}
            </span>

            <span className="text-[11px] font-medium text-slate-500 bg-clay px-2.5 py-0.5 rounded-full border border-warm inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {getMealTimeBadge(slot.type)}
            </span>

            {slot.isOptional && (
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Optional Snack
              </span>
            )}
          </div>

          <h3 className="serif text-xl sm:text-2xl font-bold text-[#2c3333] pt-1">
            {slot.title}
          </h3>
        </div>

        {/* Right side calories & controls */}
        <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0">
          <div className="text-right">
            <div className="flex items-center gap-1 text-terracotta justify-end">
              <Flame className="w-4 h-4 fill-terracotta/20" />
              <span className="serif text-2xl font-extrabold text-[#2c3333]">
                {isSkipped ? 0 : slot.totalCalories}
              </span>
              <span className="text-xs font-bold text-slate-500">kcal</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Target: {slot.targetCalorieRange.min}–{slot.targetCalorieRange.max} kcal
            </p>
          </div>

          <div className="flex items-center gap-1.5 border-l border-warm pl-3">
            {onRegenerateSlot && !isSkipped && (
              <button
                onClick={() => onRegenerateSlot(slot.id)}
                className="p-2 text-slate-500 hover:text-olive bg-clay hover:bg-olive/10 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-olive/20"
                title={`Regenerate ${slot.type}`}
                aria-label={`Regenerate ${slot.type}`}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            {slot.isOptional && onToggleSkip && (
              <button
                onClick={() => onToggleSkip(slot.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer border ${
                  isSkipped
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-clay text-slate-600 border-warm hover:bg-slate-200'
                }`}
                title={isSkipped ? 'Include this snack in plan' : 'Skip optional snack'}
              >
                {isSkipped ? 'Include' : 'Skip Snack'}
              </button>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-slate-500 hover:text-slate-800 bg-clay hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              aria-label={isExpanded ? 'Collapse meal details' : 'Expand meal details'}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Slot Body */}
      {isExpanded && !isSkipped && (
        <div className="p-5 sm:p-6 space-y-5 bg-clay/30">
          
          {/* Macro Breakdown Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-[#fdfcf8] p-2.5 rounded-xl border border-warm flex items-center justify-between">
              <span className="text-slate-500">Protein</span>
              <span className="font-bold text-[#2c3333]">{slot.totalProteinGrams}g</span>
            </div>
            <div className="bg-[#fdfcf8] p-2.5 rounded-xl border border-warm flex items-center justify-between">
              <span className="text-slate-500">Carbs</span>
              <span className="font-bold text-[#2c3333]">{slot.totalCarbsGrams}g</span>
            </div>
            <div className="bg-[#fdfcf8] p-2.5 rounded-xl border border-warm flex items-center justify-between">
              <span className="text-slate-500">Fat</span>
              <span className="font-bold text-[#2c3333]">{slot.totalFatGrams}g</span>
            </div>
            <div className="bg-[#fdfcf8] p-2.5 rounded-xl border border-warm flex items-center justify-between">
              <span className="text-slate-500">Dietary Fiber</span>
              <span className="font-bold text-olive">{slot.totalFiberGrams}g</span>
            </div>
          </div>

          {/* Planned Foods List */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Planned Food Items ({slot.items.length})
            </span>

            <div className="space-y-2.5">
              {slot.items.map((item, idx) => (
                <div 
                  key={`${item.foodItem.id}-${idx}`}
                  className="bg-[#fdfcf8] p-4 rounded-2xl border border-warm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-olive/30 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="serif font-bold text-slate-800 text-base">
                        {item.foodItem.banglaName}
                      </h4>
                      <span className="text-xs font-medium text-slate-500">
                        ({item.foodItem.englishName})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                      <span className="bg-clay px-2.5 py-0.5 rounded-lg border border-warm font-semibold text-slate-700">
                        Portion: {item.servingText}
                      </span>
                      {item.foodItem.preparationMethod && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg text-[11px] font-medium">
                          {item.foodItem.preparationMethod}
                        </span>
                      )}
                    </div>

                    {/* Macro pill breakdown */}
                    <p className="text-[11px] text-slate-500 pt-0.5">
                      {item.proteinGrams}g Protein • {item.carbsGrams}g Carbs • {item.fatGrams}g Fat {item.fiberGrams ? `• ${item.fiberGrams}g Fiber` : ''}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-warm">
                    <span className="text-xs font-bold text-terracotta bg-terracotta/10 px-3 py-1.5 rounded-xl border border-terracotta/20">
                      {item.calories} kcal
                    </span>

                    <button
                      onClick={() => setSwapModalItemIndex(idx)}
                      className="px-3 py-1.5 text-xs font-bold text-olive hover:text-white bg-olive/10 hover:bg-olive rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-olive/20"
                      title="Replace with alternative Bangladeshi food"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Swap Item
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slot Notes / Bangladeshi Context */}
          {slot.notes && (
            <div className="bg-clay p-3.5 rounded-2xl border border-warm text-xs text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-olive shrink-0 mt-0.5" />
              <p className="leading-relaxed">{slot.notes}</p>
            </div>
          )}

        </div>
      )}

      {/* Skipped Message */}
      {isSkipped && (
        <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-100/60">
          This snack has been temporarily skipped. Click "Include" to restore it to your daily totals.
        </div>
      )}

      {/* Swap Modal Dialog */}
      {swapModalItemIndex !== null && slot.items[swapModalItemIndex] && (
        <MealSwapModal
          currentFood={slot.items[swapModalItemIndex].foodItem}
          profile={profile}
          slotType={slot.type}
          existingItems={slot.items.map(i => i.foodItem)}
          onConfirmSwap={(newFood) => {
            onSwapItem(slot.id, swapModalItemIndex, newFood);
            setSwapModalItemIndex(null);
          }}
          onClose={() => setSwapModalItemIndex(null)}
        />
      )}

    </div>
  );
};

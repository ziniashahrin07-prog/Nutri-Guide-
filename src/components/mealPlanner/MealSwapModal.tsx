import React, { useState, useMemo } from 'react';
import { FoodItem, PersonalHealthProfile } from '../../types';
import { getMealSwapAlternatives } from '../../utils/mealPlanner';
import { Search, X, RefreshCw, Check, Flame, AlertTriangle, Filter, Leaf } from 'lucide-react';

interface MealSwapModalProps {
  currentFood: FoodItem;
  profile: PersonalHealthProfile;
  slotType: string;
  existingItems?: FoodItem[];
  onConfirmSwap: (newFood: FoodItem) => void;
  onClose: () => void;
}

export const MealSwapModal: React.FC<MealSwapModalProps> = ({
  currentFood,
  profile,
  slotType,
  existingItems = [],
  onConfirmSwap,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Obtain compatible food alternatives safely
  const alternatives = useMemo(() => {
    return getMealSwapAlternatives(currentFood, profile, slotType as any, existingItems);
  }, [currentFood, profile, slotType, existingItems]);

  // Categories present in alternatives
  const availableCategories = useMemo(() => {
    const cats = new Set(alternatives.map(f => f.category));
    return Array.from(cats);
  }, [alternatives]);

  // Filter alternatives by search and category
  const filteredAlternatives = useMemo(() => {
    return alternatives.filter(food => {
      const matchesCat = selectedCategory === 'All' || food.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCat;

      const matchesQuery = 
        food.englishName.toLowerCase().includes(q) ||
        food.banglaName.includes(q) ||
        food.banglaName.toLowerCase().includes(q) ||
        food.category.toLowerCase().includes(q);

      return matchesCat && matchesQuery;
    });
  }, [alternatives, selectedCategory, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#fdfcf8] rounded-3xl border border-warm shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-warm pb-4 pr-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-olive uppercase tracking-wider bg-olive/10 px-3 py-1 rounded-full border border-olive/20 inline-block">
              Swap Food Item • {slotType}
            </span>
            <h2 className="serif text-xl sm:text-2xl font-bold text-[#2c3333]">
              Replace "{currentFood.banglaName}" ({currentFood.englishName})
            </h2>
            <p className="text-xs text-slate-500">
              Select a safe alternative from the Bangladeshi Food Database matching your dietary preferences and allergy rules.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Item Card */}
        <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Currently Selected</span>
            <p className="font-bold text-slate-800 text-sm">{currentFood.banglaName} <span className="font-normal text-slate-600">({currentFood.englishName})</span></p>
            <p className="text-slate-500">{currentFood.servingSize || '1 portion'} • {currentFood.calories ?? 0} kcal</p>
          </div>
          <span className="text-amber-900 bg-amber-200/80 font-bold px-3 py-1 rounded-full text-xs shrink-0">
            Current
          </span>
        </div>

        {/* Search & Category Bar */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search replacement food in English or বাংলা..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 text-xs sm:text-sm bg-clay border border-warm rounded-2xl focus:outline-none focus:ring-2 focus:ring-olive/20 focus:border-olive transition-all text-[#2c3333]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-olive text-white shadow-xs'
                  : 'bg-clay text-slate-700 border border-warm hover:bg-[#f5f5f0]'
              }`}
            >
              All ({alternatives.length})
            </button>
            {availableCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-olive text-white shadow-xs'
                    : 'bg-clay text-slate-700 border border-warm hover:bg-[#f5f5f0]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Alternatives List */}
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
          {filteredAlternatives.length === 0 ? (
            <div className="text-center py-8 bg-clay rounded-2xl border border-warm space-y-2">
              <p className="text-xs font-semibold text-slate-600">No compatible alternative foods found.</p>
              <p className="text-[11px] text-slate-400">Try clearing search keywords or selecting another category.</p>
            </div>
          ) : (
            filteredAlternatives.map(food => (
              <div
                key={food.id}
                onClick={() => onConfirmSwap(food)}
                className="p-4 rounded-2xl bg-clay hover:bg-white border border-warm hover:border-olive/50 transition-all flex items-center justify-between cursor-pointer group card-shadow hover:shadow-md"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="serif font-bold text-slate-800 text-base group-hover:text-olive transition-colors">
                      {food.banglaName}
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">
                      ({food.englishName})
                    </span>
                    {food.isVegetarian && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Leaf className="w-2.5 h-2.5" /> Veg
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">
                    Category: <strong className="text-slate-700">{food.category}</strong> • Serving: {food.servingSize || '1 portion'}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 pt-0.5">
                    <span>{food.proteinGrams ?? 0}g Protein</span>
                    <span>•</span>
                    <span>{food.carbsGrams ?? 0}g Carbs</span>
                    <span>•</span>
                    <span>{food.fatGrams ?? 0}g Fat</span>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <span className="text-xs font-bold text-terracotta bg-terracotta/10 px-2.5 py-1 rounded-full border border-terracotta/20 inline-flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-terracotta" />
                    {food.calories ?? 0} kcal
                  </span>
                  <button className="block text-xs font-bold text-olive group-hover:underline pt-1 ml-auto">
                    Select & Swap →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end border-t border-warm">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-600 bg-clay hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

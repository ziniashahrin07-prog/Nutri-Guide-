import React, { useState, useMemo } from 'react';
import { BANGLADESH_FOOD_DATABASE, ALL_FOOD_CATEGORIES } from '../../data/bangladeshFoodDatabase';
import { FoodCategory, FoodItem } from '../../types';
import { 
  Search, Utensils, Flame, Leaf, Filter, AlertTriangle, Info, CheckCircle2, 
  X, Check, ChevronRight, Droplets, Heart, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';

interface FoodDatabaseProps {
  onNavigateHome?: () => void;
  isStandalonePage?: boolean;
}

export const FoodDatabase: React.FC<FoodDatabaseProps> = ({ 
  onNavigateHome,
  isStandalonePage = false 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'vegetarian' | 'vegan'>('all');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [showLowOilOnly, setShowLowOilOnly] = useState<boolean>(false);

  // Advanced Bilingual Search and Filtering
  const filteredFoods = useMemo(() => {
    return BANGLADESH_FOOD_DATABASE.filter((food) => {
      // 1. Category Filter
      const matchesCategory = selectedCategory === 'All' || food.category === selectedCategory;

      // 2. Dietary Preference Filter
      let matchesDiet = true;
      if (dietaryFilter === 'vegetarian') {
        matchesDiet = food.isVegetarian === true;
      } else if (dietaryFilter === 'vegan') {
        matchesDiet = food.isVegan === true;
      }

      // 3. Low Oil / Healthy Option Filter
      let matchesOil = true;
      if (showLowOilOnly) {
        matchesOil = food.category !== 'Oils & Fats' && (food.fatGrams === undefined || food.fatGrams <= 8);
      }

      // 4. Bilingual Search Query
      const query = searchQuery.trim().toLowerCase();
      if (!query) {
        return matchesCategory && matchesDiet && matchesOil;
      }

      // Check English & Bangla fields
      const englishMatch = food.englishName.toLowerCase().includes(query);
      const banglaMatch = food.banglaName.includes(query) || food.banglaName.toLowerCase().includes(query);
      const categoryMatch = food.category.toLowerCase().includes(query);
      const prepMatch = food.preparationMethod ? food.preparationMethod.toLowerCase().includes(query) : false;
      const descMatch = food.description ? food.description.toLowerCase().includes(query) : false;

      // Special cross-lingual term maps
      let termMatch = false;
      if (query === 'fish' || query === 'macher' || query === 'মাছ') {
        termMatch = food.category === 'Fish' || food.englishName.toLowerCase().includes('fish') || food.banglaName.includes('মাছ');
      } else if (query === 'rice' || query === 'bhaat' || query === 'ভাত') {
        termMatch = food.category === 'Rice & Grains' || food.englishName.toLowerCase().includes('rice') || food.banglaName.includes('ভাত');
      } else if (query === 'dal' || query === 'lentil' || query === 'ডাল') {
        termMatch = food.category === 'Dal & Legumes' || food.englishName.toLowerCase().includes('dal') || food.banglaName.includes('ডাল');
      } else if (query === 'shak' || query === 'spinach' || query === 'শাক') {
        termMatch = food.category === 'Leafy Vegetables' || food.englishName.toLowerCase().includes('spinach') || food.banglaName.includes('শাক');
      } else if (query === 'egg' || query === 'dim' || query === 'ডিম') {
        termMatch = food.category === 'Eggs' || food.englishName.toLowerCase().includes('egg') || food.banglaName.includes('ডিম');
      }

      const matchesQuery = englishMatch || banglaMatch || categoryMatch || prepMatch || descMatch || termMatch;

      return matchesCategory && matchesDiet && matchesOil && matchesQuery;
    });
  }, [selectedCategory, searchQuery, dietaryFilter, showLowOilOnly]);

  return (
    <div className={`w-full bg-[#fdfcf8] text-[#2c3333] ${isStandalonePage ? 'min-h-screen py-8' : 'py-12'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-clay border border-warm text-olive text-xs font-semibold shadow-xs">
            <Utensils className="w-4 h-4 text-olive" />
            <span>বাংলাদেশ খাদ্য ভাণ্ডার | Bangladesh Food Database</span>
          </div>
          <h1 className="serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2c3333] tracking-tight">
            Authentic Bilingual Nutrition Database
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Comprehensive Bangladeshi food database featuring dual English and বাংলা names, categories, serving units, verified nutritional breakdowns, and preparation guidance.
          </p>
        </div>

        {/* Nutrition Preparation & Accuracy Rule Banner */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-3 text-amber-900 shadow-xs">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
              <span>Preparation & Cooking Method Impact</span>
              <span className="text-[10px] bg-amber-200/80 text-amber-800 font-semibold px-2 py-0.5 rounded-full">Important</span>
            </h4>
            <p className="text-amber-800/90 leading-relaxed">
              Traditional foods vary significantly based on preparation. A vegetable or fish dish cooked with excess mustard oil, ghee, or sugar yields much higher calories than a light broth (jhol) or steam. Always review portion sizes and cooking notes.
            </p>
          </div>
        </div>

        {/* Search, Category & Filter Bar */}
        <div className="bg-clay p-5 sm:p-6 rounded-3xl border border-warm card-shadow space-y-5">
          
          {/* Top Row: Bilingual Search Input + Filter Chips */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search in English or বাংলা (e.g., Rice / ভাত, Lau / লাউ, Fish / মাছ)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 text-xs sm:text-sm bg-[#fdfcf8] border border-warm rounded-2xl focus:outline-none focus:ring-2 focus:ring-olive/20 focus:border-olive transition-all text-[#2c3333]"
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

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Dietary Toggle */}
              <div className="inline-flex p-1 bg-[#fdfcf8] border border-warm rounded-2xl text-xs">
                <button
                  onClick={() => setDietaryFilter('all')}
                  className={`px-3 py-1.5 font-semibold rounded-xl transition-all cursor-pointer ${
                    dietaryFilter === 'all' ? 'bg-olive text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDietaryFilter('vegetarian')}
                  className={`px-3 py-1.5 font-semibold rounded-xl transition-all cursor-pointer ${
                    dietaryFilter === 'vegetarian' ? 'bg-olive text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Vegetarian
                </button>
                <button
                  onClick={() => setDietaryFilter('vegan')}
                  className={`px-3 py-1.5 font-semibold rounded-xl transition-all cursor-pointer ${
                    dietaryFilter === 'vegan' ? 'bg-olive text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Vegan
                </button>
              </div>

              {/* Low Fat / Moderate Oil Toggle */}
              <button
                onClick={() => setShowLowOilOnly(!showLowOilOnly)}
                className={`px-3 py-2 text-xs font-semibold rounded-2xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                  showLowOilOnly 
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs' 
                    : 'bg-[#fdfcf8] text-slate-700 border-warm hover:border-olive'
                }`}
              >
                <Droplets className="w-3.5 h-3.5" />
                <span>Moderate Oil Only</span>
              </button>
            </div>
          </div>

          {/* Categories Tab Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <span>Filter by Category ({ALL_FOOD_CATEGORIES.length} Categories)</span>
              <span>Showing <strong className="text-slate-800">{filteredFoods.length}</strong> items</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-4 py-2 text-xs font-semibold rounded-2xl whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'All'
                    ? 'bg-olive text-white shadow-xs'
                    : 'bg-[#fdfcf8] text-slate-700 border border-warm hover:bg-[#f5f5f0]'
                }`}
              >
                All Categories ({BANGLADESH_FOOD_DATABASE.length})
              </button>

              {ALL_FOOD_CATEGORIES.map((category) => {
                const count = BANGLADESH_FOOD_DATABASE.filter(f => f.category === category).length;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 text-xs font-semibold rounded-2xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedCategory === category
                        ? 'bg-olive text-white shadow-xs'
                        : 'bg-[#fdfcf8] text-slate-700 border border-warm hover:bg-[#f5f5f0]'
                    }`}
                  >
                    <span>{category}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedCategory === category ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Info or Empty State */}
        {filteredFoods.length === 0 ? (
          <div className="bg-clay rounded-3xl border border-warm p-12 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 bg-warm rounded-full flex items-center justify-center mx-auto text-slate-500">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-base">No food items found</h3>
              <p className="text-xs text-slate-500">
                No matching foods for "{searchQuery}" in the selected category. Try clearing filters or searching in English or Bangla.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setDietaryFilter('all');
                setShowLowOilOnly(false);
              }}
              className="px-4 py-2 text-xs font-semibold bg-olive text-white rounded-full hover:bg-[#4a6854] transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset All Search Filters
            </button>
          </div>
        ) : (
          /* Food Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFoods.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedFood(item)}
                className="bg-clay rounded-3xl border border-warm card-shadow hover:shadow-lg hover:border-olive/40 transition-all p-6 flex flex-col justify-between cursor-pointer group"
              >
                <div className="space-y-4">
                  
                  {/* Category & Calories */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-olive uppercase tracking-wider bg-olive/10 px-2.5 py-1 rounded-full border border-olive/20">
                      {item.category}
                    </span>
                    {item.calories !== undefined && (
                      <span className="shrink-0 px-2.5 py-1 rounded-full bg-terracotta/10 border border-terracotta/20 text-[#d67d5c] text-xs font-bold flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-[#d67d5c]" />
                        {item.calories} kcal
                      </span>
                    )}
                  </div>

                  {/* Dual Names (Bangla + English prominently together) */}
                  <div className="space-y-1">
                    <h3 className="serif font-bold text-xl text-[#2c3333] group-hover:text-olive transition-colors leading-tight">
                      {item.banglaName}
                    </h3>
                    <p className="text-sm font-semibold text-slate-600">
                      {item.englishName}
                    </p>
                  </div>

                  {/* Description & Serving Size */}
                  {item.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 bg-[#fdfcf8] px-3.5 py-1.5 rounded-2xl border border-warm">
                    <span>Serving: {item.servingSize || '1 portion'}</span>
                    {item.servingUnit && <span className="text-slate-400">({item.servingUnit})</span>}
                  </div>

                  {/* Macro Distribution */}
                  {(item.proteinGrams !== undefined || item.carbsGrams !== undefined || item.fatGrams !== undefined) && (
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="p-2 rounded-2xl bg-[#fdfcf8] border border-warm">
                        <span className="block text-[10px] text-slate-400 font-medium">Protein</span>
                        <span className="font-bold text-[#2c3333] text-xs">{item.proteinGrams ?? 0}g</span>
                      </div>
                      <div className="p-2 rounded-2xl bg-[#fdfcf8] border border-warm">
                        <span className="block text-[10px] text-slate-400 font-medium">Carbs</span>
                        <span className="font-bold text-[#2c3333] text-xs">{item.carbsGrams ?? 0}g</span>
                      </div>
                      <div className="p-2 rounded-2xl bg-[#fdfcf8] border border-warm">
                        <span className="block text-[10px] text-slate-400 font-medium">Fat</span>
                        <span className="font-bold text-[#2c3333] text-xs">{item.fatGrams ?? 0}g</span>
                      </div>
                    </div>
                  )}

                  {/* Preparation Notes / Method */}
                  {item.preparationMethod && (
                    <p className="text-[11px] text-slate-500 italic bg-amber-50/50 p-2 rounded-xl border border-amber-200/50">
                      <strong className="not-italic text-amber-900 font-semibold">Prep: </strong>
                      {item.preparationMethod}
                    </p>
                  )}
                </div>

                {/* Footer Badges */}
                <div className="pt-4 mt-4 border-t border-warm flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.isVegetarian && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Leaf className="w-2.5 h-2.5" /> Veg
                      </span>
                    )}
                    {item.isVegan && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                        Vegan
                      </span>
                    )}
                    {item.allergies && item.allergies.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                        <AlertTriangle className="w-2.5 h-2.5" /> Allergen
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-bold text-olive group-hover:underline flex items-center gap-0.5">
                    View Details <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Food Detail Modal Drawer */}
        {selectedFood && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#fdfcf8] rounded-3xl border border-warm shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedFood(null)}
                className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="space-y-2 pr-8">
                <span className="text-xs font-bold text-olive uppercase tracking-wider bg-olive/10 px-3 py-1 rounded-full border border-olive/20 inline-block">
                  {selectedFood.category}
                </span>
                <h2 className="serif text-2xl sm:text-3xl font-bold text-[#2c3333]">
                  {selectedFood.banglaName}
                </h2>
                <p className="text-base font-semibold text-slate-600">
                  {selectedFood.englishName}
                </p>
              </div>

              {/* Description */}
              {selectedFood.description && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-clay p-4 rounded-2xl border border-warm">
                  {selectedFood.description}
                </p>
              )}

              {/* Serving & Nutrition Matrix */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Nutritional Information</h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                    <span className="text-[10px] text-amber-800 font-medium block">Energy</span>
                    <span className="text-base font-extrabold text-amber-900">{selectedFood.calories ?? 'N/A'} kcal</span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                    <span className="text-[10px] text-blue-800 font-medium block">Protein</span>
                    <span className="text-base font-extrabold text-blue-900">{selectedFood.proteinGrams ?? 0}g</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 font-medium block">Carbs</span>
                    <span className="text-base font-extrabold text-emerald-900">{selectedFood.carbsGrams ?? 0}g</span>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                    <span className="text-[10px] text-rose-800 font-medium block">Fat</span>
                    <span className="text-base font-extrabold text-rose-900">{selectedFood.fatGrams ?? 0}g</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-clay p-3 rounded-2xl border border-warm">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Serving Size</span>
                    <span className="font-semibold text-slate-800">{selectedFood.servingSize || 'Standard portion'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Serving Unit</span>
                    <span className="font-semibold text-slate-800">{selectedFood.servingUnit || 'Portion'}</span>
                  </div>
                  {selectedFood.fiberGrams !== undefined && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">Dietary Fiber</span>
                      <span className="font-semibold text-slate-800">{selectedFood.fiberGrams}g</span>
                    </div>
                  )}
                  {selectedFood.availability && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">Local Availability</span>
                      <span className="font-semibold text-slate-800">{selectedFood.availability} Availability</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cooking Notes & Nuances */}
              {selectedFood.cookingNotes && (
                <div className="space-y-1 bg-amber-50/80 p-4 rounded-2xl border border-amber-200 text-xs">
                  <span className="font-bold text-amber-900 block flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-amber-700" /> Cooking & Portion Nuances
                  </span>
                  <p className="text-amber-800 leading-relaxed">
                    {selectedFood.cookingNotes}
                  </p>
                </div>
              )}

              {/* Allergens & Tags */}
              <div className="space-y-2 pt-2 border-t border-warm">
                {selectedFood.allergies && selectedFood.allergies.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 p-3 rounded-2xl border border-red-200">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span><strong>Allergy Warning:</strong> Contains {selectedFood.allergies.join(', ')}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                  <span>Vegetarian: <strong className="text-slate-800">{selectedFood.isVegetarian ? 'Yes' : 'No'}</strong></span>
                  <span>Vegan: <strong className="text-slate-800">{selectedFood.isVegan ? 'Yes' : 'No'}</strong></span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedFood(null)}
                  className="px-6 py-2.5 text-xs font-bold bg-olive text-white rounded-full hover:bg-[#4a6854] transition-colors cursor-pointer"
                >
                  Close Item
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

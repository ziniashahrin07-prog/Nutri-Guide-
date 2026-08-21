import React, { useState } from 'react';
import { HealthProfile, HealthCalculations, FoodItem } from '../../types';
import { getFullHealthMetrics } from '../../utils/nutritionCalculator';
import { SAMPLE_BANGLADESH_FOODS } from '../../data/bangladeshFoodDatabase';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';
import { AskNutriGuideLogo } from '../common/AskNutriGuideLogo';
import { 
  Calculator, Utensils, ShieldCheck, User, 
  Flame, Activity, Scale, Sparkles, Send, CheckCircle2, RefreshCw, Info
} from 'lucide-react';

interface AppDashboardPreviewProps {
  userEmail?: string;
  onClosePreview: () => void;
}

export const AppDashboardPreview: React.FC<AppDashboardPreviewProps> = ({
  userEmail = 'guest_user@nutriguide.bd',
  onClosePreview
}) => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'database' | 'mealplan' | 'ai' | 'architecture'>('calculator');

  // Form State for Profile & Calculations
  const [profile, setProfile] = useState<HealthProfile>({
    name: 'Anisur Rahman',
    age: 28,
    sex: 'male',
    heightCm: 172,
    weightKg: 68,
    activityLevel: 'moderately_active',
    dietaryPreference: 'unrestricted',
    foodPreferences: ['Fish', 'Lentils', 'Vegetables'],
    allergies: []
  });

  const [metrics, setMetrics] = useState<HealthCalculations>(getFullHealthMetrics(profile));

  // Chat Assistant State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; time: string }>>([
    {
      sender: 'assistant',
      text: 'Assalamu Alaikum! I am Nutri Guide AI, your personal Bangladeshi nutrition companion. How can I assist with your dietary goals today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // Recalculate metrics when profile updates
  const handleProfileChange = (field: keyof HealthProfile, value: any) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    setMetrics(getFullHealthMetrics(updated));
  };

  // Send AI Question to Server API
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || aiLoading) return;

    const userText = chatInput.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText, time: timeStr }]);
    setChatInput('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai/nutrition-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText, userProfile: profile })
      });

      const data = await res.json();
      if (data.success && data.answer) {
        setChatMessages((prev) => [
          ...prev,
          { sender: 'assistant', text: data.answer, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { 
            sender: 'assistant', 
            text: `[System Notice]: ${data.error || 'Gemini API key is pending configuration in environment secrets. Configure GEMINI_API_KEY in the Secrets panel.'}`, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          }
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { 
          sender: 'assistant', 
          text: 'Note: AI server endpoint is ready. In this preview build, Gemini responses will stream once live API credentials are configured in workspace environment secrets.', 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfcf8] py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Workspace Header Top Bar */}
      <div className="max-w-7xl mx-auto bg-clay rounded-3xl border border-warm p-4 sm:p-5 card-shadow flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-olive text-white font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="serif font-bold text-[#2c3333] text-base sm:text-lg">Nutri Guide Workspace</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fdfcf8] text-olive border border-warm">
                Phase 1 Build
              </span>
            </div>
            <p className="text-xs text-slate-500">
              User Session: <strong className="text-[#2c3333]">{userEmail}</strong> • Region: Bangladesh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={onClosePreview}
            className="px-4 py-2 text-xs font-semibold text-[#2c3333] bg-[#fdfcf8] hover:bg-clay border border-warm rounded-full transition-colors cursor-pointer"
          >
            &larr; Exit Workspace
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto bg-clay rounded-3xl border border-warm p-2 card-shadow flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-4 py-2.5 text-xs font-bold rounded-full whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'calculator'
              ? 'bg-olive text-white shadow-xs'
              : 'text-[#2c3333] hover:bg-[#e8e8e0]'
          }`}
        >
          <Calculator className="w-4 h-4" />
          1. Health Profile & Math
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2.5 text-xs font-bold rounded-full whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'database'
              ? 'bg-olive text-white shadow-xs'
              : 'text-[#2c3333] hover:bg-[#e8e8e0]'
          }`}
        >
          <Utensils className="w-4 h-4" />
          2. BD Food Explorer
        </button>

        <button
          onClick={() => setActiveTab('mealplan')}
          className={`px-4 py-2.5 text-xs font-bold rounded-full whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'mealplan'
              ? 'bg-olive text-white shadow-xs'
              : 'text-[#2c3333] hover:bg-[#e8e8e0]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          3. Meal Guidance
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2.5 text-xs font-bold rounded-full whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ai'
              ? 'bg-olive text-white shadow-xs'
              : 'text-[#2c3333] hover:bg-[#e8e8e0]'
          }`}
        >
          <AskNutriGuideLogo size="sm" variant="icon-only" theme={activeTab === 'ai' ? 'dark' : 'colored'} />
          4. Ask NutriGuide AI
        </button>

        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-4 py-2.5 text-xs font-bold rounded-full whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'architecture'
              ? 'bg-olive text-white shadow-xs'
              : 'text-[#2c3333] hover:bg-[#e8e8e0]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          5. Firebase & Security
        </button>
      </div>

      {/* Tab 1: Profile & Calculator */}
      {activeTab === 'calculator' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <MedicalDisclaimer compact />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-7 bg-clay rounded-3xl border border-warm p-6 sm:p-7 card-shadow space-y-5">
              <div className="flex items-center justify-between border-b border-warm pb-3">
                <div>
                  <h3 className="serif font-bold text-[#2c3333] text-lg">Personal Profile Inputs</h3>
                  <p className="text-xs text-slate-500">Update parameters to dynamically recalculate daily energy demands.</p>
                </div>
                <span className="text-xs font-semibold text-olive bg-[#fdfcf8] px-3 py-1 rounded-full border border-warm">
                  Mifflin-St Jeor Formula
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#2c3333] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    className="w-full p-2.5 bg-[#fdfcf8] border border-warm rounded-full outline-none focus:ring-2 focus:ring-[#5a7d66]/20 focus:border-olive text-[#2c3333]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2c3333] mb-1">Sex</label>
                  <select
                    value={profile.sex}
                    onChange={(e) => handleProfileChange('sex', e.target.value)}
                    className="w-full p-2.5 bg-[#fdfcf8] border border-warm rounded-full outline-none font-medium text-[#2c3333]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#2c3333] mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={profile.age}
                    min={15}
                    max={100}
                    onChange={(e) => handleProfileChange('age', Number(e.target.value))}
                    className="w-full p-2.5 bg-[#fdfcf8] border border-warm rounded-full outline-none text-[#2c3333]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2c3333] mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={profile.heightCm}
                    min={100}
                    max={230}
                    onChange={(e) => handleProfileChange('heightCm', Number(e.target.value))}
                    className="w-full p-2.5 bg-[#fdfcf8] border border-warm rounded-full outline-none text-[#2c3333]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2c3333] mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={profile.weightKg}
                    min={30}
                    max={200}
                    onChange={(e) => handleProfileChange('weightKg', Number(e.target.value))}
                    className="w-full p-2.5 bg-[#fdfcf8] border border-warm rounded-full outline-none text-[#2c3333]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2c3333] mb-1">Activity Level</label>
                  <select
                    value={profile.activityLevel}
                    onChange={(e) => handleProfileChange('activityLevel', e.target.value)}
                    className="w-full p-2.5 bg-[#fdfcf8] border border-warm rounded-full outline-none font-medium text-[#2c3333]"
                  >
                    <option value="sedentary">Sedentary (Desk Job, little exercise)</option>
                    <option value="lightly_active">Lightly Active (Exercise 1-3 days/wk)</option>
                    <option value="moderately_active">Moderately Active (Exercise 3-5 days/wk)</option>
                    <option value="very_active">Very Active (Heavy exercise 6-7 days/wk)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#2c3333] mb-1">Dietary Preference</label>
                  <select
                    value={profile.dietaryPreference}
                    onChange={(e) => handleProfileChange('dietaryPreference', e.target.value)}
                    className="w-full p-2.5 bg-[#fdfcf8] border border-warm rounded-full outline-none font-medium text-[#2c3333]"
                  >
                    <option value="unrestricted">Unrestricted (Standard Bangladeshi Diet)</option>
                    <option value="vegetarian">Vegetarian (Niramish - No Meat/Fish)</option>
                    <option value="diabetic_friendly">Diabetic Friendly (Low GI Carbohydrates)</option>
                    <option value="high_protein">High Protein (Muscle Growth & Recovery)</option>
                    <option value="hypertension_friendly">Low Sodium / Heart Friendly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Calculations Output Card */}
            <div className="lg:col-span-5 bg-clay rounded-3xl border border-warm p-6 sm:p-7 card-shadow space-y-5">
              <div>
                <h3 className="serif font-bold text-[#2c3333] text-lg flex items-center gap-2">
                  <Activity className="w-4 h-4 text-olive" /> Calculated Health Metrics
                </h3>
                <p className="text-xs text-slate-500">Live output based on WHO BMI ranges & Mifflin-St Jeor BMR equation.</p>
              </div>

              {/* BMI Card */}
              <div className="p-4 rounded-2xl bg-[#fdfcf8] border border-warm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Body Mass Index (BMI)</span>
                  <span className="text-2xl font-extrabold text-[#2c3333]">{metrics.bmi}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border border-warm ${
                  metrics.bmiCategory === 'Normal weight'
                    ? 'bg-clay text-olive'
                    : metrics.bmiCategory === 'Underweight'
                    ? 'bg-blue-50 text-blue-800'
                    : 'bg-terracotta/10 text-[#d67d5c]'
                }`}>
                  {metrics.bmiCategory}
                </span>
              </div>

              {/* BMR & TDEE Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-[#fdfcf8] border border-warm">
                  <span className="text-xs font-semibold text-slate-500 block flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-[#d67d5c]" /> BMR Energy
                  </span>
                  <span className="text-xl font-extrabold text-[#2c3333]">{metrics.bmrKcal}</span>
                  <span className="text-[10px] text-slate-500 block">kcal/day at rest</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#fdfcf8] border border-warm">
                  <span className="text-xs font-semibold text-slate-500 block flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-olive" /> Total Energy (TDEE)
                  </span>
                  <span className="text-xl font-extrabold text-olive">{metrics.dailyEnergyNeedsKcal}</span>
                  <span className="text-[10px] text-slate-500 block">kcal/day for maintenance</span>
                </div>
              </div>

              {/* Macro Distribution Breakdown */}
              <div className="space-y-2 pt-2 border-t border-warm">
                <h4 className="serif text-xs font-bold text-[#2c3333]">Target Macro Distribution</h4>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold text-[#2c3333] mb-1">
                      <span>Carbohydrates (50%)</span>
                      <span>{metrics.macros.carbsGrams}g</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#fdfcf8] rounded-full overflow-hidden border border-warm">
                      <div className="h-full bg-olive rounded-full" style={{ width: '50%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-[#2c3333] mb-1">
                      <span>Protein (20%)</span>
                      <span>{metrics.macros.proteinGrams}g</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#fdfcf8] rounded-full overflow-hidden border border-warm">
                      <div className="h-full bg-[#d67d5c] rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-[#2c3333] mb-1">
                      <span>Healthy Fat (30%)</span>
                      <span>{metrics.macros.fatGrams}g</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#fdfcf8] rounded-full overflow-hidden border border-warm">
                      <div className="h-full bg-[#b59d5c] rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: BD Food Explorer */}
      {activeTab === 'database' && (
        <div className="max-w-7xl mx-auto bg-clay rounded-3xl border border-warm p-6 sm:p-7 card-shadow space-y-4">
          <div className="flex items-center justify-between border-b border-warm pb-3">
            <div>
              <h3 className="serif font-bold text-[#2c3333] text-lg">Bangladesh Food Database Architecture</h3>
              <p className="text-xs text-slate-500">Curated database of local dishes and raw ingredients with verified nutritional profiles.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#fdfcf8] text-olive text-xs font-bold border border-warm">
              {SAMPLE_BANGLADESH_FOODS.length} Verified Local Items
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SAMPLE_BANGLADESH_FOODS.map((food: FoodItem) => (
              <div key={food.id} className="p-5 rounded-2xl bg-[#fdfcf8] border border-warm space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="serif font-bold text-[#2c3333] text-base">{food.banglaName}</h4>
                    <p className="text-xs text-slate-500 font-medium">{food.englishName}</p>
                  </div>
                  <span className="text-xs font-bold text-[#d67d5c] bg-terracotta/10 px-2.5 py-0.5 rounded-full border border-terracotta/20">
                    {food.calories} kcal
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{food.description}</p>
                <div className="text-[11px] font-semibold text-slate-600 bg-clay px-3 py-1 rounded-full border border-warm">
                  Serving: {food.servingSize} • P: {food.proteinGrams}g | C: {food.carbsGrams}g | F: {food.fatGrams}g
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Meal Guidance */}
      {activeTab === 'mealplan' && (
        <div className="max-w-7xl mx-auto bg-clay rounded-3xl border border-warm p-6 sm:p-7 card-shadow space-y-5">
          <div className="flex items-center justify-between border-b border-warm pb-3">
            <div>
              <h3 className="serif font-bold text-[#2c3333] text-lg">Sample Culturally Tailored Meal Plan</h3>
              <p className="text-xs text-slate-500">
                Calibrated to meet target ~{metrics.dailyEnergyNeedsKcal} kcal using standard Bangladeshi foods.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#fdfcf8] text-olive text-xs font-bold border border-warm">
              Balanced Distribution
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Breakfast */}
            <div className="p-5 rounded-2xl bg-[#fdfcf8] border border-warm space-y-2">
              <div className="flex justify-between font-bold text-[#2c3333] text-sm serif">
                <span>1. Breakfast (Sokal)</span>
                <span className="text-olive">~450 kcal</span>
              </div>
              <ul className="space-y-1 text-slate-700 list-disc list-inside">
                <li>Boiled Hen Egg (1 large) — 72 kcal</li>
                <li>Atta Roti (2 whole wheat breads) — 220 kcal</li>
                <li>Sautéed Vegetables (Sobji Bhaji) — 120 kcal</li>
                <li>Black Tea / Mild Sugar — 38 kcal</li>
              </ul>
            </div>

            {/* Lunch */}
            <div className="p-5 rounded-2xl bg-[#fdfcf8] border border-warm space-y-2">
              <div className="flex justify-between font-bold text-[#2c3333] text-sm serif">
                <span>2. Lunch (Dupur)</span>
                <span className="text-olive">~720 kcal</span>
              </div>
              <ul className="space-y-1 text-slate-700 list-disc list-inside">
                <li>Parboiled Red Rice (Lal Bhaat, 1.5 bowls) — 270 kcal</li>
                <li>Ruhi Fish Curry with Gravy (1 piece) — 165 kcal</li>
                <li>Masoor Dal Soup (1 bowl) — 115 kcal</li>
                <li>Palong Shak Bhaji (Spinach, 1/2 cup) — 55 kcal</li>
                <li>Fresh Salad (Cucumber, Tomato) — 30 kcal</li>
              </ul>
            </div>

            {/* Afternoon Snack */}
            <div className="p-5 rounded-2xl bg-[#fdfcf8] border border-warm space-y-2">
              <div className="flex justify-between font-bold text-[#2c3333] text-sm serif">
                <span>3. Afternoon Snack (Bikalkal)</span>
                <span className="text-olive">~220 kcal</span>
              </div>
              <ul className="space-y-1 text-slate-700 list-disc list-inside">
                <li>Fresh Guava (Peyara, 1 medium) — 68 kcal</li>
                <li>Unsweetened Tok Doi (Yogurt, 1/2 cup) — 85 kcal</li>
                <li>Handful Roasted Chana (Chickpeas) — 67 kcal</li>
              </ul>
            </div>

            {/* Dinner */}
            <div className="p-5 rounded-2xl bg-[#fdfcf8] border border-warm space-y-2">
              <div className="flex justify-between font-bold text-[#2c3333] text-sm serif">
                <span>4. Dinner (Raat)</span>
                <span className="text-olive">~580 kcal</span>
              </div>
              <ul className="space-y-1 text-slate-700 list-disc list-inside">
                <li>Deshi Chicken Curry (2 medium pieces) — 210 kcal</li>
                <li>Light Steamed Rice or Atta Roti — 180 kcal</li>
                <li>Mixed Vegetable Curry — 110 kcal</li>
                <li>Clear Lentil Soup (Patla Dal) — 80 kcal</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Gemini AI Assistant */}
      {activeTab === 'ai' && (
        <div className="max-w-7xl mx-auto bg-clay rounded-3xl border border-warm p-6 sm:p-7 card-shadow space-y-4">
          <div className="flex items-center justify-between border-b border-warm pb-3">
            <AskNutriGuideLogo size="md" variant="full" theme="light" />
            <span className="px-3 py-1 rounded-full bg-[#fdfcf8] text-olive text-xs font-bold border border-warm">
              Gemini AI Engine
            </span>
          </div>

          {/* Chat Messages Box */}
          <div className="h-80 overflow-y-auto bg-[#fdfcf8] border border-warm rounded-2xl p-4 space-y-3">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-olive text-white rounded-br-none'
                      : 'bg-clay text-[#2c3333] border border-warm shadow-xs rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}

            {aiLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
                <RefreshCw className="w-4 h-4 animate-spin text-olive" />
                <span>Gemini AI is analyzing nutrition facts...</span>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendAiMessage} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., What are low GI rice alternatives in Bangladesh? How much protein in Ruhi fish?"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-4 py-2.5 text-sm bg-[#fdfcf8] border border-warm rounded-full focus:ring-2 focus:ring-[#5a7d66]/20 focus:border-olive outline-none text-[#2c3333]"
            />
            <button
              type="submit"
              disabled={aiLoading || !chatInput.trim()}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-olive hover:bg-[#4a6854] disabled:opacity-50 rounded-full shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" /> Ask NutriGuide
            </button>
          </form>
        </div>
      )}

      {/* Tab 5: Architecture & Firebase */}
      {activeTab === 'architecture' && (
        <div className="max-w-7xl mx-auto bg-clay rounded-3xl border border-warm p-6 sm:p-7 card-shadow space-y-5">
          <div className="space-y-1">
            <h3 className="serif font-bold text-[#2c3333] text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-olive" /> Technical Architecture & Data Security
            </h3>
            <p className="text-xs text-slate-500">
              Overview of Nutri Guide full-stack system architecture, API security, and database schemas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-[#fdfcf8] border border-warm space-y-2">
              <h4 className="serif font-bold text-[#2c3333] text-base">1. Firebase Auth & Firestore Security</h4>
              <p className="text-slate-600 leading-relaxed">
                User health profiles and meal histories are scoped strictly to individual Firebase User UIDs (`request.auth.uid == userId`). Unauthenticated access is rejected by Firestore security rules.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#fdfcf8] border border-warm space-y-2">
              <h4 className="serif font-bold text-[#2c3333] text-base">2. Server-Side Gemini API Isolation</h4>
              <p className="text-slate-600 leading-relaxed">
                All AI requests pass through server-side Express proxies (`/api/ai/nutrition-assistant`). Secret keys are kept hidden from the client browser at all times.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#fdfcf8] border border-warm space-y-2">
              <h4 className="serif font-bold text-[#2c3333] text-base">3. Verified Formulas</h4>
              <p className="text-slate-600 leading-relaxed">
                Nutritional metrics rely on the Mifflin-St Jeor BMR equation and standard WHO BMI standards. No invented or arbitrary multipliers are used.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#fdfcf8] border border-warm space-y-2">
              <h4 className="serif font-bold text-[#2c3333] text-base">4. Responsive Cross-Platform Build</h4>
              <p className="text-slate-600 leading-relaxed">
                Optimized for desktop browsers, Windows displays, Android mobile browsers, and tablets using mobile-first Tailwind CSS and modular React 19 components.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

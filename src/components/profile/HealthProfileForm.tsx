import React, { useState } from 'react';
import { 
  User, 
  Ruler, 
  Weight, 
  Activity, 
  Utensils, 
  AlertCircle, 
  Plus, 
  X, 
  Check, 
  Target, 
  Info,
  ShieldCheck
} from 'lucide-react';
import { PersonalHealthProfile, Sex, ActivityLevel, DietaryPreference, HealthGoal } from '../../types';

interface HealthProfileFormProps {
  initialData?: PersonalHealthProfile | null;
  onSave: (profile: PersonalHealthProfile) => void;
  onCancel?: () => void;
}

interface ValidationErrors {
  name?: string;
  age?: string;
  sex?: string;
  heightCm?: string;
  weightKg?: string;
  activityLevel?: string;
  dietaryPreference?: string;
  goal?: string;
}

const COMMON_ALLERGIES = ['Peanuts', 'Dairy / Lactose', 'Gluten', 'Shellfish', 'Eggs', 'Soy', 'Tree Nuts', 'Mustard'];
const COMMON_RESTRICTIONS = ['Low Sodium', 'Diabetic Friendly', 'Low Fat', 'High Protein', 'Halal', 'Low Carb'];
const COMMON_DISLIKED_SUGGESTIONS = ['Bitter Gourd (Korola)', 'Eggplant (Begun)', 'Raw Onion', 'Okra (Dherosh)', 'Cilantro'];

export const HealthProfileForm: React.FC<HealthProfileFormProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [age, setAge] = useState<string>(initialData?.age ? String(initialData.age) : '');
  const [sex, setSex] = useState<Sex>(initialData?.sex || 'female');
  const [heightCm, setHeightCm] = useState<string>(initialData?.heightCm ? String(initialData.heightCm) : '');
  const [weightKg, setWeightKg] = useState<string>(initialData?.weightKg ? String(initialData.weightKg) : '');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(initialData?.activityLevel || 'moderately_active');
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>(initialData?.dietaryPreference || 'no_preference');
  const [goal, setGoal] = useState<HealthGoal>(initialData?.goal || 'maintain_weight');

  const [allergies, setAllergies] = useState<string[]>(initialData?.allergies || []);
  const [newAllergyInput, setNewAllergyInput] = useState('');

  const [dislikedFoods, setDislikedFoods] = useState<string[]>(initialData?.dislikedFoods || []);
  const [newDislikedInput, setNewDislikedInput] = useState('');

  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(initialData?.dietaryRestrictions || []);
  const [newRestrictionInput, setNewRestrictionInput] = useState('');

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formTouched, setFormTouched] = useState(false);

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters.';
    }

    // Age validation
    const ageNum = Number(age);
    if (!age || age.trim() === '' || isNaN(ageNum)) {
      newErrors.age = 'Age is required and must be a valid number.';
    } else if (!Number.isInteger(ageNum) || age.includes('.') || age.includes(',')) {
      newErrors.age = 'Age must be a whole number (no decimals).';
    } else if (ageNum < 18 || ageNum > 60) {
      newErrors.age = 'Age must be between 18 and 60 years old.';
    }

    // Height validation
    const heightNum = Number(heightCm);
    if (!heightCm || isNaN(heightNum)) {
      newErrors.heightCm = 'Height is required.';
    } else if (heightNum < 50 || heightNum > 250) {
      newErrors.heightCm = 'Please enter a realistic height between 50 cm and 250 cm.';
    }

    // Weight validation
    const weightNum = Number(weightKg);
    if (!weightKg || isNaN(weightNum)) {
      newErrors.weightKg = 'Weight is required.';
    } else if (weightNum < 15 || weightNum > 300) {
      newErrors.weightKg = 'Please enter a realistic weight between 15 kg and 300 kg.';
    }

    if (!sex || (sex !== 'male' && sex !== 'female')) {
      newErrors.sex = 'Please select either Male or Female.';
    }

    if (!activityLevel) {
      newErrors.activityLevel = 'Please select your activity level.';
    }

    if (!dietaryPreference) {
      newErrors.dietaryPreference = 'Please select a dietary preference.';
    }

    if (!goal) {
      newErrors.goal = 'Please select your primary health goal.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormTouched(true);

    if (!validate()) {
      // Scroll to top of form smoothly to show errors
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    const now = new Date().toISOString();
    const updatedProfile: PersonalHealthProfile = {
      name: name.trim(),
      age: Math.round(Number(age)),
      sex,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      activityLevel,
      dietaryPreference,
      allergies: allergies || [],
      dislikedFoods: dislikedFoods || [],
      dietaryRestrictions: dietaryRestrictions || [],
      goal,
      createdAt: initialData?.createdAt || now,
      updatedAt: now,
    };

    onSave(updatedProfile);
  };

  // Helper toggle functions for arrays
  const toggleArrayItem = (list: string[], setList: (items: string[]) => void, item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    if (list.includes(trimmed)) {
      setList(list.filter((i) => i !== trimmed));
    } else {
      setList([...list, trimmed]);
    }
  };

  const addCustomArrayItem = (
    list: string[],
    setList: (items: string[]) => void,
    inputVal: string,
    setInputVal: (v: string) => void
  ) => {
    const trimmed = inputVal.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
      setInputVal('');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* Validation Error Banner */}
      {formTouched && Object.keys(errors).length > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm">
            <p className="font-semibold text-red-900">Please correct the missing or invalid fields below:</p>
            <ul className="list-disc list-inside space-y-0.5 text-red-700">
              {Object.values(errors).map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Section 1: Basic Information */}
      <div className="bg-clay rounded-3xl border border-warm p-6 sm:p-8 space-y-6 card-shadow">
        <div className="flex items-center gap-3 border-b border-warm pb-4">
          <div className="p-2.5 rounded-2xl bg-[#fdfcf8] text-olive border border-warm shadow-xs">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="serif text-lg font-bold text-[#2c3333]">1. Basic Profile</h3>
            <p className="text-xs text-slate-600">Your personal details for personalized energy and nutrition estimates.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="profile-name" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              placeholder="e.g. Nusrat Jahan"
              className={`w-full px-4 py-3 text-sm rounded-2xl bg-[#fdfcf8] border ${
                errors.name ? 'border-red-500 focus:ring-red-400' : 'border-warm focus:border-olive'
              } focus:outline-none focus:ring-2 focus:ring-olive/20 transition-all text-[#2c3333]`}
            />
            {errors.name && <p className="text-xs text-red-600 font-medium">{errors.name}</p>}
          </div>

          {/* Age */}
          <div className="space-y-1.5">
            <label htmlFor="profile-age" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Age (Years) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="profile-age"
                type="number"
                min="18"
                max="60"
                step="1"
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  if (errors.age) setErrors({ ...errors, age: undefined });
                }}
                onKeyDown={(e) => {
                  if (['.', ',', 'e', 'E', '-'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                placeholder="e.g. 28"
                className={`w-full px-4 py-3 text-sm rounded-2xl bg-[#fdfcf8] border ${
                  errors.age ? 'border-red-500 focus:ring-red-400' : 'border-warm focus:border-olive'
                } focus:outline-none focus:ring-2 focus:ring-olive/20 transition-all text-[#2c3333]`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 pointer-events-none">
                years
              </span>
            </div>
            {errors.age ? (
              <p className="text-xs text-red-600 font-medium">{errors.age}</p>
            ) : (
              <p className="text-[11px] text-slate-500">Must be a whole number between 18 and 60 years old.</p>
            )}
          </div>

          {/* Sex */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Biological Sex <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 pt-0.5">
              {[
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setSex(item.value as Sex);
                    if (errors.sex) setErrors({ ...errors, sex: undefined });
                  }}
                  className={`py-3 px-4 text-xs font-semibold rounded-2xl border transition-all cursor-pointer text-center ${
                    sex === item.value
                      ? 'bg-olive text-white border-olive shadow-xs'
                      : 'bg-[#fdfcf8] text-slate-700 border-warm hover:border-olive/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {errors.sex && <p className="text-xs text-red-600 font-medium">{errors.sex}</p>}
          </div>
        </div>
      </div>

      {/* Section 2: Body Measurements */}
      <div className="bg-clay rounded-3xl border border-warm p-6 sm:p-8 space-y-6 card-shadow">
        <div className="flex items-center gap-3 border-b border-warm pb-4">
          <div className="p-2.5 rounded-2xl bg-[#fdfcf8] text-olive border border-warm shadow-xs">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <h3 className="serif text-lg font-bold text-[#2c3333]">2. Body Measurements</h3>
            <p className="text-xs text-slate-600">Metric measurements used for calculating BMI and energy needs.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Height in CM */}
          <div className="space-y-1.5">
            <label htmlFor="profile-height" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Height (Centimeters) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="profile-height"
                type="number"
                step="0.1"
                min="50"
                max="250"
                value={heightCm}
                onChange={(e) => {
                  setHeightCm(e.target.value);
                  if (errors.heightCm) setErrors({ ...errors, heightCm: undefined });
                }}
                placeholder="e.g. 165"
                className={`w-full px-4 py-3 text-sm rounded-2xl bg-[#fdfcf8] border ${
                  errors.heightCm ? 'border-red-500 focus:ring-red-400' : 'border-warm focus:border-olive'
                } focus:outline-none focus:ring-2 focus:ring-olive/20 transition-all text-[#2c3333]`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
                cm
              </span>
            </div>
            {errors.heightCm ? (
              <p className="text-xs text-red-600 font-medium">{errors.heightCm}</p>
            ) : (
              <p className="text-[11px] text-slate-500">Height in centimeters (e.g., 5 ft 5 in ≈ 165 cm).</p>
            )}
          </div>

          {/* Weight in KG */}
          <div className="space-y-1.5">
            <label htmlFor="profile-weight" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Weight (Kilograms) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="profile-weight"
                type="number"
                step="0.1"
                min="15"
                max="300"
                value={weightKg}
                onChange={(e) => {
                  setWeightKg(e.target.value);
                  if (errors.weightKg) setErrors({ ...errors, weightKg: undefined });
                }}
                placeholder="e.g. 62"
                className={`w-full px-4 py-3 text-sm rounded-2xl bg-[#fdfcf8] border ${
                  errors.weightKg ? 'border-red-500 focus:ring-red-400' : 'border-warm focus:border-olive'
                } focus:outline-none focus:ring-2 focus:ring-olive/20 transition-all text-[#2c3333]`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
                kg
              </span>
            </div>
            {errors.weightKg ? (
              <p className="text-xs text-red-600 font-medium">{errors.weightKg}</p>
            ) : (
              <p className="text-[11px] text-slate-500">Current weight in kilograms (e.g., 62 kg).</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Lifestyle & Activity Level */}
      <div className="bg-clay rounded-3xl border border-warm p-6 sm:p-8 space-y-6 card-shadow">
        <div className="flex items-center gap-3 border-b border-warm pb-4">
          <div className="p-2.5 rounded-2xl bg-[#fdfcf8] text-olive border border-warm shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="serif text-lg font-bold text-[#2c3333]">3. Lifestyle & Physical Activity</h3>
            <p className="text-xs text-slate-600">Select your typical weekly activity level to estimate total daily energy expenditure.</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            {
              id: 'sedentary',
              label: 'Sedentary',
              desc: 'Little or no exercise; desk job or mostly sitting throughout the day.',
            },
            {
              id: 'lightly_active',
              label: 'Lightly Active',
              desc: 'Light exercise or active walking 1–3 days per week.',
            },
            {
              id: 'moderately_active',
              label: 'Moderately Active',
              desc: 'Moderate exercise or sports 3–5 days per week.',
            },
            {
              id: 'very_active',
              label: 'Very Active',
              desc: 'Heavy physical exercise or training 6–7 days per week.',
            },
            {
              id: 'extremely_active',
              label: 'Extremely Active',
              desc: 'Very intense physical job or daily twice-a-day athletic training.',
            },
          ].map((item) => (
            <label
              key={item.id}
              onClick={() => {
                setActivityLevel(item.id as ActivityLevel);
                if (errors.activityLevel) setErrors({ ...errors, activityLevel: undefined });
              }}
              className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                activityLevel === item.id
                  ? 'bg-[#fdfcf8] border-olive ring-2 ring-olive/20 shadow-xs'
                  : 'bg-[#fdfcf8]/60 border-warm hover:border-olive/40'
              }`}
            >
              <input
                type="radio"
                name="activityLevel"
                checked={activityLevel === item.id}
                onChange={() => setActivityLevel(item.id as ActivityLevel)}
                className="mt-1 accent-olive w-4 h-4"
              />
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-[#2c3333] block">{item.label}</span>
                <span className="text-xs text-slate-600 block">{item.desc}</span>
              </div>
            </label>
          ))}
          {errors.activityLevel && <p className="text-xs text-red-600 font-medium">{errors.activityLevel}</p>}
        </div>
      </div>

      {/* Section 4: Dietary Information & Preferences */}
      <div className="bg-clay rounded-3xl border border-warm p-6 sm:p-8 space-y-6 card-shadow">
        <div className="flex items-center gap-3 border-b border-warm pb-4">
          <div className="p-2.5 rounded-2xl bg-[#fdfcf8] text-olive border border-warm shadow-xs">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h3 className="serif text-lg font-bold text-[#2c3333]">4. Dietary Preferences & Intolerances</h3>
            <p className="text-xs text-slate-600">Customize meal preferences, allergies, and ingredient dislikes.</p>
          </div>
        </div>

        {/* Dietary Preference Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Dietary Preference <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'no_preference', label: 'No Specific Preference', desc: 'Standard varied diet' },
              { id: 'vegetarian', label: 'Vegetarian', desc: 'Plant-based with dairy & eggs' },
              { id: 'vegan', label: 'Vegan', desc: 'Strictly plant-based' },
              { id: 'other', label: 'Other', desc: 'Custom dietary routine' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDietaryPreference(item.id as DietaryPreference)}
                className={`p-3.5 text-left rounded-2xl border transition-all cursor-pointer ${
                  dietaryPreference === item.id
                    ? 'bg-olive text-white border-olive shadow-xs'
                    : 'bg-[#fdfcf8] text-[#2c3333] border-warm hover:border-olive/40'
                }`}
              >
                <span className="text-xs font-bold block">{item.label}</span>
                <span className={`text-[11px] block mt-0.5 ${dietaryPreference === item.id ? 'text-[#e5e2d9]' : 'text-slate-500'}`}>
                  {item.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Food Allergies / Intolerances */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Food Allergies & Intolerances
          </label>
          <p className="text-xs text-slate-500">Select any known food allergies to filter recommendations.</p>
          
          <div className="flex flex-wrap gap-2">
            {COMMON_ALLERGIES.map((item) => {
              const selected = allergies.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleArrayItem(allergies, setAllergies, item)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    selected
                      ? 'bg-red-700 text-white border-red-700 shadow-xs'
                      : 'bg-[#fdfcf8] text-slate-700 border-warm hover:border-red-300'
                  }`}
                >
                  {selected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-slate-400" />}
                  {item}
                </button>
              );
            })}
          </div>

          {/* Custom Allergy Input */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newAllergyInput}
              onChange={(e) => setNewAllergyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomArrayItem(allergies, setAllergies, newAllergyInput, setNewAllergyInput);
                }
              }}
              placeholder="Add other allergy (e.g. Pineapple, Sesame)..."
              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-[#fdfcf8] border border-warm focus:border-olive focus:outline-none text-[#2c3333]"
            />
            <button
              type="button"
              onClick={() => addCustomArrayItem(allergies, setAllergies, newAllergyInput, setNewAllergyInput)}
              className="px-3.5 py-2 text-xs font-semibold bg-olive text-white rounded-xl hover:bg-[#4a6854] cursor-pointer"
            >
              Add
            </button>
          </div>

          {/* Render Active Allergies Tags */}
          {allergies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {allergies.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => toggleArrayItem(allergies, setAllergies, item)}
                    className="hover:text-red-950 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Disliked Foods */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Foods You Dislike / Prefer to Avoid
          </label>
          <p className="text-xs text-slate-500">Ingredients or dishes you dislike taste-wise or prefer to avoid.</p>

          <div className="flex flex-wrap gap-2">
            {COMMON_DISLIKED_SUGGESTIONS.map((item) => {
              const selected = dislikedFoods.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleArrayItem(dislikedFoods, setDislikedFoods, item)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    selected
                      ? 'bg-[#d67d5c] text-white border-[#d67d5c] shadow-xs'
                      : 'bg-[#fdfcf8] text-slate-700 border-warm hover:border-[#d67d5c]/50'
                  }`}
                >
                  {selected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-slate-400" />}
                  {item}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newDislikedInput}
              onChange={(e) => setNewDislikedInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomArrayItem(dislikedFoods, setDislikedFoods, newDislikedInput, setNewDislikedInput);
                }
              }}
              placeholder="Add disliked food (e.g. Raw Garlic, Liver)..."
              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-[#fdfcf8] border border-warm focus:border-olive focus:outline-none text-[#2c3333]"
            />
            <button
              type="button"
              onClick={() => addCustomArrayItem(dislikedFoods, setDislikedFoods, newDislikedInput, setNewDislikedInput)}
              className="px-3.5 py-2 text-xs font-semibold bg-olive text-white rounded-xl hover:bg-[#4a6854] cursor-pointer"
            >
              Add
            </button>
          </div>

          {dislikedFoods.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {dislikedFoods.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#f3e3da] text-[#8c482d] border border-[#e8ccbc]"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => toggleArrayItem(dislikedFoods, setDislikedFoods, item)}
                    className="hover:text-black cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Optional Dietary Restrictions */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Dietary Restrictions / Guidelines
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_RESTRICTIONS.map((item) => {
              const selected = dietaryRestrictions.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleArrayItem(dietaryRestrictions, setDietaryRestrictions, item)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    selected
                      ? 'bg-olive text-white border-olive shadow-xs'
                      : 'bg-[#fdfcf8] text-slate-700 border-warm hover:border-olive/50'
                  }`}
                >
                  {selected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-slate-400" />}
                  {item}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newRestrictionInput}
              onChange={(e) => setNewRestrictionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomArrayItem(dietaryRestrictions, setDietaryRestrictions, newRestrictionInput, setNewRestrictionInput);
                }
              }}
              placeholder="Add other restriction (e.g. Low Potassium, Renal friendly)..."
              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-[#fdfcf8] border border-warm focus:border-olive focus:outline-none text-[#2c3333]"
            />
            <button
              type="button"
              onClick={() => addCustomArrayItem(dietaryRestrictions, setDietaryRestrictions, newRestrictionInput, setNewRestrictionInput)}
              className="px-3.5 py-2 text-xs font-semibold bg-olive text-white rounded-xl hover:bg-[#4a6854] cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Section 5: Primary Health Goal */}
      <div className="bg-clay rounded-3xl border border-warm p-6 sm:p-8 space-y-6 card-shadow">
        <div className="flex items-center gap-3 border-b border-warm pb-4">
          <div className="p-2.5 rounded-2xl bg-[#fdfcf8] text-olive border border-warm shadow-xs">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="serif text-lg font-bold text-[#2c3333]">5. Primary Health Goal</h3>
            <p className="text-xs text-slate-600">Choose your main goal for nutrition planning.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              id: 'maintain_weight',
              title: 'Maintain Current Weight',
              desc: 'Keep energy intake balanced with current daily expenditure.',
            },
            {
              id: 'lose_weight',
              title: 'Lose Weight',
              desc: 'Gentle caloric reduction for sustainable fat loss.',
            },
            {
              id: 'gain_weight',
              title: 'Gain Weight / Build Muscle',
              desc: 'Structured caloric surplus with optimal protein intake.',
            },
            {
              id: 'improve_nutrition',
              title: 'Improve General Health',
              desc: 'Focus on balanced macros, vitamins, and traditional whole foods.',
            },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setGoal(item.id as HealthGoal);
                if (errors.goal) setErrors({ ...errors, goal: undefined });
              }}
              className={`p-4 text-left rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                goal === item.id
                  ? 'bg-olive text-white border-olive shadow-xs'
                  : 'bg-[#fdfcf8] text-[#2c3333] border-warm hover:border-olive/40'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                  goal === item.id ? 'border-white bg-white/20' : 'border-slate-400'
                }`}
              >
                {goal === item.id && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div>
                <span className="text-xs font-bold block">{item.title}</span>
                <span className={`text-[11px] block mt-0.5 ${goal === item.id ? 'text-[#e5e2d9]' : 'text-slate-500'}`}>
                  {item.desc}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Form Submission Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-slate-700 bg-[#fdfcf8] hover:bg-clay border border-warm rounded-full transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="w-full sm:w-auto px-8 py-3 text-sm font-semibold text-white bg-olive hover:bg-[#4a6854] rounded-full shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          Save Health Profile
        </button>
      </div>
    </form>
  );
};

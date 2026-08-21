import { HealthProfile, PersonalHealthProfile, HealthCalculations, Sex, ActivityLevel } from '../types';

/**
 * Standard Safety & Medical Disclaimers
 */
export const HEALTH_CALCULATION_DISCLAIMER = 
  'These calculations are estimates for general wellness and nutrition planning. They are not a medical diagnosis or a substitute for professional medical advice.';

export const BMI_SCREENING_NOTICE = 
  'BMI is a screening measure and is not a medical diagnosis.';

export const VALID_ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.20,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.90,
  extra_active: 1.90,
};

export interface ProfileValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates whether a profile meets all criteria for accurate nutrition calculations:
 * - height > 0
 * - weight > 0
 * - age between 18 and 60 inclusive
 * - valid sex selection ('male' | 'female')
 * - valid activity level
 */
export function validateProfileForCalculations(
  profile?: Partial<PersonalHealthProfile> | Partial<HealthProfile> | null
): ProfileValidationResult {
  const errors: string[] = [];

  if (!profile) {
    return { isValid: false, errors: ['Health profile is required.'] };
  }

  // Weight validation
  if (profile.weightKg === undefined || profile.weightKg === null || isNaN(profile.weightKg) || profile.weightKg <= 0) {
    errors.push('Weight must be a positive number (weightKg > 0).');
  }

  // Height validation
  if (profile.heightCm === undefined || profile.heightCm === null || isNaN(profile.heightCm) || profile.heightCm <= 0) {
    errors.push('Height must be a positive number (heightCm > 0).');
  }

  // Age validation: between 18 and 60 inclusive
  if (
    profile.age === undefined ||
    profile.age === null ||
    isNaN(profile.age) ||
    !Number.isInteger(profile.age) ||
    profile.age < 18 ||
    profile.age > 60
  ) {
    errors.push('Age must be a whole number between 18 and 60 years inclusive.');
  }

  // Sex validation
  if (!profile.sex || (profile.sex !== 'male' && profile.sex !== 'female')) {
    errors.push('Biological sex must be selected as either "male" or "female".');
  }

  // Activity level validation
  if (!profile.activityLevel || !(profile.activityLevel in VALID_ACTIVITY_MULTIPLIERS)) {
    errors.push('A valid activity level must be selected.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 1. BMI Calculation
 * Formula: BMI = weight (kg) / height (m)^2
 * Standard Adult Categories:
 * - Underweight: < 18.5
 * - Normal weight: 18.5–24.9
 * - Overweight: 25.0–29.9
 * - Obesity: ≥ 30.0
 * Internal precision kept intact, rounded to 1 decimal place for display.
 */
export function calculateBMI(
  weightKg: number, 
  heightCm: number
): { bmiRaw: number; bmi: number; category: HealthCalculations['bmiCategory'] } {
  if (!weightKg || !heightCm || heightCm <= 0 || weightKg <= 0) {
    return { bmiRaw: 0, bmi: 0, category: 'Normal weight' };
  }

  const heightMeters = heightCm / 100;
  const bmiRaw = weightKg / (heightMeters * heightMeters);
  const bmi = Number(bmiRaw.toFixed(1));

  let category: HealthCalculations['bmiCategory'] = 'Normal weight';
  if (bmi < 18.5) {
    category = 'Underweight';
  } else if (bmi >= 18.5 && bmi <= 24.9) {
    category = 'Normal weight';
  } else if (bmi >= 25.0 && bmi <= 29.9) {
    category = 'Overweight';
  } else {
    category = 'Obesity';
  }

  return { bmiRaw, bmi, category };
}

/**
 * 2. BMR Calculation (Mifflin-St Jeor Equation)
 * Males:   BMR = (10 × weightKg) + (6.25 × heightCm) - (5 × age) + 5
 * Females: BMR = (10 × weightKg) + (6.25 × heightCm) - (5 × age) - 161
 * Returns both unrounded raw value for internal TDEE accuracy and rounded integer for display (kcal/day).
 */
export function calculateBMR(
  weightKg: number, 
  heightCm: number, 
  age: number, 
  sex: Sex
): { bmrRaw: number; bmrKcal: number } {
  if (!weightKg || !heightCm || !age || (sex !== 'male' && sex !== 'female')) {
    return { bmrRaw: 0, bmrKcal: 0 };
  }

  const baseBmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  const sexConstant = sex === 'male' ? 5 : -161;
  const bmrRaw = baseBmr + sexConstant;
  const bmrKcal = Math.round(bmrRaw);

  return { bmrRaw, bmrKcal };
}

/**
 * 3. ESTIMATED DAILY ENERGY NEEDS (TDEE)
 * Formula: TDEE = BMR × Activity Multiplier
 * Multipliers:
 * - Sedentary: 1.20
 * - Lightly active: 1.375
 * - Moderately active: 1.55
 * - Very active: 1.725
 * - Extremely active: 1.90
 * Uses unrounded BMR for full mathematical accuracy, rounded to nearest whole kcal/day for display.
 */
export function calculateTDEE(
  bmr: number, 
  activityLevel: ActivityLevel
): number {
  const multiplier = VALID_ACTIVITY_MULTIPLIERS[activityLevel] || 1.20;
  return Math.round(bmr * multiplier);
}

/**
 * 4. Macro Distribution (Balanced 50/20/30 baseline)
 */
export function calculateMacroDistribution(dailyCalories: number) {
  if (!dailyCalories || dailyCalories <= 0) {
    return { carbsGrams: 0, proteinGrams: 0, fatGrams: 0 };
  }

  const carbCalories = dailyCalories * 0.50;
  const proteinCalories = dailyCalories * 0.20;
  const fatCalories = dailyCalories * 0.30;

  return {
    carbsGrams: Math.round(carbCalories / 4), // 4 kcal per g of carbohydrate
    proteinGrams: Math.round(proteinCalories / 4), // 4 kcal per g of protein
    fatGrams: Math.round(fatCalories / 9), // 9 kcal per g of fat
  };
}

/**
 * 5. Full Health Metrics Engine
 * Validates required inputs before performing calculations.
 * Internal calculations remain at full precision until final display rounding.
 */
export function getFullHealthMetrics(
  profile?: Partial<PersonalHealthProfile> | Partial<HealthProfile> | null
): HealthCalculations {
  const validation = validateProfileForCalculations(profile);

  if (!validation.isValid || !profile) {
    return {
      bmi: 0,
      bmiCategory: 'Normal weight',
      bmrKcal: 0,
      dailyEnergyNeedsKcal: 0,
      macros: { carbsGrams: 0, proteinGrams: 0, fatGrams: 0 },
      isValid: false,
      validationErrors: validation.errors,
    };
  }

  const { bmi, category } = calculateBMI(profile.weightKg!, profile.heightCm!);
  const { bmrRaw, bmrKcal } = calculateBMR(profile.weightKg!, profile.heightCm!, profile.age!, profile.sex!);
  const dailyEnergyNeedsKcal = calculateTDEE(bmrRaw, profile.activityLevel!);
  const macros = calculateMacroDistribution(dailyEnergyNeedsKcal);

  return {
    bmi,
    bmiCategory: category,
    bmrKcal,
    dailyEnergyNeedsKcal,
    macros,
    isValid: true,
  };
}

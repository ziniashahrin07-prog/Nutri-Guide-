import { 
  calculateBMI, 
  calculateBMR, 
  calculateTDEE, 
  validateProfileForCalculations, 
  getFullHealthMetrics 
} from './nutritionCalculator';
import { PersonalHealthProfile } from '../types';

console.log('====================================================');
console.log('   NUTRITION CALCULATION ENGINE - VERIFICATION TEST');
console.log('====================================================\n');

let failedTests = 0;

function assertEqual(testName: string, actual: any, expected: any) {
  if (actual === expected) {
    console.log(`[PASS] ${testName}: ${actual}`);
  } else {
    console.error(`[FAIL] ${testName}: Expected ${expected}, got ${actual}`);
    failedTests++;
  }
}

// -----------------------------------------------------------------
// TEST CASE 1: Male Profile (Moderately Active)
// Age: 30, Sex: male, Height: 175cm, Weight: 75kg, Activity: moderately_active (1.55)
// -----------------------------------------------------------------
console.log('--- TEST CASE 1: Male Profile (30yo, Male, 175cm, 75kg, Moderately Active) ---');
const maleProfile: PersonalHealthProfile = {
  name: 'Anisur Rahman',
  age: 30,
  sex: 'male',
  heightCm: 175,
  weightKg: 75,
  activityLevel: 'moderately_active',
  dietaryPreference: 'no_preference',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'maintain_weight',
};

// Math verification:
// BMI = 75 / (1.75)^2 = 75 / 3.0625 = 24.48979... -> display 24.5 (Normal weight)
// BMR = (10 * 75) + (6.25 * 175) - (5 * 30) + 5 = 750 + 1093.75 - 150 + 5 = 1698.75 -> round 1699 kcal
// TDEE = 1698.75 * 1.55 = 2633.0625 -> round 2633 kcal

const validation1 = validateProfileForCalculations(maleProfile);
assertEqual('Test 1 Profile Validation', validation1.isValid, true);

const bmi1 = calculateBMI(maleProfile.weightKg, maleProfile.heightCm);
assertEqual('Test 1 BMI Display Value', bmi1.bmi, 24.5);
assertEqual('Test 1 BMI Category', bmi1.category, 'Normal weight');

const bmr1 = calculateBMR(maleProfile.weightKg, maleProfile.heightCm, maleProfile.age, maleProfile.sex);
assertEqual('Test 1 BMR Display Value', bmr1.bmrKcal, 1699);

const tdee1 = calculateTDEE(bmr1.bmrRaw, maleProfile.activityLevel);
assertEqual('Test 1 TDEE Display Value', tdee1, 2633);

const metrics1 = getFullHealthMetrics(maleProfile);
assertEqual('Test 1 Metrics BMI', metrics1.bmi, 24.5);
assertEqual('Test 1 Metrics BMR', metrics1.bmrKcal, 1699);
assertEqual('Test 1 Metrics TDEE', metrics1.dailyEnergyNeedsKcal, 2633);


// -----------------------------------------------------------------
// TEST CASE 2: Female Profile (Sedentary)
// Age: 25, Sex: female, Height: 160cm, Weight: 58kg, Activity: sedentary (1.20)
// -----------------------------------------------------------------
console.log('\n--- TEST CASE 2: Female Profile (25yo, Female, 160cm, 58kg, Sedentary) ---');
const femaleProfile1: PersonalHealthProfile = {
  name: 'Nusrat Jahan',
  age: 25,
  sex: 'female',
  heightCm: 160,
  weightKg: 58,
  activityLevel: 'sedentary',
  dietaryPreference: 'vegetarian',
  allergies: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  goal: 'lose_weight',
};

// Math verification:
// BMI = 58 / (1.60)^2 = 58 / 2.56 = 22.65625 -> display 22.7 (Normal weight)
// BMR = (10 * 58) + (6.25 * 160) - (5 * 25) - 161 = 580 + 1000 - 125 - 161 = 1294 -> round 1294 kcal
// TDEE = 1294 * 1.20 = 1552.8 -> round 1553 kcal

const validation2 = validateProfileForCalculations(femaleProfile1);
assertEqual('Test 2 Profile Validation', validation2.isValid, true);

const bmi2 = calculateBMI(femaleProfile1.weightKg, femaleProfile1.heightCm);
assertEqual('Test 2 BMI Display Value', bmi2.bmi, 22.7);
assertEqual('Test 2 BMI Category', bmi2.category, 'Normal weight');

const bmr2 = calculateBMR(femaleProfile1.weightKg, femaleProfile1.heightCm, femaleProfile1.age, femaleProfile1.sex);
assertEqual('Test 2 BMR Display Value', bmr2.bmrKcal, 1294);

const tdee2 = calculateTDEE(bmr2.bmrRaw, femaleProfile1.activityLevel);
assertEqual('Test 2 TDEE Display Value', tdee2, 1553);


// -----------------------------------------------------------------
// TEST CASE 3: Female Profile (Obesity & Very Active)
// Age: 45, Sex: female, Height: 155cm, Weight: 85kg, Activity: very_active (1.725)
// -----------------------------------------------------------------
console.log('\n--- TEST CASE 3: Female Profile (45yo, Female, 155cm, 85kg, Very Active) ---');
const femaleProfile2: PersonalHealthProfile = {
  name: 'Shirin Akter',
  age: 45,
  sex: 'female',
  heightCm: 155,
  weightKg: 85,
  activityLevel: 'very_active',
  dietaryPreference: 'no_preference',
  allergies: ['Peanuts'],
  dislikedFoods: [],
  dietaryRestrictions: ['Low Sodium'],
  goal: 'improve_nutrition',
};

// Math verification:
// BMI = 85 / (1.55)^2 = 85 / 2.4025 = 35.3798... -> display 35.4 (Obesity)
// BMR = (10 * 85) + (6.25 * 155) - (5 * 45) - 161 = 850 + 968.75 - 225 - 161 = 1432.75 -> round 1433 kcal
// TDEE = 1432.75 * 1.725 = 2471.49375 -> round 2471 kcal

const validation3 = validateProfileForCalculations(femaleProfile2);
assertEqual('Test 3 Profile Validation', validation3.isValid, true);

const bmi3 = calculateBMI(femaleProfile2.weightKg, femaleProfile2.heightCm);
assertEqual('Test 3 BMI Display Value', bmi3.bmi, 35.4);
assertEqual('Test 3 BMI Category', bmi3.category, 'Obesity');

const bmr3 = calculateBMR(femaleProfile2.weightKg, femaleProfile2.heightCm, femaleProfile2.age, femaleProfile2.sex);
assertEqual('Test 3 BMR Display Value', bmr3.bmrKcal, 1433);

const tdee3 = calculateTDEE(bmr3.bmrRaw, femaleProfile2.activityLevel);
assertEqual('Test 3 TDEE Display Value', tdee3, 2471);


// -----------------------------------------------------------------
// TEST CASE 4: Invalid Profiles (Out-of-range inputs)
// -----------------------------------------------------------------
console.log('\n--- TEST CASE 4: Invalid Profiles Validation ---');

// Age < 18
const youngProfile = { ...maleProfile, age: 17 };
const valYoung = validateProfileForCalculations(youngProfile);
assertEqual('Age < 18 invalid check', valYoung.isValid, false);

// Age > 60
const oldProfile = { ...maleProfile, age: 61 };
const valOld = validateProfileForCalculations(oldProfile);
assertEqual('Age > 60 invalid check', valOld.isValid, false);

// Weight <= 0
const zeroWeightProfile = { ...maleProfile, weightKg: 0 };
const valZeroWeight = validateProfileForCalculations(zeroWeightProfile);
assertEqual('Weight <= 0 invalid check', valZeroWeight.isValid, false);

// Height <= 0
const zeroHeightProfile = { ...maleProfile, heightCm: -10 };
const valZeroHeight = validateProfileForCalculations(zeroHeightProfile);
assertEqual('Height <= 0 invalid check', valZeroHeight.isValid, false);

// Metric output for invalid profile
const invalidMetrics = getFullHealthMetrics(youngProfile);
assertEqual('Invalid metrics returns isValid = false', invalidMetrics.isValid, false);
assertEqual('Invalid metrics returns BMI = 0', invalidMetrics.bmi, 0);

console.log('\n====================================================');
if (failedTests === 0) {
  console.log('   ALL TEST CASES PASSED SUCCESSFULLY (0 FAILURES)');
} else {
  console.error(`   TEST SUITE FAILED WITH ${failedTests} FAILURE(S)`);
}
console.log('====================================================\n');

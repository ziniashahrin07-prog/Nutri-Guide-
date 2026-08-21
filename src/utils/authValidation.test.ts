import { validateSignUpFields } from './authValidation';

console.log('===========================================================');
console.log('   AUTHENTICATION SIGN UP VALIDATION ENGINE TEST');
console.log('===========================================================');

let passCount = 0;
let failCount = 0;

function assertTest(description: string, condition: boolean, extraMsg: string = '') {
  if (condition) {
    passCount++;
    console.log(`[PASS] ${description} ${extraMsg ? `(${extraMsg})` : ''}`);
  } else {
    failCount++;
    console.error(`[FAIL] ${description} ${extraMsg ? `(${extraMsg})` : ''}`);
  }
}

// 1. Identical passwords -> validation passes
const test1 = validateSignUpFields('Anisur Rahman', 'anisur@example.com', 'Pass1234!', 'Pass1234!');
assertTest('Test 1: Identical passwords validation passes', test1.isValid === true && test1.error === null);

// 2. Different passwords -> validation fails
const test2 = validateSignUpFields('Anisur Rahman', 'anisur@example.com', 'Pass1234!', 'DifferentPass1234!');
assertTest(
  'Test 2: Different passwords validation fails with exact error message',
  test2.isValid === false && test2.error === 'Passwords do not match. Please verify your password.',
  `Error: "${test2.error}"`
);

// 3. Password shorter than minimum (e.g. 5 chars) -> password length error
const test3 = validateSignUpFields('Anisur Rahman', 'anisur@example.com', '12345', '12345');
assertTest(
  'Test 3: Short password (<6 chars) triggers length error',
  test3.isValid === false && test3.error === 'Password must be at least 6 characters long.',
  `Error: "${test3.error}"`
);

// 4. Valid matching passwords -> validation passes
const test4 = validateSignUpFields('Rahim Uddin', 'rahim@example.com', 'SecureP@ss2026', 'SecureP@ss2026');
assertTest('Test 4: Valid matching passwords allow registration attempt', test4.isValid === true && test4.error === null);

// 5. Confirm password field is empty -> validation fails
const test5 = validateSignUpFields('Anisur Rahman', 'anisur@example.com', 'Pass1234!', '');
assertTest(
  'Test 5: Empty confirm-password field fails validation',
  test5.isValid === false && test5.error === 'Passwords do not match. Please verify your password.',
  `Error: "${test5.error}"`
);

// 6. Password containing leading/trailing spaces and special characters -> exact comparison preserved
const complexPass = '  P@$$w0rd with Sp@c3s!  ';
const test6a = validateSignUpFields('Anisur Rahman', 'anisur@example.com', complexPass, complexPass);
assertTest(
  'Test 6a: Password with spaces & special characters passes when matching exactly',
  test6a.isValid === true && test6a.error === null
);

// Mismatched spaces in special character password must fail
const test6b = validateSignUpFields('Anisur Rahman', 'anisur@example.com', complexPass, complexPass.trim());
assertTest(
  'Test 6b: Spaces are not trimmed or altered; mismatch in spacing fails validation',
  test6b.isValid === false && test6b.error === 'Passwords do not match. Please verify your password.'
);

console.log('===========================================================');
console.log(`   VALIDATION TESTS COMPLETED: ${passCount} PASSED, ${failCount} FAILED`);
console.log('===========================================================\n');

if (failCount > 0) {
  process.exit(1);
}

import { sanitizeForFirestore } from './firestoreSanitize';

console.log('=== RUNNING FIRESTORE SANITIZE TESTS ===');

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`[PASS] ${msg}`);
    passed++;
  } else {
    console.error(`[FAIL] ${msg}`);
    failed++;
  }
}

// 1. Plain object with undefined field
const objWithUndefined = {
  name: 'Test User',
  createdAt: undefined,
  age: 30,
  allergies: ['Peanuts'],
};

const sanitized1 = sanitizeForFirestore(objWithUndefined);
assert(!('createdAt' in sanitized1), 'undefined property createdAt is removed');
assert(sanitized1.name === 'Test User', 'defined string property name is preserved');
assert(sanitized1.age === 30, 'defined number property age is preserved');
assert(Array.isArray(sanitized1.allergies) && sanitized1.allergies[0] === 'Peanuts', 'array property is preserved');

// 2. Nested object with undefined fields
const nestedObj = {
  uid: 'user_123',
  healthProfile: {
    name: 'Amina',
    age: 40,
    createdAt: undefined,
    updatedAt: undefined,
    nested: {
      deepUndefined: undefined,
      deepValid: 'hello'
    }
  }
};

const sanitized2 = sanitizeForFirestore(nestedObj);
assert(!('createdAt' in sanitized2.healthProfile), 'nested createdAt undefined is removed');
assert(!('updatedAt' in sanitized2.healthProfile), 'nested updatedAt undefined is removed');
assert(!('deepUndefined' in sanitized2.healthProfile.nested), 'deeply nested undefined is removed');
assert(sanitized2.healthProfile.nested.deepValid === 'hello', 'deeply nested valid property is preserved');

// 3. Array containing undefined values
const arrayWithUndefined = [1, undefined, 2, 'three', undefined];
const sanitized3 = sanitizeForFirestore(arrayWithUndefined);
assert(Array.isArray(sanitized3) && sanitized3.length === 3, 'undefined elements removed from array');
assert(sanitized3[0] === 1 && sanitized3[1] === 2 && sanitized3[2] === 'three', 'valid array elements preserved');

console.log(`=== FIRESTORE SANITIZE TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);

if (failed > 0) {
  process.exit(1);
}

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  deleteUser
} from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfigJson);
const auth = getAuth(app);

async function runAuthRegressionSuite() {
  console.log("=================================================");
  console.log("   NUTRI GUIDE AUTHENTICATION REGRESSION TEST    ");
  console.log("=================================================");

  const timestamp = Date.now();
  const rawEmail = `  NutriTest_${timestamp}@Example.COM  `;
  const normalizedEmail = `nutritest_${timestamp}@example.com`;
  const complexPassword = " P@ss W0rd_#99! "; // Includes leading, internal, trailing spaces and special chars

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // Test A: Create account with normalized email & exact complex password
    console.log("\n1. Testing Account Creation (Exact Password with Spaces & Special Chars)...");
    const signUpResult = await createUserWithEmailAndPassword(
      auth, 
      rawEmail.trim().toLowerCase(), 
      complexPassword
    );
    assert(
      Boolean(signUpResult.user && signUpResult.user.uid), 
      `Account created successfully for UID: ${signUpResult.user?.uid}`
    );

    // Initial Sign Out
    await signOut(auth);
    assert(auth.currentUser === null, "User successfully signed out post-creation");

    // Test B: First Sign In with exact password and casing variation
    console.log("\n2. Testing 1st Sign-In Cycle...");
    const signIn1 = await signInWithEmailAndPassword(
      auth, 
      rawEmail.trim().toLowerCase(), 
      complexPassword
    );
    assert(
      signIn1.user.uid === signUpResult.user.uid, 
      "1st Sign-In succeeded with exact UID match"
    );

    await signOut(auth);
    assert(auth.currentUser === null, "Signed out after 1st sign-in");

    // Test C: Second Sign In with uppercase/padded email input variation
    console.log("\n3. Testing 2nd Sign-In Cycle (Email Normalization Validation)...");
    const signIn2 = await signInWithEmailAndPassword(
      auth, 
      (`  NUTRITEST_${timestamp}@EXAMPLE.COM  `).trim().toLowerCase(), 
      complexPassword
    );
    assert(
      signIn2.user.uid === signUpResult.user.uid, 
      "2nd Sign-In succeeded with email normalization"
    );

    await signOut(auth);
    assert(auth.currentUser === null, "Signed out after 2nd sign-in");

    // Test D: Invalid Password Rejection
    console.log("\n4. Testing Wrong Password Rejection...");
    let wrongPassCaught = false;
    try {
      await signInWithEmailAndPassword(
        auth, 
        normalizedEmail, 
        "WrongPassword123!"
      );
    } catch (err: any) {
      wrongPassCaught = true;
      assert(
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password', 
        `Correctly rejected wrong password with error code: ${err.code}`
      );
    }
    assert(wrongPassCaught, "Wrong password attempt was caught");

    // Test E: Immediate recovery with correct password after failed attempt
    console.log("\n5. Testing Immediate Recovery with Correct Password after Failure...");
    const signIn3 = await signInWithEmailAndPassword(
      auth, 
      normalizedEmail, 
      complexPassword
    );
    assert(
      signIn3.user.uid === signUpResult.user.uid, 
      "Recovery sign-in succeeded after invalid attempt"
    );

    await signOut(auth);

    // Test F: Third Sign In Cycle (Repeated Auth Stability)
    console.log("\n6. Testing 3rd Sign-In Cycle...");
    const signIn4 = await signInWithEmailAndPassword(
      auth, 
      normalizedEmail, 
      complexPassword
    );
    assert(
      signIn4.user.uid === signUpResult.user.uid, 
      "3rd Sign-In succeeded stably"
    );

    // Test G: Nonexistent user rejection
    console.log("\n7. Testing Nonexistent User Rejection...");
    let nonexistentCaught = false;
    try {
      await signInWithEmailAndPassword(
        auth, 
        `nonexistent_${timestamp}@example.com`, 
        complexPassword
      );
    } catch (err: any) {
      nonexistentCaught = true;
      assert(
        err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found',
        `Correctly rejected nonexistent account with error code: ${err.code}`
      );
    }
    assert(nonexistentCaught, "Nonexistent user attempt was caught");

    // Cleanup created test user
    console.log("\n8. Cleaning up test user...");
    if (auth.currentUser) {
      await deleteUser(auth.currentUser);
      console.log("Test account deleted from Firebase Auth.");
    } else {
      const signInToClean = await signInWithEmailAndPassword(auth, normalizedEmail, complexPassword);
      await deleteUser(signInToClean.user);
      console.log("Test account re-authenticated and deleted.");
    }

  } catch (err: any) {
    console.error("UNEXPECTED AUTH TEST FAILURE:", err);
    failed++;
  }

  console.log("\n=================================================");
  console.log(`AUTH REGRESSION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthRegressionSuite();

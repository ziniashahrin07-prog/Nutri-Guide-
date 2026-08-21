import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import firebaseConfigJson from './firebase-applet-config.json';

const app = initializeApp(firebaseConfigJson);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfigJson.firestoreDatabaseId);

async function testAuthContextFlow() {
  const name = 'Anisur Rahman';
  const email = `test_user_${Date.now()}@example.com`;
  const pass = 'MySecretPass123!';

  console.log('--- REPLICATING EXACT AUTHCONTEXT SIGN-UP & SIGN-IN FLOW ---');
  console.log('Project ID:', auth.app.options.projectId);
  console.log('Email:', email);

  try {
    // 1. Sign Up (Exact code from AuthContext.tsx)
    console.log('Step 1: Calling createUserWithEmailAndPassword...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const createdUser = userCredential.user;
    console.log('Created User UID:', createdUser.uid);

    console.log('Step 2: Calling updateProfile...');
    await updateProfile(createdUser, { displayName: name });
    console.log('Updated displayName.');

    console.log('Step 3: Creating Firestore document...');
    const userRef = doc(db, 'users', createdUser.uid);
    await setDoc(userRef, {
      uid: createdUser.uid,
      name,
      email,
      createdAt: new Date().toISOString()
    });
    console.log('Firestore document written.');

    // 2. Sign Out
    console.log('Step 4: Calling firebaseSignOut...');
    await signOut(auth);
    console.log('Signed out.');

    // 3. Sign In
    console.log('Step 5: Calling signInWithEmailAndPassword...');
    const signInCred = await signInWithEmailAndPassword(auth, email, pass);
    console.log('Signed in successfully! UID:', signInCred.user.uid);

    // 4. Sign Out again
    await signOut(auth);
    console.log('Step 6: Signed out again.');

    // 5. Test invalid password
    console.log('Step 7: Testing intentionally invalid password...');
    try {
      await signInWithEmailAndPassword(auth, email, 'WrongPassword999!');
      console.error('ERROR: Invalid password was incorrectly accepted!');
    } catch (invalidErr: any) {
      console.log('Successfully rejected invalid password! Error code:', invalidErr?.code);
    }

    console.log('ALL STEPS PASSED PERFECTLY!');
  } catch (err: any) {
    console.error('FAILED IN FLOW:', err);
  }
}

testAuthContextFlow();

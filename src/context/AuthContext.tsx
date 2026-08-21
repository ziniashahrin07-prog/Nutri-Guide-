import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { PersonalHealthProfile } from '../types';
import { saveLocalProfile, clearSavedMealPlan, clearLocalProfile, isValidHealthProfile } from '../utils/profileStorage';
import { sanitizeForFirestore } from '../utils/firestoreSanitize';

export interface UserProfileData {
  uid: string;
  name: string;
  email: string;
  createdAt: string;
  role?: 'user' | 'admin';
  healthProfile?: PersonalHealthProfile;
}

interface AuthContextType {
  user: User | null;
  userData: UserProfileData | null;
  loading: boolean;
  signUp: (name: string, email: string, pass: string) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch Firestore user document
  const fetchUserData = async (uid: string, fallbackEmail: string, fallbackName?: string) => {
    if (!db) {
      setUserData({
        uid,
        name: fallbackName || 'Nutri Guide User',
        email: fallbackEmail,
        createdAt: new Date().toISOString()
      });
      return;
    }
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfileData;
        if (data.healthProfile && isValidHealthProfile(data.healthProfile)) {
          saveLocalProfile(data.healthProfile, uid);
          setUserData(data);
        } else {
          const sanitizedData: UserProfileData = {
            ...data,
            healthProfile: undefined
          };
          clearLocalProfile(uid);
          clearSavedMealPlan(uid);
          setUserData(sanitizedData);
        }
      } else {
        // Fallback user data if document doesn't exist
        const fallbackData: UserProfileData = {
          uid,
          name: fallbackName || 'Nutri Guide User',
          email: fallbackEmail,
          createdAt: new Date().toISOString()
        };
        clearLocalProfile(uid);
        clearSavedMealPlan(uid);
        setUserData(fallbackData);
      }
    } catch (err) {
      console.error("Error fetching user data from Firestore:", err);
      setUserData({
        uid,
        name: fallbackName || 'Nutri Guide User',
        email: fallbackEmail,
        createdAt: new Date().toISOString()
      });
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser.uid, currentUser.email || '', currentUser.displayName || undefined);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (name: string, email: string, pass: string) => {
    if (!auth) {
      console.error("[Firebase Auth Diagnostic] Sign-up failed because Firebase Auth is null/uninitialized.");
      throw new Error("Firebase Auth is not initialized.");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const currentProjectId = auth.app?.options?.projectId;
    console.log("[Firebase Auth Diagnostic] Attempting createUserWithEmailAndPassword...", {
      projectId: currentProjectId,
      hasApiKey: Boolean(auth.app?.options?.apiKey),
      email: normalizedEmail
    });

    try {
      // 1. Create auth user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
      const createdUser = userCredential.user;

      console.log("[Firebase Auth Diagnostic] Sign-up successful! Firebase Auth User created:", {
        uid: createdUser.uid,
        email: createdUser.email,
        projectId: currentProjectId
      });

      // 2. Update display name in Firebase auth
      try {
        await updateProfile(createdUser, { displayName: name });
      } catch (profileErr) {
        console.warn("[Firebase Auth Diagnostic] Could not update displayName on Auth user:", profileErr);
      }

      // 3. Create document in Firestore (only uid, name, email, createdAt)
      const newUserData: UserProfileData = {
        uid: createdUser.uid,
        name,
        email: normalizedEmail,
        createdAt: new Date().toISOString()
      };

      // Clear any prior stale local records for this uid
      clearLocalProfile(createdUser.uid);
      clearSavedMealPlan(createdUser.uid);

      if (db) {
        try {
          const userRef = doc(db, 'users', createdUser.uid);
          await setDoc(userRef, sanitizeForFirestore(newUserData));
        } catch (firestoreErr) {
          console.error("[Firebase Auth Diagnostic] Firestore user document creation error:", firestoreErr);
        }
      }

      setUserData(newUserData);
    } catch (err: any) {
      console.error("[Firebase Auth Diagnostic] createUserWithEmailAndPassword failed!", {
        code: err?.code,
        message: err?.message,
        projectId: currentProjectId
      });
      throw err;
    }
  };

  const signIn = async (email: string, pass: string) => {
    if (!auth) {
      console.error("[Firebase Auth Diagnostic] Sign-in failed because Firebase Auth is null/uninitialized.");
      throw new Error("Firebase Auth is not initialized.");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const currentProjectId = auth.app?.options?.projectId;
    console.log("[Firebase Auth Diagnostic] Attempting signInWithEmailAndPassword...", {
      projectId: currentProjectId,
      email: normalizedEmail
    });

    try {
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
      const signedInUser = userCredential.user;
      console.log("[Firebase Auth Diagnostic] Sign-in successful for UID:", signedInUser.uid);
      await fetchUserData(signedInUser.uid, signedInUser.email || '', signedInUser.displayName || undefined);
    } catch (err: any) {
      console.error("[Firebase Auth Diagnostic] signInWithEmailAndPassword failed!", {
        code: err?.code,
        message: err?.message,
        projectId: currentProjectId
      });
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const googleUser = userCredential.user;

    const newUserData: UserProfileData = {
      uid: googleUser.uid,
      name: googleUser.displayName || 'Nutri Guide User',
      email: googleUser.email || '',
      createdAt: new Date().toISOString()
    };

    if (db) {
      try {
        const userRef = doc(db, 'users', googleUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          clearLocalProfile(googleUser.uid);
          clearSavedMealPlan(googleUser.uid);
          await setDoc(userRef, sanitizeForFirestore(newUserData));
          setUserData(newUserData);
        } else {
          await fetchUserData(googleUser.uid, googleUser.email || '', googleUser.displayName || undefined);
        }
      } catch (err) {
        console.warn("Firestore Google user document check warning:", err);
        await fetchUserData(googleUser.uid, googleUser.email || '', googleUser.displayName || undefined);
      }
    } else {
      setUserData(newUserData);
    }
  };

  const signOut = async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
    setUser(null);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

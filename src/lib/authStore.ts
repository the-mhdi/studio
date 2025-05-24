
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase'; // Assuming firebase.ts is in src/lib
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, type DocumentData } from 'firebase/firestore';
import type { User, UserRole } from '@/lib/types';

interface AuthState {
  authUser: FirebaseUser | null; // Raw Firebase auth user
  userProfile: User | null; // User profile from Firestore
  isAuthenticated: boolean;
  isLoading: boolean; // To handle async auth state loading
  login: (authUser: FirebaseUser, userProfile: User) => void;
  logout: () => Promise<void>;
  setAuthUser: (authUser: FirebaseUser | null) => void;
  setUserProfile: (userProfile: User | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      authUser: null,
      userProfile: null,
      isAuthenticated: false,
      isLoading: true, // Start as true until auth state is determined
      
      login: (authUser, userProfile) => set({ authUser, userProfile, isAuthenticated: true, isLoading: false }),
      
      logout: async () => {
        try {
          await firebaseSignOut(auth);
          set({ authUser: null, userProfile: null, isAuthenticated: false, isLoading: false });
        } catch (error) {
          console.error("Error signing out: ", error);
          // Optionally, set isLoading to false even on error, or handle error state
          set({ isLoading: false });
        }
      },
      
      setAuthUser: (authUser) => set({ authUser }),
      setUserProfile: (userProfile) => set({ userProfile }),
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'medimind-auth-storage-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userProfile: state.userProfile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Listen to Firebase Auth state changes
// This should be called once when the app initializes, e.g., in a root layout or provider.
let unsubscribeAuth: (() => void) | null = null;

export function initializeAuthListener() {
  if (unsubscribeAuth) {
    // console.log("Auth listener already initialized.");
    return unsubscribeAuth; // Return existing unsubscriber if called multiple times
  }
  
  useAuthStore.getState().setIsLoading(true);

  unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // User is signed in
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userProfileData = userDocSnap.data() as User; // Cast to your User type
        useAuthStore.getState().login(firebaseUser, userProfileData);
      } else {
        // This case should ideally not happen if user profile is created on signup.
        // Handle missing profile, e.g., log out user or redirect to profile creation.
        console.error("User profile not found in Firestore for UID:", firebaseUser.uid);
        await firebaseSignOut(auth); // Log out if profile is missing
        useAuthStore.getState().setAuthUser(null);
        useAuthStore.getState().setUserProfile(null);
        useAuthStore.getState().setIsLoading(false);
      }
    } else {
      // User is signed out
      useAuthStore.getState().setAuthUser(null);
      useAuthStore.getState().setUserProfile(null);
      useAuthStore.getState().setIsLoading(false);
    }
  });
  return unsubscribeAuth;
}


import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase'; // Assuming firebase.ts is in src/lib
import { onAuthStateChanged, signOut as firebaseSignOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, type DocumentData } from 'firebase/firestore';
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
      
      login: (authUser, userProfile) => {
        console.log('[authStore] Login: Setting user profile:', userProfile);
        set({ authUser, userProfile, isAuthenticated: true, isLoading: false });
      },
      
      logout: async () => {
        console.log('[authStore] Logout: Signing out...');
        try {
          await firebaseSignOut(auth);
          set({ authUser: null, userProfile: null, isAuthenticated: false, isLoading: false });
          console.log('[authStore] Logout: Success');
        } catch (error) {
          console.error("[authStore] Logout: Error signing out: ", error);
          set({ isLoading: false }); // Still set loading to false on error
        }
      },
      
      setAuthUser: (authUser) => set({ authUser }),
      setUserProfile: (userProfile) => set({ userProfile }),
      setIsLoading: (loading) => {
        console.log('[authStore] setIsLoading called with:', loading);
        set({ isLoading: loading });
      },
    }),
    {
      name: 'medimind-auth-storage-v3', // Changed version to potentially clear old incompatible state
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist userProfile and isAuthenticated to avoid storing sensitive FirebaseUser object
        // and to ensure isLoading is always true on app load until auth state is confirmed.
        userProfile: state.userProfile,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // When rehydrating, we want isLoading to be true initially until onAuthStateChanged runs.
        // The persisted isLoading value might be false from a previous session.
        if (state) {
          state.isLoading = true; 
        }
      }
    }
  )
);

let unsubscribeAuth: (() => void) | null = null;

export function initializeAuthListener() {
  if (unsubscribeAuth) {
    console.log("[authStore] Auth listener already initialized.");
    return unsubscribeAuth; 
  }
  
  console.log("[authStore] Initializing Firebase Auth listener...");
  useAuthStore.getState().setIsLoading(true);

  unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
    console.log('[authStore] onAuthStateChanged: firebaseUser status:', firebaseUser ? 'LOGGED IN' : 'LOGGED OUT', firebaseUser);
    if (firebaseUser) {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      console.log('[authStore] onAuthStateChanged: Authenticated. Attempting to fetch profile for UID:', firebaseUser.uid);
      try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userProfileData = userDocSnap.data() as User;
          console.log('[authStore] onAuthStateChanged: Profile found:', userProfileData);
          useAuthStore.getState().login(firebaseUser, userProfileData); // This sets isLoading: false
        } else {
          console.warn("[authStore] onAuthStateChanged: User profile not found in Firestore for UID:", firebaseUser.uid, "Logging out.");
          // This scenario can happen if user was created in Auth but Firestore doc creation failed,
          // or if a user was deleted from Firestore but not Auth.
          await firebaseSignOut(auth); // Log out the user from Firebase Auth
          useAuthStore.getState().setAuthUser(null);
          useAuthStore.getState().setUserProfile(null);
          useAuthStore.getState().setIsLoading(false); 
        }
      } catch (error) {
        console.error("[authStore] onAuthStateChanged: Error fetching user profile:", error);
        // If fetching profile fails, sign out the user to prevent inconsistent state
        await firebaseSignOut(auth);
        useAuthStore.getState().setAuthUser(null);
        useAuthStore.getState().setUserProfile(null);
        useAuthStore.getState().setIsLoading(false);
      }
    } else {
      // User is signed out or no user
      console.log('[authStore] onAuthStateChanged: No authenticated user.');
      useAuthStore.getState().setAuthUser(null);
      useAuthStore.getState().setUserProfile(null);
      useAuthStore.getState().setIsLoading(false);
    }
  });
  return unsubscribeAuth;
}

    
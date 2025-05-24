
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase'; 
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, type DocumentData } from 'firebase/firestore';
import type { User } from '@/lib/types';

interface AuthState {
  authUser: FirebaseUser | null; 
  userProfile: User | null; 
  isAuthenticated: boolean;
  isLoading: boolean; 
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
      isLoading: true, 
      
      login: (authUser, userProfile) => {
        console.log('[authStore] login action called. Received authUser:', authUser?.uid, 'Received userProfile:', userProfile);
        if (!userProfile || !userProfile.uid || !userProfile.userType) {
            console.error('[authStore] login action: CRITICAL - Attempted to login with invalid or undefined userProfile.', userProfile);
            // Potentially logout or set error state if this happens
            set({ authUser: null, userProfile: null, isAuthenticated: false, isLoading: false });
            return;
        }
        console.log('[authStore] login action: Setting authUser and userProfile. UID:', userProfile.uid, 'Type:', userProfile.userType);
        set({ authUser, userProfile, isAuthenticated: true, isLoading: false });
      },
      
      logout: async () => {
        console.log('[authStore] logout action: Signing out...');
        try {
          await firebaseSignOut(auth);
          // State update (authUser: null, userProfile: null, isAuthenticated: false) 
          // will be handled by onAuthStateChanged listener for consistency.
          // Explicitly set isLoading: false here if onAuthStateChanged doesn't cover it quickly enough.
          console.log('[authStore] logout action: Firebase sign out successful. isLoading should be set by onAuthStateChanged.');
          set({isLoading: false }); // Ensure loading is false after explicit logout.
        } catch (error) {
          console.error("[authStore] logout action: Error signing out: ", error);
          set({ authUser: null, userProfile: null, isAuthenticated: false, isLoading: false });
        }
      },
      
      setAuthUser: (authUser) => {
        console.log('[authStore] setAuthUser action called with:', authUser?.uid);
        set({ authUser });
      },
      setUserProfile: (userProfile) => {
        console.log('[authStore] setUserProfile action called explicitly with:', userProfile);
        set({ userProfile });
      },
      setIsLoading: (loading) => {
        console.log('[authStore] setIsLoading action called with:', loading);
        set({ isLoading: loading });
      },
    }),
    {
      name: 'medimind-auth-storage-v3', // Key for localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist parts of the state that are safe and useful for rehydration
        // authUser: state.authUser, // Persisting full FirebaseUser object can be problematic due to non-serializable parts.
                                  // It's often better to rely on onAuthStateChanged for re-auth.
                                  // If persisted, ensure it's a plain object.
        // userProfile: state.userProfile, // User profile is fine to persist
        // isAuthenticated: state.isAuthenticated, // This is also fine
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('[authStore] Rehydrating storage. Current rehydrated state:', {isAuthenticated: state.isAuthenticated, isLoading: state.isLoading, userProfileUid: state.userProfile?.uid });
          // Do not set isLoading to true here if we are not persisting authUser.
          // isLoading should be true initially and then false after onAuthStateChanged.
          // If we persist authUser, then yes, set isLoading to true while we verify it.
        }
      }
    }
  )
);

let unsubscribeAuth: (() => void) | null = null;

export function initializeAuthListener() {
  if (unsubscribeAuth) {
    console.log("[authStore] initializeAuthListener: Auth listener already initialized. Unsubscribing previous one.");
    unsubscribeAuth();
  }
  
  console.log("[authStore] initializeAuthListener: Initializing Firebase Auth listener. Setting isLoading to true.");
  useAuthStore.getState().setIsLoading(true);

  unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
    console.log('[authStore] onAuthStateChanged: Auth state changed. firebaseUser:', firebaseUser ? `UID: ${firebaseUser.uid}` : 'null');
    if (firebaseUser) {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      console.log('[authStore] onAuthStateChanged: Authenticated. Attempting to fetch profile for UID:', firebaseUser.uid);
      try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userProfileData = userDocSnap.data() as User | DocumentData | undefined; 
          console.log('[authStore] onAuthStateChanged: Raw profile data from Firestore:', userProfileData);

          if (userProfileData && typeof userProfileData.uid === 'string' && userProfileData.uid === firebaseUser.uid && typeof userProfileData.userType === 'string') {
            console.log('[authStore] onAuthStateChanged: Profile found and seems valid. Calling login action.', userProfileData as User);
            useAuthStore.getState().login(firebaseUser, userProfileData as User);
          } else {
            console.warn("[authStore] onAuthStateChanged: Fetched user data is invalid, incomplete, or UID mismatch for UID:", firebaseUser.uid, "Profile data:", userProfileData, ". Logging out user.");
            await useAuthStore.getState().logout(); // Calls our logout which handles firebaseSignOut and state
          }
        } else {
          console.warn("[authStore] onAuthStateChanged: User profile not found in Firestore for UID:", firebaseUser.uid, ". This is unexpected if user just signed up or logged in. Logging out user.");
          await useAuthStore.getState().logout();
        }
      } catch (error) {
        console.error("[authStore] onAuthStateChanged: Error fetching user profile:", error, ". Logging out user.");
        await useAuthStore.getState().logout();
      }
    } else {
      // User is signed out or no user
      console.log('[authStore] onAuthStateChanged: No authenticated user. Clearing auth state.');
      useAuthStore.setState({ authUser: null, userProfile: null, isAuthenticated: false, isLoading: false });
    }
  });
  return unsubscribeAuth;
}

// Initialize the listener when the store is loaded
// This might be better called from AppProviders to ensure it runs once on client mount.
// For now, let's assume AppProviders handles calling initializeAuthListener.
// initializeAuthListener();

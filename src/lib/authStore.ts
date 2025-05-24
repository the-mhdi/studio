
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase'; // Assuming firebase.ts is in src/lib
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, type DocumentData } from 'firebase/firestore';
import type { User } from '@/lib/types';

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
        console.log('[authStore] Login: Setting authUser and userProfile:', userProfile);
        set({ authUser, userProfile, isAuthenticated: true, isLoading: false });
      },
      
      logout: async () => {
        console.log('[authStore] Logout: Signing out...');
        try {
          await firebaseSignOut(auth);
          // State update will be handled by onAuthStateChanged listener for consistency
        } catch (error) {
          console.error("[authStore] Logout: Error signing out: ", error);
          // Even if signout fails, ensure local state reflects logged out
          set({ authUser: null, userProfile: null, isAuthenticated: false, isLoading: false });
        }
      },
      
      setAuthUser: (authUser) => set({ authUser }),
      setUserProfile: (userProfile) => {
        console.log('[authStore] setUserProfile explicitly called with:', userProfile);
        set({ userProfile });
      },
      setIsLoading: (loading) => {
        console.log('[authStore] setIsLoading called with:', loading);
        set({ isLoading: loading });
      },
    }),
    {
      name: 'medimind-auth-storage-v3', 
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        authUser: state.authUser, // Persist authUser for quicker re-auth checks if desired
        userProfile: state.userProfile,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('[authStore] Rehydrating storage. Setting isLoading to true.');
          state.isLoading = true; 
        }
      }
    }
  )
);

let unsubscribeAuth: (() => void) | null = null;

export function initializeAuthListener() {
  if (unsubscribeAuth) {
    console.log("[authStore] Auth listener already initialized. Unsubscribing previous one.");
    unsubscribeAuth(); // Unsubscribe from the old listener before creating a new one
  }
  
  console.log("[authStore] Initializing Firebase Auth listener...");
  useAuthStore.getState().setIsLoading(true);

  unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
    console.log('[authStore] onAuthStateChanged: firebaseUser status:', firebaseUser ? `LOGGED IN (UID: ${firebaseUser.uid})` : 'LOGGED OUT');
    if (firebaseUser) {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      console.log('[authStore] onAuthStateChanged: Authenticated. Attempting to fetch profile for UID:', firebaseUser.uid);
      try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userProfileData = userDocSnap.data() as User; 
          console.log('[authStore] onAuthStateChanged: Raw profile data from Firestore:', userProfileData);

          // More robust check for a valid user profile
          if (userProfileData && typeof userProfileData.uid === 'string' && userProfileData.uid === firebaseUser.uid && typeof userProfileData.userType === 'string') {
            console.log('[authStore] onAuthStateChanged: Profile found and seems valid:', userProfileData);
            useAuthStore.getState().login(firebaseUser, userProfileData);
          } else {
            console.warn("[authStore] onAuthStateChanged: Fetched user data is invalid, incomplete, or UID mismatch for UID:", firebaseUser.uid, "Profile data:", userProfileData, ". Logging out.");
            await firebaseSignOut(auth); // This will trigger onAuthStateChanged again with null
            // No need to manually set state here as onAuthStateChanged will handle the firebaseUser === null case
          }
        } else {
          console.warn("[authStore] onAuthStateChanged: User profile not found in Firestore for UID:", firebaseUser.uid, ". This might be a new signup, or an error. If it's a new signup, profile should be created shortly. If persisting, logging out.");
          // If this is a new signup, the profile might not be created yet when this first fires.
          // The signup flow itself should call login.
          // If this state persists, it means profile creation failed or user was deleted from DB.
          // We might want a small delay here or rely on signup flow to populate profile first.
          // For now, if a user is authenticated but has no profile, we log them out to prevent inconsistent state.
          const currentProfile = useAuthStore.getState().userProfile;
          if (!currentProfile || currentProfile.uid !== firebaseUser.uid) { // Only logout if profile isn't already being set by signup
            console.log("[authStore] Logging out user due to missing profile in DB and not matching local store during auth state change.");
            await firebaseSignOut(auth); // This will re-trigger onAuthStateChanged
          } else {
            console.log("[authStore] User profile exists locally, possibly from signup flow. Skipping logout for now.");
            useAuthStore.getState().setIsLoading(false); // Ensure loading stops if profile is locally available
          }
        }
      } catch (error) {
        console.error("[authStore] onAuthStateChanged: Error fetching user profile:", error);
        await firebaseSignOut(auth); // This will re-trigger onAuthStateChanged
      }
    } else {
      // User is signed out or no user
      console.log('[authStore] onAuthStateChanged: No authenticated user. Clearing auth state.');
      useAuthStore.setState({ authUser: null, userProfile: null, isAuthenticated: false, isLoading: false });
    }
  });
  return unsubscribeAuth;
}

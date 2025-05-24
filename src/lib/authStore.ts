
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
  login: (authUser: FirebaseUser | null, userProfile: User) => void; // authUser can now be null
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
        console.log('[authStore] login action called. Received authUser UID:', authUser?.uid, 'Received userProfile:', userProfile);
        if (!userProfile || !userProfile.uid || !userProfile.userType) {
          console.error('[authStore] login action: CRITICAL - Attempted to login with invalid or undefined userProfile.', userProfile);
          set({ authUser: null, userProfile: null, isAuthenticated: false, isLoading: false });
          return;
        }
        console.log('[authStore] login action: Setting userProfile. UID:', userProfile.uid, 'Type:', userProfile.userType);
        // If authUser is null (e.g. patient ID login), isAuthenticated still true if userProfile is valid
        set({ authUser, userProfile, isAuthenticated: true, isLoading: false });
      },

      logout: async () => {
        console.log('[authStore] logout action: Signing out...');
        const currentAuthUser = get().authUser;
        if (currentAuthUser) { // Only call Firebase signout if there's a Firebase user
          try {
            await firebaseSignOut(auth);
            console.log('[authStore] logout action: Firebase sign out successful.');
          } catch (error) {
            console.error("[authStore] logout action: Error signing out from Firebase: ", error);
          }
        }
        // Clear local state regardless of Firebase signout success/necessity
        // onAuthStateChanged will also fire for Firebase signouts, but this ensures immediate UI update
        set({ authUser: null, userProfile: null, isAuthenticated: false, isLoading: false });
        console.log('[authStore] logout action: Local auth state cleared.');
      },

      setAuthUser: (authUser) => {
        console.log('[authStore] setAuthUser action called with UID:', authUser?.uid);
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
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('[authStore] Rehydrating storage. Current rehydrated state:', {isAuthenticated: state.isAuthenticated, isLoading: state.isLoading, userProfileUid: state.userProfile?.uid });
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
    console.log('[authStore] onAuthStateChanged: Firebase auth state changed. firebaseUser:', firebaseUser ? `UID: ${firebaseUser.uid}` : 'null');
    if (firebaseUser) {
      // If Firebase user exists, this is the primary source of truth for authUser
      // Check if a profile already exists in the store, if not, fetch it.
      // This avoids refetching if login action already populated it from signup.
      const existingProfile = useAuthStore.getState().userProfile;
      if (existingProfile && existingProfile.uid === firebaseUser.uid && useAuthStore.getState().authUser?.uid === firebaseUser.uid) {
        console.log('[authStore] onAuthStateChanged: Profile for Firebase user already in store and matches. No re-fetch.');
        useAuthStore.getState().setIsLoading(false); // Already logged in and profile loaded
        return;
      }

      const userDocRef = doc(db, "users", firebaseUser.uid);
      console.log('[authStore] onAuthStateChanged: Authenticated with Firebase. Attempting to fetch Firestore profile for UID:', firebaseUser.uid);
      try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userProfileData = userDocSnap.data() as User | DocumentData | undefined;
          console.log('[authStore] onAuthStateChanged: Raw profile data from Firestore:', userProfileData);

          if (userProfileData && typeof userProfileData.uid === 'string' && userProfileData.uid === firebaseUser.uid && typeof userProfileData.userType === 'string') {
            console.log('[authStore] onAuthStateChanged: Firestore profile found and valid. Calling login action.');
            useAuthStore.getState().login(firebaseUser, userProfileData as User);
          } else {
            console.warn("[authStore] onAuthStateChanged: Fetched Firestore user data is invalid, incomplete, or UID mismatch for UID:", firebaseUser.uid, "Profile data:", userProfileData, ". Logging out user.");
            await useAuthStore.getState().logout();
          }
        } else {
          console.warn("[authStore] onAuthStateChanged: User profile not found in Firestore for Firebase UID:", firebaseUser.uid, ". This might be okay if it's a custom patient record login, or an error if it's a Firebase user without a profile. Logging out Firebase user for safety.");
          await useAuthStore.getState().logout(); // Ensures Firebase user without profile is logged out
        }
      } catch (error) {
        console.error("[authStore] onAuthStateChanged: Error fetching user profile:", error, ". Logging out Firebase user.");
        await useAuthStore.getState().logout();
      }
    } else {
      // No Firebase authenticated user.
      // Check if we have a custom (Patient ID) authenticated user in store. If so, leave them.
      // If not, then clear everything.
      const currentProfile = useAuthStore.getState().userProfile;
      const currentAuthUser = useAuthStore.getState().authUser;
      if (!currentProfile || currentAuthUser) { // If no profile, or if there was a Firebase authUser (who is now logged out)
        console.log('[authStore] onAuthStateChanged: No Firebase user & no custom profile (or clearing after Firebase logout). Clearing auth state.');
        useAuthStore.setState({ authUser: null, userProfile: null, isAuthenticated: false, isLoading: false });
      } else {
         console.log('[authStore] onAuthStateChanged: No Firebase user, but a custom userProfile exists. Maintaining custom session.');
         useAuthStore.getState().setIsLoading(false); // Custom session already loaded
      }
    }
  });
  return unsubscribeAuth;
}

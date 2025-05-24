import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MockUser, UserRole } from '@/lib/types';

interface AuthState {
  user: MockUser | null;
  isAuthenticated: boolean;
  login: (user: MockUser) => void;
  logout: () => void;
  setUserRole: (role: UserRole) => void; // For signup simulation
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setUserRole: (role) => { // Simplified: assumes a user object exists or creates a partial one
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, user_type: role } });
        } else {
          // This case is for initial role selection during signup before full user object is "created"
          // In a real app, signup would create the full user object.
          set({ 
            user: { 
              user_id: Date.now(), // mock id
              username: "tempUser",
              email: "temp@example.com",
              first_name: "Temp",
              last_name: "User",
              user_type: role,
              created_at: new Date().toISOString(),
            }, 
            isAuthenticated: false // Not fully authenticated until signup completion
          });
        }
      }
    }),
    {
      name: 'medimind-auth-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);

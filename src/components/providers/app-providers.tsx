
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { initializeAuthListener } from '@/lib/authStore';

// This component ensures that any child components that rely on localStorage (like Zustand persist)
// are only rendered on the client-side after hydration is complete.
// It also initializes the Firebase auth listener.
export function AppProviders({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    setIsMounted(true);
    
    // Cleanup listener on component unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  if (!isMounted) {
    // You can render a loading spinner or null here if needed during initial client render before mount
    return <div className="flex min-h-screen items-center justify-center"><p>Initializing App...</p></div>;
  }

  return <>{children}</>;
}

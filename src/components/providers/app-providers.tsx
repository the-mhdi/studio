'use client';

import { useEffect, useState, type ReactNode } from 'react';

// This component ensures that any child components that rely on localStorage (like Zustand persist)
// are only rendered on the client-side after hydration is complete.
export function AppProviders({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // You can render a loading spinner or null here if needed
    return null; 
  }

  return <>{children}</>;
}

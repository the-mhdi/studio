import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-primary hover:text-primary/80">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            >
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 16.75a.75.75 0 0 1-.75-.75V12.5a.75.75 0 0 1 1.5 0v5.5a.75.75 0 0 1-.75.75zm0-9a.75.75 0 0 1-.75-.75V8.5a.75.75 0 0 1 1.5 0v.5a.75.75 0 0 1-.75.75zM9.5 14.75a.75.75 0 0 1-.75-.75V10.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-.75.75zm5 0a.75.75 0 0 1-.75-.75V10.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-.75.75z"/>
            <path d="M12 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
        </svg>
        <h1 className="text-3xl font-bold">MediMind</h1>
      </Link>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

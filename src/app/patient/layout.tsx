
'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import { SidebarNav, type NavItem } from '@/components/shared/sidebar-nav';
import { LayoutDashboard, MessageCircle, CalendarPlus, Pill, UserCircle } from 'lucide-react';
import Link from 'next/link';

const patientNavItems: NavItem[] = [
  { href: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patient/chat', label: 'AI Assistant', icon: MessageCircle },
  { href: '/patient/appointments', label: 'Appointments', icon: CalendarPlus },
  { href: '/patient/pill-reminder', label: 'Pill Reminders', icon: Pill },
];

export default function PatientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, userProfile, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || userProfile?.userType !== 'patient') {
        router.push('/auth/login');
      }
    }
  }, [isAuthenticated, userProfile, router, isLoading]);

  if (isLoading || !isAuthenticated || userProfile?.userType !== 'patient') {
     // Show loading state or null while checking auth / redirecting
    return <div className="flex min-h-screen items-center justify-center"><p>Loading patient portal...</p></div>;
  }

  const logo = (
    <Link href="/patient/dashboard" className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-foreground/90">
        <UserCircle size={28} />
        <h1 className="text-xl font-bold">MediMind Patient</h1>
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-background">
       <aside className="fixed left-0 top-0 z-10 h-screen w-64 md:sticky">
        <SidebarNav 
          navItems={patientNavItems} 
          logo={logo}
          userName={`${userProfile.firstName} ${userProfile.lastName}`}
          userRole="Patient"
        />
      </aside>
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

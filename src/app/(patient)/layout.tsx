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
  // { href: '/patient/profile', label: 'My Profile', icon: UserCircle }, // Example if needed
];

export default function PatientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.user_type !== 'patient') {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.user_type !== 'patient') {
    return <div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>;
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
          userName={`${user.first_name} ${user.last_name}`}
          userRole="Patient"
        />
      </aside>
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}


'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import { SidebarNav, type NavItem } from '@/components/shared/sidebar-nav';
import { LayoutDashboard, Users, Settings, Stethoscope, CalendarDays, FileText } from 'lucide-react';
import Link from 'next/link';

const doctorNavItems: NavItem[] = [
  { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/doctor/patients', label: 'Patients', icon: Users },
  { href: '/doctor/appointments', label: 'Appointments', icon: CalendarDays },
  { href: '/doctor/ai-customization', label: 'AI Customization', icon: Settings },
  // { href: '/doctor/documents', label: 'All Documents', icon: FileText }, // Example if needed
];

export default function DoctorLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.user_type !== 'doctor') {
      router.push('/auth/login');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.user_type !== 'doctor') {
    // Render a loading state or null while redirecting
    return <div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>;
  }
  
  const logo = (
     <Link href="/doctor/dashboard" className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-foreground/90">
        <Stethoscope size={28} />
        <h1 className="text-xl font-bold">MediMind Doctor</h1>
      </Link>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-10 h-screen w-64 md:sticky">
        <SidebarNav 
          navItems={doctorNavItems} 
          logo={logo}
          userName={`${user.first_name} ${user.last_name}`}
          userRole="Doctor"
        />
      </aside>
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

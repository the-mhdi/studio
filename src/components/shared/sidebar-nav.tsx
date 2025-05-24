'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import { useToast } from '@/hooks/use-toast';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
}

interface SidebarNavProps {
  navItems: NavItem[];
  logo: React.ReactNode;
  userName?: string;
  userRole?: string;
}

export function SidebarNav({ navItems, logo, userName, userRole }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/login');
  };

  return (
    <div className="flex h-full flex-col border-r bg-sidebar text-sidebar-foreground shadow-lg">
      <div className="flex h-16 items-center justify-center border-b px-6">
        {logo}
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/') ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start gap-2",
                (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')) 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90" 
                  : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                item.disabled && "cursor-not-allowed opacity-50"
              )}
              asChild={!item.disabled}
              disabled={item.disabled}
            >
              {item.disabled ? (
                <div className="flex items-center">
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.label}
                </div>
              ) : (
                <Link href={item.href} className="flex items-center">
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.label}
                </Link>
              )}
            </Button>
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto border-t p-4">
        {userName && (
          <div className="mb-2 text-sm">
            <p className="font-semibold">{userName}</p>
            <p className="text-xs text-sidebar-foreground/80">{userRole}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}

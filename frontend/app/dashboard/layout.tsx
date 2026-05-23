'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/app/store/auth-store';
import { ThemeToggle } from '@/app/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTranslation } from '@/lib/translations';
import {
  LayoutDashboard, Calendar, Users, Activity, Settings, Stethoscope,
  FileText, LogOut, Menu, X, Building2, Pill, ShieldCheck, ChevronRight,
  Search, User as UserIcon
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: any;
}

function getNavItems(role: string, staffRole?: string, t: (key: string) => string = (k) => k): NavItem[] {
  if (role === 'patient') {
    return [
      { label: t('Overview'), href: '/dashboard', icon: LayoutDashboard },
      { label: t('Book Appointment'), href: '/dashboard/appointments', icon: Calendar },
      { label: t('My Records'), href: '/dashboard/records', icon: FileText },
      { label: t('Settings'), href: '/dashboard/settings', icon: Settings },
    ];
  }

  if (role === 'hospital' && staffRole === 'doctor') {
    return [
      { label: t('Overview'), href: '/dashboard', icon: LayoutDashboard },
      { label: t('Diagnose'), href: '/dashboard/patients', icon: Stethoscope },
      { label: t('My Appointments'), href: '/dashboard/appointments', icon: Calendar },
      { label: t('Analytics'), href: '/dashboard/analytics', icon: Activity },
      { label: t('Settings'), href: '/dashboard/settings', icon: Settings },
    ];
  }

  if (role === 'hospital') {
    const items: NavItem[] = [
      { label: t('Overview'), href: '/dashboard', icon: LayoutDashboard },
    ];
    if (!staffRole || staffRole === 'admin') {
      items.push({ label: t('Appointments'), href: '/dashboard/appointments', icon: Calendar });
    }
    items.push({ label: t('Patient Lookup'), href: '/dashboard/patients', icon: Search });
    items.push({ label: t('Staff & Doctors'), href: '/dashboard/staff', icon: Users });
    items.push({ label: t('Analytics'), href: '/dashboard/analytics', icon: Activity });
    items.push({ label: t('Settings'), href: '/dashboard/settings', icon: Settings });
    return items;
  }

  if (role === 'pharmacy') {
    return [
      { label: t('Overview'), href: '/dashboard', icon: LayoutDashboard },
      { label: t('Orders'), href: '/dashboard/orders', icon: FileText },
      { label: t('Inventory'), href: '/dashboard/inventory', icon: Pill },
      { label: t('Settings'), href: '/dashboard/settings', icon: Settings },
    ];
  }

  if (role === 'admin') {
    return [
      { label: t('Overview'), href: '/dashboard', icon: LayoutDashboard },
      { label: t('Hospitals'), href: '/dashboard/hospitals', icon: Building2 },
      { label: t('Pharmacies'), href: '/dashboard/pharmacies', icon: Pill },
      { label: t('Settings'), href: '/dashboard/settings', icon: Settings },
    ];
  }

  return [{ label: t('Overview'), href: '/dashboard', icon: LayoutDashboard }];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!mounted || !user) return null;

  const navItems = getNavItems(user.role, (user as any).staff_role, t);


  const getRoleLabel = () => {
    if (user.role === 'hospital') {
      const sr = (user as any).staff_role;
      if (sr === 'doctor') return 'Doctor';
      if (sr === 'director') return 'Director';
      if (sr === 'superintendent') return 'Superintendent';
      return 'Hospital Admin';
    }
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col
        bg-card border-r border-border/50 
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border/50 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-foreground">MediChain</h1>
            <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">{t('AI Healthcare Platform')}</p>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }
                `}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-border/50 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="h-9 w-9 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {user.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{getRoleLabel()}</p>
            </div>
          </div>
          <div className="flex gap-1 mt-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="flex-1 text-xs text-muted-foreground hover:text-destructive gap-1.5">
              <LogOut className="h-3.5 w-3.5" /> {t('Sign Out')}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 sm:h-16 flex items-center gap-4 px-4 sm:px-6 border-b border-border/50 shrink-0 bg-background/95 backdrop-blur-sm">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">
              {navItems.find(n => n.href === pathname)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
              <UserIcon className="h-3 w-3" />
              <span className="capitalize">{getRoleLabel()}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

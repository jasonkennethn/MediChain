'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '../store/auth-store';
import { ThemeToggle } from './theme-toggle';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/#services' },
  { label: 'Why MediChain', href: '/#why-medichain' },
  { label: 'About Us', href: '/#about' },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo and App Name */}
        <Link href="/" className="flex items-center gap-2.5 transition-smooth hover:opacity-80">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-sm">
            <Activity className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold text-foreground">MediChain</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-smooth hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Auth Button + Theme Toggle */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Button onClick={handleAuthAction}>
              Login
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background animate-slide-down">
          <nav className="container mx-auto flex flex-col gap-2 p-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-smooth hover:bg-primary/10 hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 pt-2 border-t border-border/50">
              {isAuthenticated ? (
                <>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start mb-2"
                    onClick={() => {
                      router.push('/dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => {
                    handleAuthAction();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Login
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SplashScreen } from './components/splash-screen';
import { Navbar } from './components/navbar';
import { Footer } from './components/footer';
import { 
  HeroSection, 
  ServicesSection, 
  WhyMediChainSection, 
  AboutSection, 
  CTASection 
} from './components/home-sections';
import { useAuthStore } from './store/auth-store';

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated and redirect to dashboard
    if (isAuthenticated && !showSplash) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, showSplash, router]);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} duration={1500} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background animate-fade-in">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <ServicesSection />
        <WhyMediChainSection />
        <AboutSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

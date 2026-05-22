'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  Shield, 
  Clock, 
  Users, 
  Activity,
  Building2,
  Pill,
  UserCircle,
  CheckCircle2,
  Sparkles,
  Zap,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '../store/auth-store';

export function HeroSection() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-primary/2 to-background">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 py-20 md:py-28 lg:py-36 relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary animate-fade-in shadow-sm">
            <Sparkles className="h-4 w-4" />
            Trusted by 500+ Healthcare Providers
          </div>
          
          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl animate-slide-up text-balance">
            Healthcare Management
            <span className="block text-primary mt-2 drop-shadow-sm">Made Simple</span>
          </h1>
          
          {/* Subheadline */}
          <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto leading-relaxed animate-slide-up text-pretty" style={{ animationDelay: '100ms' }}>
            MediChain connects hospitals, pharmacies, and patients on a single platform. 
            Streamline operations, improve patient care, and reduce administrative burden.
          </p>
          
          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Button 
              size="lg" 
              className="h-14 px-10 text-base font-semibold shadow-xl shadow-primary/30 hover:shadow-primary/40 transition-all" 
              onClick={handleGetStarted}
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-14 px-10 text-base border-border/50 hover:bg-primary/5 hover:border-primary/30" 
              asChild
            >
              <Link href="/#services">
                Explore Services
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
            {[
              { value: '500+', label: 'Hospitals', icon: Building2 },
              { value: '2000+', label: 'Pharmacies', icon: Pill },
              { value: '1M+', label: 'Patients', icon: Users },
              { value: '99.9%', label: 'Uptime', icon: Zap },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-2xl bg-card/50 border border-border/30 backdrop-blur-sm hover:border-primary/30 transition-colors">
                <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-3xl md:text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ServicesSection() {
  const services = [
    {
      icon: Building2,
      title: 'Hospital Management',
      description: 'Complete hospital administration with patient records, staff management, and appointment scheduling.',
      features: ['Patient Records', 'Staff Management', 'Appointment Scheduling', 'Billing Integration'],
    },
    {
      icon: Pill,
      title: 'Pharmacy Management',
      description: 'Inventory tracking, prescription management, and seamless integration with hospitals.',
      features: ['Inventory Tracking', 'Prescription Management', 'Supplier Integration', 'Sales Analytics'],
    },
    {
      icon: UserCircle,
      title: 'Patient Portal',
      description: 'Easy access to medical records, appointments, prescriptions, and health tracking.',
      features: ['Medical Records', 'Appointment Booking', 'Prescription History', 'Health Tracking'],
    },
    {
      icon: Shield,
      title: 'Admin Dashboard',
      description: 'Comprehensive oversight and management tools for application administrators.',
      features: ['User Management', 'Analytics Dashboard', 'System Configuration', 'Security Controls'],
    },
  ];

  return (
    <section id="services" className="py-20 md:py-28 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
            Our Services
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl text-balance">
            Services We Offer
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Comprehensive healthcare management solutions for every stakeholder in the medical ecosystem.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Card 
              key={service.title} 
              className="group hover:shadow-xl transition-all duration-300 hover:border-primary/30 border-border/50 bg-card/50 backdrop-blur-sm animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/30">
                  <service.icon className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">{service.title}</CardTitle>
                <CardDescription className="text-pretty">{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhyMediChainSection() {
  const benefits = [
    {
      icon: Clock,
      title: 'Save Time',
      description: 'Reduce administrative tasks by 60% with automated workflows and streamlined processes.',
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security with HIPAA compliance and Aadhar-based authentication.',
    },
    {
      icon: Users,
      title: 'Better Coordination',
      description: 'Seamless communication between hospitals, pharmacies, and patients.',
    },
    {
      icon: Activity,
      title: 'Real-time Analytics',
      description: 'Make data-driven decisions with comprehensive dashboards and reports.',
    },
  ];

  return (
    <section id="why-medichain" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
              Why Choose Us
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl text-balance">
              Why Choose MediChain?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Built specifically for Indian healthcare providers, MediChain understands the unique 
              challenges of the medical industry and provides solutions that actually work.
            </p>
            
            <div className="mt-10 grid sm:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div 
                  key={benefit.title} 
                  className="flex gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <benefit.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 p-8 flex items-center justify-center shadow-2xl shadow-primary/10">
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                {[
                  { icon: Building2, label: 'Hospitals', count: '500+' },
                  { icon: Pill, label: 'Pharmacies', count: '2000+' },
                  { icon: UserCircle, label: 'Patients', count: '1M+' },
                  { icon: Globe, label: 'Cities', count: '100+' },
                ].map((item, index) => (
                  <div 
                    key={item.label} 
                    className="bg-card rounded-2xl p-5 shadow-lg border border-border/50 hover:shadow-xl hover:border-primary/30 transition-all animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <item.icon className="h-8 w-8 text-primary mb-3" />
                    <div className="text-2xl font-bold text-foreground">{item.count}</div>
                    <div className="text-sm text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function AboutSection() {
  return (
    <section id="about" className="py-20 md:py-28 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
            About Us
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl text-balance">
            About MediChain
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed text-pretty">
            MediChain was founded with a simple mission: to make healthcare management accessible, 
            efficient, and secure for everyone. Our platform brings together hospitals, pharmacies, 
            and patients on a single, unified system that reduces paperwork, improves coordination, 
            and ultimately leads to better patient outcomes.
          </p>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed text-pretty">
            Built in India, for India, MediChain understands the unique challenges of our healthcare 
            system and provides solutions that work within our regulatory framework while embracing 
            modern technology.
          </p>
          
          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {[
              { title: 'Our Mission', description: 'To digitize and streamline healthcare operations across India.', icon: Activity },
              { title: 'Our Vision', description: 'A connected healthcare ecosystem that puts patients first.', icon: Globe },
              { title: 'Our Values', description: 'Security, simplicity, and service excellence in everything we do.', icon: Shield },
            ].map((item, index) => (
              <div 
                key={item.title} 
                className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-4">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-accent px-6 py-16 md:px-12 md:py-24 text-center shadow-2xl shadow-primary/30">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/30 rounded-full blur-3xl" />
          </div>
          
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl md:text-5xl text-balance">
              Ready to Transform Your Healthcare Operations?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/90 max-w-2xl mx-auto text-pretty">
              Join hundreds of healthcare providers who have already made the switch to MediChain.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                variant="secondary" 
                className="h-14 px-10 text-base font-semibold shadow-xl hover:scale-105 transition-transform"
                onClick={() => router.push(isAuthenticated ? '/dashboard' : '/login')}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Phone, CreditCard, ArrowLeft, Loader2, Shield, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '../store/auth-store';
import { ThemeToggle } from '../components/theme-toggle';

type LoginMethod = 'phone' | 'aadhar';
type PageMode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isLoading, isAuthenticated } = useAuthStore();
  
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [error, setError] = useState('');
  const [pageMode, setPageMode] = useState<PageMode>('login');

  // Registration fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  const validatePhoneNumber = (value: string): boolean => {
    return /^\d{10}$/.test(value);
  };

  const validateAadharNumber = (value: string): boolean => {
    return /^\d{12}$/.test(value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(value);
    setError('');
  };

  const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
    setAadharNumber(value);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (loginMethod === 'phone') {
      if (!validatePhoneNumber(phoneNumber)) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }
      const result = await login({ type: 'phone', value: phoneNumber });
      if (!result.success) {
        setError(result.error || 'Login failed');
        setPageMode('register');
      } else {
        router.push('/dashboard');
      }
    } else {
      if (!validateAadharNumber(aadharNumber)) {
        setError('Please enter a valid 12-digit Aadhar number');
        return;
      }
      const result = await login({ type: 'aadhar', value: aadharNumber });
      if (!result.success) {
        setError(result.error || 'Login failed');
        setPageMode('register');
      } else {
        router.push('/dashboard');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    const result = await register({
      name: regName.trim(),
      phone_number: phoneNumber,
      aadhar_number: aadharNumber || undefined,
      email: regEmail || undefined,
      role: 'patient',
    });

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  const toggleLoginMethod = () => {
    setLoginMethod(loginMethod === 'phone' ? 'aadhar' : 'phone');
    setError('');
    setPageMode('login');
  };

  const isValidInput = loginMethod === 'phone' 
    ? validatePhoneNumber(phoneNumber) 
    : validateAadharNumber(aadharNumber);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 transition-smooth hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Activity className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-foreground">MediChain</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <Card className="w-full max-w-md animate-scale-in relative shadow-xl border-border/50">
          <CardHeader className="text-center space-y-2 pb-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-2 ring-4 ring-primary/5">
              {pageMode === 'register' ? (
                <UserPlus className="h-8 w-8 text-primary" />
              ) : loginMethod === 'phone' ? (
                <Phone className="h-8 w-8 text-primary" />
              ) : (
                <CreditCard className="h-8 w-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {pageMode === 'register' ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-base">
              {pageMode === 'register' 
                ? 'Fill in your details to register'
                : loginMethod === 'phone' 
                  ? 'Enter your phone number to continue' 
                  : 'Enter your Aadhar number to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={pageMode === 'register' ? handleRegister : handleLogin} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-slide-down">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}

              {/* Registration Extra Fields */}
              {pageMode === 'register' && (
                <div className="space-y-3 animate-slide-down">
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="h-12 text-base bg-input/50 border-border/50 focus:border-primary focus:ring-primary/20"
                    autoFocus
                  />
                  <Input
                    type="email"
                    placeholder="Email (optional)"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="h-12 text-base bg-input/50 border-border/50 focus:border-primary focus:ring-primary/20"
                  />
                </div>
              )}

              {/* Input Field */}
              <div className="space-y-2">
                {loginMethod === 'phone' ? (
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-sm font-medium">+91</span>
                      <div className="h-4 w-px bg-border" />
                    </div>
                    <Input
                      type="tel"
                      placeholder="Enter Phone Number"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      className="pl-16 h-12 text-base bg-input/50 border-border/50 focus:border-primary focus:ring-primary/20"
                      maxLength={10}
                      autoFocus={pageMode === 'login'}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Enter Aadhar Number"
                      value={aadharNumber}
                      onChange={handleAadharChange}
                      className="pl-11 h-12 text-base bg-input/50 border-border/50 focus:border-primary focus:ring-primary/20"
                      maxLength={12}
                      autoFocus={pageMode === 'login'}
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {loginMethod === 'phone' 
                    ? `${phoneNumber.length}/10 digits entered` 
                    : `${aadharNumber.length}/12 digits entered`}
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                disabled={isLoading || !isValidInput || (pageMode === 'register' && !regName.trim())}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {pageMode === 'register' ? 'Creating Account...' : 'Verifying...'}
                  </>
                ) : pageMode === 'register' ? (
                  'Register Now'
                ) : (
                  'Continue'
                )}
              </Button>

              {/* Toggle Login Method */}
              {pageMode === 'login' && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-3 text-muted-foreground">or</span>
                    </div>
                  </div>

                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full h-12 border-border/50 hover:bg-primary/5 hover:border-primary/30"
                    onClick={toggleLoginMethod}
                  >
                    {loginMethod === 'phone' ? (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Continue with Aadhar Number
                      </>
                    ) : (
                      <>
                        <Phone className="mr-2 h-5 w-5" />
                        Continue with Phone Number
                      </>
                    )}
                  </Button>
                </>
              )}

              {/* Back to Login from Register */}
              {pageMode === 'register' && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setPageMode('login');
                    setError('');
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              )}
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs font-semibold text-foreground mb-2">Demo Credentials:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex justify-between"><span className="font-medium">Patient:</span> <code className="bg-background px-1.5 py-0.5 rounded">9876543210</code></li>
                <li className="flex justify-between"><span className="font-medium">Hospital:</span> <code className="bg-background px-1.5 py-0.5 rounded">9876543211</code></li>
                <li className="flex justify-between"><span className="font-medium">Pharmacy:</span> <code className="bg-background px-1.5 py-0.5 rounded">9876543212</code></li>
                <li className="flex justify-between"><span className="font-medium">Admin:</span> <code className="bg-background px-1.5 py-0.5 rounded">9876543213</code></li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

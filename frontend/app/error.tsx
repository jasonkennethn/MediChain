'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Frontend error:', error);
  }, [error]);

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
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md animate-scale-in text-center">
          <CardHeader className="space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription className="text-base">
                We encountered an unexpected error. Please try again or contact support if the problem persists.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

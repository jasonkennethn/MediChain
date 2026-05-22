'use client';

import Link from 'next/link';
import { Activity, AlertCircle, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorPageProps {
  code: number;
  title: string;
  description: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

export function ErrorPage({ code, title, description, showRetry, onRetry }: ErrorPageProps) {
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
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <p className="text-6xl font-bold text-primary">{code}</p>
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription className="text-base">{description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Link>
            </Button>
            {showRetry && onRetry && (
              <Button variant="outline" className="w-full" onClick={onRetry}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export function NotFoundError() {
  return (
    <ErrorPage
      code={404}
      title="Page Not Found"
      description="The page you are looking for does not exist or has been moved."
    />
  );
}

export function UnauthorizedError() {
  return (
    <ErrorPage
      code={401}
      title="Unauthorized Access"
      description="You need to be logged in to access this page."
    />
  );
}

export function ForbiddenError() {
  return (
    <ErrorPage
      code={403}
      title="Access Forbidden"
      description="You do not have permission to access this resource."
    />
  );
}

export function ServerError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorPage
      code={500}
      title="Server Error"
      description="Something went wrong on our end. Please try again later."
      showRetry
      onRetry={onRetry}
    />
  );
}

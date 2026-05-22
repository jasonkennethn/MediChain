'use client';

import Link from 'next/link';
import { Activity, Mail, Phone, MapPin, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/20">
      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                <Activity className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold text-foreground">MediChain</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Revolutionizing healthcare management for hospitals, pharmacies, and patients across India.
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              Made with <Heart className="h-4 w-4 text-destructive mx-1 fill-destructive" /> in India
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/#services" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/#why-medichain" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Why MediChain
                </Link>
              </li>
              <li>
                <Link href="/#about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* For Users */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">For Users</h3>
            <ul className="space-y-3">
              <li>
                <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">Patients</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">Hospitals</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">Pharmacies</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">Administrators</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                support@medichain.com
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                +91 1800-123-4567
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <span>Hyderabad, Telangana, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} MediChain. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

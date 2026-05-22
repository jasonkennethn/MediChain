import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from './components/theme-provider'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'MediChain - Healthcare Management Made Simple',
  description: 'MediChain connects hospitals, pharmacies, and patients on a single platform. Streamline operations, improve patient care, and reduce administrative burden.',
  keywords: ['healthcare', 'hospital management', 'pharmacy', 'patient portal', 'medical records', 'India'],
  authors: [{ name: 'MediChain Team' }],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'MediChain - Healthcare Management Made Simple',
    description: 'Connecting hospitals, pharmacies, and patients on a unified healthcare platform.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#22c55e' },
    { media: '(prefers-color-scheme: dark)', color: '#166534' },
  ],
  width: 'device-width',
  initialScale: 1,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="font-sans antialiased bg-background">
        <ThemeProvider defaultTheme="system" storageKey="medichain-theme" attribute="class">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

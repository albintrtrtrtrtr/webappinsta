import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppWrapper } from '@/components/layout/AppWrapper';

export const metadata: Metadata = {
  title: 'InstaGame | Real-Time Multiplayer Party & Social Platform',
  description: 'Jackbox-style party games, Hinge-style social discovery, and instant Instagram story results.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'InstaGame — Real-Time Party & Dating Showdown',
    description: 'Play with strangers, reveal mutual crushes, and battle in couples telepathy challenges.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#090514',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased overflow-x-hidden min-h-screen">
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}

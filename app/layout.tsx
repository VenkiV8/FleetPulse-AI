import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FleetPulse AI | Autonomous Dispatch Tower',
  description:
    'Real-time AI-powered logistics control tower for proactive fleet management, disruption response, and autonomous dispatch optimization across India.',
  keywords: ['logistics', 'fleet management', 'AI dispatch', 'control tower', 'supply chain'],
  authors: [{ name: 'FleetPulse AI' }],
  openGraph: {
    title: 'FleetPulse AI | Autonomous Dispatch Tower',
    description: 'AI-powered logistics control tower for real-time fleet intelligence',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

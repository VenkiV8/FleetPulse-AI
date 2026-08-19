import type { Metadata } from 'next';
import { League_Spartan, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

// Major headings — bold geometric sans, premium control-tower feel
const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['500', '600', '700', '800'],
  display: 'swap',
});

// Body / UI text — clean modern humanist, excellent legibility at small sizes
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

// Monospace — telemetry values, IDs, code
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
    <html lang="en" className={`${leagueSpartan.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

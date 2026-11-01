import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BTC Options Research Terminal | Binance 1-Second Empirical Analytics',
  description: 'Deterministic Bitcoin options selling analytics backed by 9 years of real Binance 1-second ticks. Safety heatmaps, strike finder, empirical stop-loss planner, and backtester.',
  keywords: ['BTC options', 'options selling', 'Binance 1s data', 'Bitcoin volatility', 'options backtesting', 'short strangle', 'Black-Scholes'],
  openGraph: {
    title: 'BTC Options Research Terminal',
    description: 'Stop guessing which day or strike is safe. 9 years of Binance 1-second BTCUSDT history analyzed with statistical honesty.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0B0D0E] text-[#EDEDED] antialiased">
        {children}
      </body>
    </html>
  );
}


import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
export const metadata: Metadata = { title: 'Ledger — Business intelligence, in conversation', description: 'Explore customers, orders, and revenue with your private business data assistant.' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><ClerkProvider>{children}</ClerkProvider></body></html>;
}

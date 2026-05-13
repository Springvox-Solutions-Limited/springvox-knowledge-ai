import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SpringVox Knowledge AI',
  description: 'Private, enterprise-grade AI knowledge platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SpringVox Knowledge AI',
  description: 'Private, enterprise-grade AI knowledge platform',
  icons: {
    icon: [
      { url: '/brand/springvox-logo.png', type: 'image/png' },
      { url: '/brand/springvox-logo-light.png', type: 'image/png' },
    ],
    shortcut: ['/brand/springvox-logo.png'],
    apple: [{ url: '/brand/springvox-logo-light.png', type: 'image/png' }],
  },
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

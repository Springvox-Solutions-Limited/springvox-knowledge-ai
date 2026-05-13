import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpringVox Knowledge AI",
  description: "Private, enterprise-grade AI knowledge platform",
  icons: {
    icon: [{ url: "/brand/favicon.jpeg", type: "image/jpeg" }],
    shortcut: ["/brand/favicon.jpeg"],
    apple: [{ url: "/brand/favicon.jpeg", type: "image/jpeg" }],
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

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SpringVox Knowledge AI",
  description: "Turn your company documents into instant AI answers. Secure, source-grounded knowledge for enterprise teams. Start free.",
  icons: {
    icon: [{ url: "/brand/favicon.jpeg", type: "image/jpeg" }],
    shortcut: ["/brand/favicon.jpeg"],
    apple: [{ url: "/brand/favicon.jpeg", type: "image/jpeg" }],
  },
  openGraph: {
    title: "SpringVox Knowledge AI — Your Company Knowledge, AI-Powered Answers",
    description: "Turn documents into instant answers your team can trust. Source-grounded AI for enterprise teams.",
    type: "website",
    url: "https://springvox-knowledge-ai.vercel.app",
    siteName: "SpringVox",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${inter.className} font-sans`}>
      <body suppressHydrationWarning className="overflow-x-hidden antialiased">
        <TooltipProvider>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}

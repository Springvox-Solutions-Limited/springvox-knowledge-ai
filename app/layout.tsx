import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieConsentGate } from "@/src/components/consent/CookieConsentGate";
import { Toaster } from "@/components/ui/sonner";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});


export const metadata: Metadata = {
  metadataBase: new URL("https://rekalliq.springvoxsl.com"),
  title: {
    default: "Rekall-IQ — Every answer comes with its source",
    template: "%s — Rekall-IQ",
  },
  description:
    "Rekall-IQ turns approved company documents into cited answers your staff can check in one click. Workspace-isolated, source-grounded, and free during beta.",
  icons: {
    icon: [
      { url: "/brand/rekall-logo.png", type: "image/png" },
      { url: "/brand/rekall-mark.jpeg", type: "image/jpeg", sizes: "512x512" },
    ],
    shortcut: ["/brand/rekall-logo.png"],
    apple: [{ url: "/brand/rekall-mark.jpeg", type: "image/jpeg" }],
  },
  openGraph: {
    title: "Rekall-IQ — Every answer comes with its source",
    description:
      "Cited answers from the documents your company has approved.",
    url: "https://rekalliq.springvoxsl.com",
    siteName: "Rekall-IQ",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rekall-IQ",
    description:
      "Cited answers from the documents your company has approved.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${inter.className} font-sans`}
    >
      <body suppressHydrationWarning className="overflow-x-hidden antialiased">
        <TooltipProvider>
          {children}
          <CookieConsentGate />
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}

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
  title: "SpringVox Knowledge AI | Your Company Knowledge. AI-Powered Answers.",
  description:
    "Turn approved company documents into a secure AI assistant. Teams get instant, sourced answers from policies, handbooks, and procedures. No credit card required.",
  icons: {
    icon: [{ url: "/brand/favicon.jpeg", type: "image/jpeg" }],
    shortcut: ["/brand/favicon.jpeg"],
    apple: [{ url: "/brand/favicon.jpeg", type: "image/jpeg" }],
  },
  openGraph: {
    title: "SpringVox Knowledge AI | Your Company Knowledge. AI-Powered Answers.",
    description:
      "Stop wasting hours searching for policies. SpringVox gives every team a secure AI assistant that answers instantly from approved company documents.",
    url: "https://springvox.ai",
    siteName: "SpringVox Knowledge AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpringVox Knowledge AI",
    description:
      "Turn approved company documents into a secure AI assistant for your team.",
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
    <html lang="en" className={`${inter.variable} ${inter.className} font-sans`}>
      <body suppressHydrationWarning className="overflow-x-hidden antialiased">
        <TooltipProvider>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "SpringVox Knowledge AI",
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web",
                description:
                  "Turn approved company documents into a secure AI assistant. Teams get instant, sourced answers from policies, handbooks, and procedures.",
                offers: [
                  {
                    "@type": "Offer",
                    name: "Free",
                    price: "0",
                    priceCurrency: "USD",
                    description:
                      "For teams validating document AI with a controlled workspace.",
                  },
                  {
                    "@type": "Offer",
                    name: "Business",
                    price: "299",
                    priceCurrency: "USD",
                    description:
                      "For organisations rolling out SpringVox across departments.",
                  },
                ],
              }),
            }}
          />
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

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
    <html lang="en" className="font-sans">
      <body suppressHydrationWarning className="overflow-x-hidden">
        <TooltipProvider>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";

import { LandingPage } from "@/src/components/marketing/LandingPage";
import { JsonLd } from "@/src/components/shared/JsonLd";
import { SiteShell } from "@/src/components/marketing/SiteShell";

const SITE_URL = "https://rekalliq.springvoxsl.com";

export const metadata: Metadata = {
  title: "Rekall-IQ — Every answer comes with its source",
  description:
    "Rekall-IQ turns approved company documents into cited answers your staff can check in one click. Workspace-isolated, source-grounded, and free during beta.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Rekall-IQ — Every answer comes with its source",
    description:
      "Cited answers from the documents your company has approved.",
    url: SITE_URL,
    siteName: "Rekall-IQ",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Rekall-IQ — Every answer comes with its source" }],
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Rekall-IQ",
  url: SITE_URL,
  logo: `${SITE_URL}/brand/rekall-icon.svg`,
  description:
    "A workspace for cited answers built from a company's approved documents.",
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Rekall-IQ",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Turn approved company documents into cited answers for staff, scoped to a private workspace.",
  url: SITE_URL,
  offers: {
    "@type": "Offer",
    name: "Essential",
    price: "0",
    priceCurrency: "USD",
    description: "Free during beta.",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How is this different from a general chatbot?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Rekall-IQ answers from the documents you upload, not the open web. Replies name the files behind them, and anything outside those files is out of scope.",
      },
    },
    {
      "@type": "Question",
      name: "What file types are supported?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "PDF, DOCX, XLSX, PPTX, CSV, and TXT. Each upload gets a summary, keywords, and a category.",
      },
    },
    {
      "@type": "Question",
      name: "How long does processing take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most documents finish in a few minutes. Large batches run in the background and appear as processing in the dashboard.",
      },
    },
    {
      "@type": "Question",
      name: "Can I control who sees what?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Workspace admins upload documents and manage users. Viewers can ask questions and read answers; they cannot upload, delete, or change workspace settings. Nobody can cross workspace boundaries.",
      },
    },
    {
      "@type": "Question",
      name: "Where is my data stored?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Documents are stored in Supabase Storage, chunks in Postgres, and vectors in Qdrant, all keyed by workspace. Hosting and model providers are named on the data handling page.",
      },
    },
    {
      "@type": "Question",
      name: "What happens when the documents do not answer the question?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The answer says so, and the question is recorded as a knowledge gap for admins to review.",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <SiteShell>
      <JsonLd data={organizationSchema} />
      <JsonLd data={softwareSchema} />
      <JsonLd data={faqSchema} />
      <LandingPage />
    </SiteShell>
  );
}

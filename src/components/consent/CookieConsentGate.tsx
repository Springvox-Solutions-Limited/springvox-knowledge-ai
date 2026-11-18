"use client";

import { usePathname } from "next/navigation";

import { CookieConsent } from "./CookieConsent";

const APP_PREFIXES = ["/dashboard", "/platform", "/invite", "/billing-required"];

export function CookieConsentGate() {
  const pathname = usePathname();
  if (APP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return null;
  }
  return <CookieConsent />;
}

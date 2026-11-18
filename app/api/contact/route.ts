import { NextResponse } from "next/server";

import { sendEmail } from "@/src/lib/email";
import {
  BETA_RATE_LIMITS,
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
} from "@/src/lib/rate-limit";

export const runtime = "nodejs";

const CONTACT_TO = "hello@springvoxsl.com";

type Payload = Record<string, unknown>;

function asString(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function escapeHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").slice(0, 160);
}

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot: real people leave this empty.
  if (asString(body.website, 200)) {
    return NextResponse.json({ ok: true, delivered: false });
  }

  const name = asString(body.name, 100);
  const email = asString(body.email, 200);
  const company = asString(body.company, 120);
  const teamSize = asString(body.teamSize, 40);
  const reason = asString(body.reason, 60);
  const message = asString(body.message, 4000);

  if (name.length < 2 || message.length < 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Add a name, a valid email, and a message of at least 10 characters." },
      { status: 400 },
    );
  }

  const limits = BETA_RATE_LIMITS.contact;
  try {
    const result = await checkRateLimit({
      key: `contact:${getClientIp(request)}`,
      scope: "contact",
      limit: limits.limit,
      windowSeconds: limits.windowSeconds,
    });
    if (!result.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many messages from this connection. Try again later." },
        { status: 429, headers: rateLimitHeaders(result) },
      );
    }
  } catch (error) {
    // Fail open: a database problem must not lose a sales enquiry.
    console.warn("[Contact] rate limit unavailable:", error);
  }

  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Company: ${company || "Not given"}`,
    `Team size: ${teamSize || "Not given"}`,
    `Reason: ${reason || "Not given"}`,
    "",
    message,
  ].join("\n");

  try {
    const result = await sendEmail({
      to: CONTACT_TO,
      subject: escapeHeader(`[Contact] ${reason || "Website"} — ${company || name}`),
      text,
    });

    return NextResponse.json({ ok: true, delivered: !result.skipped });
  } catch (error) {
    // Do not present a dead end when the mail provider is misconfigured. The
    // client keeps the submitted details and offers a prefilled mailto fallback.
    console.error("[Contact] send failed:", error);
    return NextResponse.json({ ok: true, delivered: false, fallback: "email" });
  }
}

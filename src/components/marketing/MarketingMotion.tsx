"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Restrained, transform-only motion for the public site.
 *
 * Content is always visible in the DOM. GSAP only ever offsets elements by a
 * few pixels and settles them back, so a failed script or a reduced-motion
 * preference leaves the page fully readable.
 */
export function MarketingMotion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const lines = element.querySelectorAll("[data-hero-line]");
        const visual = element.querySelector("[data-hero-visual]");
        const panel = element.querySelector("[data-answer-panel]");
        const railRows = element.querySelectorAll("[data-cite-rail] li");
        const receiptRows = element.querySelectorAll("[data-receipt-row]");

        const intro = gsap.timeline({
          defaults: { ease: "power3.out" },
          delay: 0.1,
        });

        if (lines.length) {
          intro.from(
            lines,
            { y: 20, duration: 0.7, stagger: 0.07 },
            0,
          );
        }

        if (visual) {
          intro.from(
            visual,
            { y: 34, scale: 0.985, duration: 1, ease: "power3.out" },
            0.12,
          );
        }

        if (panel) {
          intro.fromTo(
            panel,
            { y: 32, rotateX: 5 },
            { y: 0, rotateX: 0, duration: 0.9 },
            0.1,
          );
        }

        if (railRows.length) {
          intro.from(
            railRows,
            { y: 10, duration: 0.5, stagger: 0.08 },
            0.35,
          );
        }

        if (receiptRows.length) {
          intro.from(receiptRows, { y: 8, duration: 0.45, stagger: 0.06 }, 0.3);
        }

        element.querySelectorAll<HTMLElement>("[data-ledger]").forEach((ledger) => {
          gsap.from(ledger.querySelectorAll("rect"), {
            scaleY: 0,
            transformOrigin: "bottom center",
            duration: 0.7,
            stagger: 0.05,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ledger,
              start: "top 88%",
              once: true,
              invalidateOnRefresh: true,
            },
          });
        });

        element.querySelectorAll<HTMLElement>("[data-reveal]").forEach((node) => {
          gsap.from(node, {
            y: 18,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: {
              trigger: node,
              start: "top 90%",
              once: true,
              invalidateOnRefresh: true,
            },
          });
        });

        return () => {
          intro.kill();
        };
      });

      return () => mm.revert();
    }, element);

    // Layout must be settled before ScrollTrigger measures trigger points.
    let disposed = false;
    const refresh = () => {
      if (!disposed) ScrollTrigger.refresh();
    };
    const timers = [setTimeout(refresh, 200), setTimeout(refresh, 900)];
    const onLoad = () => refresh();

    if (document.fonts?.ready) {
      document.fonts.ready.then(refresh).catch(() => undefined);
    }
    window.addEventListener("load", onLoad);
    window.addEventListener("orientationchange", onLoad);

    return () => {
      disposed = true;
      timers.forEach(clearTimeout);
      window.removeEventListener("load", onLoad);
      window.removeEventListener("orientationchange", onLoad);
      context.revert();
    };
  }, []);

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}

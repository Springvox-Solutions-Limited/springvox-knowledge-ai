import Image from "next/image";

import { cn } from "@/src/lib/utils";

type BrandLogoProps = {
  variant?: "full" | "mark";
  /** @deprecated The product uses one dark surface; kept for call-site compatibility. */
  theme?: "light" | "dark";
  className?: string;
  imageClassName?: string;
};

type BrandMarkProps = {
  className?: string;
};

/**
 * Original Rekall-IQ mark. Gradient "R" raster asset, recovered from the
 * pre-rebrand build. Do not replace with an invented vector.
 */
export function RekallMark({ className }: BrandMarkProps) {
  return (
    <Image
      src="/brand/rekall-mark.png"
      alt=""
      width={64}
      height={64}
      aria-hidden="true"
      className={cn("h-8 w-8 shrink-0 object-contain", className)}
    />
  );
}

/** @deprecated Use RekallMark. Kept so older imports keep compiling. */
export function RekallIQMark({ className }: BrandMarkProps) {
  return <RekallMark className={className} />;
}

export function BrandLogo({
  variant = "full",
  className,
  imageClassName,
}: BrandLogoProps) {
  if (variant === "mark") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Image
          src="/brand/rekall-mark.png"
          alt="Rekall-IQ"
          width={64}
          height={64}
          priority
          className={cn("h-8 w-8 object-contain", imageClassName)}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <Image
        src="/brand/rekall-logo.png"
        alt=""
        width={165}
        height={165}
        priority
        aria-hidden="true"
        className={cn(
          "h-9 w-auto max-w-[165px] shrink-0 object-contain",
          imageClassName,
        )}
      />
      <span className="text-[18px] font-semibold leading-none tracking-tight text-[var(--ink)] sm:text-[19px]">
        Rekall<span className="text-[var(--accent-jade)]">-IQ</span>
      </span>
    </div>
  );
}

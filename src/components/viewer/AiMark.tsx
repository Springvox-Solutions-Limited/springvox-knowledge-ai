import Image from "next/image";

import { cn } from "@/src/lib/utils";

export function AiMark({
  className,
  size = 16,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      src="/brand/rekall-mark.png"
      alt=""
      width={size}
      height={size}
      aria-hidden="true"
      className={cn("shrink-0 object-contain", className)}
    />
  );
}

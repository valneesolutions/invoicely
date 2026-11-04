"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

export function AssetImage(props: ImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === String(props.src))
    return (
      <div
        role="alert"
        onClick={(e) => e.stopPropagation()}
        className="text-muted-foreground flex min-h-28 items-center justify-center rounded border border-dashed p-3 text-center text-xs"
      >
        Image unavailable. Re-upload it or choose another image.
      </div>
    );
  return <Image {...props} alt={props.alt} unoptimized onError={() => setFailedSrc(String(props.src))} />;
}

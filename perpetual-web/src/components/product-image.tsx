"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductImage({
  src,
  alt,
  title,
}: {
  src: string;
  alt: string;
  title: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (failedSource === src) {
    return <span className="product-placeholder">{title}</span>;
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes="(max-width:760px) 100vw, 50vw"
      onError={() => setFailedSource(src)}
    />
  );
}

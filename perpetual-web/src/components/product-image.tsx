"use client";
import Image from "next/image";
import { useState } from "react";
export function ProductImage({
  src,
  alt,
  title,
  fallbackSrc,
  sizes = "(max-width:760px) 100vw, 50vw",
  eager = false,
}: {
  src: string;
  alt: string;
  title: string;
  fallbackSrc?: string;
  sizes?: string;
  eager?: boolean;
}) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const source = failedSources.includes(src) ? fallbackSrc : src;
  if (!source || failedSources.includes(source))
    return <span className="product-placeholder">{title}</span>;
  return (
    <Image
      src={source}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailedSources((previous) => [...previous, source])}
    />
  );
}

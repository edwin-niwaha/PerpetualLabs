import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { content } from "@/lib/api";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = ["", "/about", "/services", "/projects", "/blog", "/contact"];
  const collections = await Promise.all(
    (["services", "projects", "blog"] as const).map(async (kind) =>
      (await content(kind)).items.map((item) => `/${kind}/${item.slug}`),
    ),
  );
  return [...paths, ...collections.flat()].map((path) => ({
    url: siteUrl + path,
  }));
}

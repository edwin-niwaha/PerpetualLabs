import Link from "next/link";
import { ProductImage } from "./product-image";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { safeImage, safeWebsite } from "@/lib/site";
import { projectImage } from "@/lib/mobile-projects";
export function ProductGrid({ items }: { items: Product[] }) {
  return (
    <div className="product-grid">
      {items.map((item, index) => {
        const fallback = projectImage(item.slug);
        const image = fallback || safeImage(item.image);
        const mobile = item.project_type?.startsWith("Mobile application");
        const website = safeWebsite(item.website_url);
        return (
          <article
            className={`product-card product-color-${index % 4}`}
            key={item.id}
          >
            <Link
              className="product-visual"
              href={`/projects/${item.slug}`}
              aria-label={`Explore ${item.title}`}
            >
              {image ? (
                <ProductImage
                  src={image}
                  alt={item.image_alt || item.title}
                  title={item.title}
                  fallbackSrc={fallback}
                />
              ) : (
                <span className="product-placeholder">{item.title}</span>
              )}
              <span className="product-status">
                <i />
                {item.status === "complete"
                  ? "Complete"
                  : item.status === "live"
                    ? "Live product"
                    : item.status === "development"
                      ? "In development"
                      : mobile
                        ? "Mobile application"
                        : "Business software"}
              </span>
              <span className="product-arrow">
                <ArrowUpRight size={23} />
              </span>
            </Link>
            <div className="product-copy">
              <span className="eyebrow">{item.project_type}</span>
              <h3>
                <Link href={`/projects/${item.slug}`}>{item.title}</Link>
              </h3>
              <p>{item.description}</p>
              <div className="product-card-footer">
                <Link className="text-link" href={`/projects/${item.slug}`}>
                  {mobile ? "Explore app" : "Explore product"}{" "}
                  <ArrowRight size={17} />
                </Link>
                {website && item.status === "live" && (
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link"
                  >
                    Visit website <ArrowUpRight size={17} />
                  </a>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

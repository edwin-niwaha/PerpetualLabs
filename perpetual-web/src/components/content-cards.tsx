import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Layers,
  Code2,
  Workflow,
  Network,
  ShieldCheck,
  Database,
  Compass,
  Cloud,
} from "lucide-react";
import type { Service, Project, Article } from "@/lib/types";
import { safeImage } from "@/lib/site";
import { ProjectArtwork } from "./project-artwork";
export function ServicesGrid({ items }: { items: Service[] }) {
  const icons = {
    code: Code2,
    workflow: Workflow,
    network: Network,
    shield: ShieldCheck,
    database: Database,
    compass: Compass,
    cloud: Cloud,
  };
  return (
    <div className="service-grid">
      {items.map((item, i) => {
        const Icon = icons[item.icon as keyof typeof icons] || Layers;
        return (
          <Link
            className="service-card"
            key={item.id}
            href={`/services/${item.slug}`}
          >
            <div className="card-top">
              <Icon size={28} strokeWidth={1.4} />
              <span>{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            {!!item.highlights?.length && (
              <ul className="service-highlights">
                {item.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            )}
            <span className="card-bottom">
              Explore service
              <ArrowUpRight size={21} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
export function ProjectsGrid({ items }: { items: Project[] }) {
  return (
    <div className="project-grid">
      {items.map((item, i) => (
        <Link
          className="project-card"
          href={`/projects/${item.slug}`}
          key={item.id}
        >
          <div className={`project-image project-tone-${i % 3}`}>
            {safeImage(item.image) ? (
              <>
                <Image
                  src={safeImage(item.image)!}
                  alt={item.title}
                  fill
                  sizes={
                    items.length === 1
                      ? "100vw"
                      : "(max-width: 760px) 100vw, 50vw"
                  }
                />
                <span className="project-open">
                  <ArrowUpRight />
                </span>
              </>
            ) : (
              <ProjectArtwork project={item} index={i} />
            )}
          </div>
          <div className="project-info">
            <div>
              <span className="eyebrow">
                {item.project_type ||
                  item.technologies?.slice(0, 3).join(" / ") ||
                  "Project"}
              </span>
              <h3>{item.title}</h3>
            </div>
            {item.completion_date && (
              <span className="muted">
                {new Date(item.completion_date).getFullYear()}
              </span>
            )}
          </div>
          <p>{item.description}</p>
        </Link>
      ))}
    </div>
  );
}
export function ArticlesGrid({ items }: { items: Article[] }) {
  return (
    <div className="article-grid">
      {items.map((item) => (
        <Link
          className="article-card"
          href={`/blog/${item.slug}`}
          key={item.id}
        >
          <span className="eyebrow">{item.category || "From the journal"}</span>
          <h3>{item.title}</h3>
          <p>{item.excerpt}</p>
          <div className="card-bottom">
            <time dateTime={item.created_at}>
              {new Date(item.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </time>
            <ArrowUpRight size={21} />
          </div>
        </Link>
      ))}
    </div>
  );
}

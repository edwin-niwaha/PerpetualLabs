import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/types";
export function ProjectArtwork({
  project,
  index = 0,
}: {
  project: Project;
  index?: number;
}) {
  return (
    <div className={`project-artwork artwork-${index % 4}`} aria-hidden="true">
      <div className="artwork-header">
        <span>PERPETUAL LABS / PRODUCT SERIES</span>
        <span>{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="artwork-orbit" />
      <div className="artwork-title">
        {project.title}
        <span>↗</span>
      </div>
      <div className="artwork-footer">
        <span>{project.project_type || "Digital product"}</span>
        <ArrowUpRight size={22} />
      </div>
    </div>
  );
}

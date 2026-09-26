import type { ReactNode } from "react";
import { GalaxyAuth } from "./galaxy-auth";
import { Eyebrow } from "./ui";
import { content } from "@/lib/api";
import { safeImage, safeWebsite } from "@/lib/site";

export async function AccountAuthPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const visuals = await content("visuals");
  const galaxy = visuals.items.find((v) => v.key === "galaxy");
  const earth = visuals.items.find((v) => v.key === "earth");
  return (
    <GalaxyAuth
      galaxy={safeImage(galaxy?.image)}
      earth={safeImage(earth?.image)}
      credit={galaxy?.credit || ""}
      source={safeWebsite(galaxy?.source_url)}
    >
      <Eyebrow>Perpetual Labs · Client portal</Eyebrow>
      <h1>{title}</h1>
      <p className="muted">{description}</p>
      {children}
    </GalaxyAuth>
  );
}

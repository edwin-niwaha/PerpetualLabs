import type { ReactNode } from "react";
import { GalaxyAuth } from "./galaxy-auth";
import { Eyebrow } from "./ui";

export async function AccountAuthPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <GalaxyAuth>
      <Eyebrow>Perpetual Labs · Client portal</Eyebrow>
      <h1>{title}</h1>
      <p className="muted">{description}</p>
      {children}
    </GalaxyAuth>
  );
}

import "server-only";
import { cache } from "react";
import { api } from "./api";
import defaults from "./site-defaults.json";

export type Section = {
  id?: number;
  key: string;
  eyebrow: string;
  title: string;
  description: string;
};
export type WebsiteContent = {
  settings: typeof defaults.settings | null;
  sections: Section[];
  faqs: {
    id?: number;
    question: string;
    answer: string;
    sort_order: number;
    is_published: boolean;
  }[];
  features: {
    id?: number;
    group: string;
    title: string;
    description: string;
    sort_order: number;
    is_published: boolean;
  }[];
};
export const websiteContent = cache(async () => {
  let data: WebsiteContent;
  let unavailable = false;
  try {
    data = await api<WebsiteContent>("/api/content/");
    if (
      !data ||
      !Array.isArray(data.sections) ||
      !Array.isArray(data.faqs) ||
      !Array.isArray(data.features)
    )
      throw new Error("Invalid content");
  } catch {
    data = defaults;
    unavailable = true;
  }
  const settings = data.settings || defaults.settings;
  return {
    ...data,
    unavailable,
    company: {
      ...settings,
      phoneHref: `tel:${settings.phone.replace(/[^+\d]/g, "")}`,
    },
    section: (key: string): Section =>
      data.sections.find((s) => s.key === key) ||
      defaults.sections.find((s) => s.key === key)!,
  };
});

import projectImages from "./project-images.json";
import type { Product } from "./types";

// Portfolio summaries reviewed against the local mobile application sources.
export const mobileProjects: Product[] = [
  {
    id: -101,
    slug: "pendezaconnect-mobile",
    name: "PendezaConnect Mobile",
    title: "PendezaConnect Mobile",
    description:
      "Community care, wherever work takes you. A mobile workspace for sponsorship, savings, loans, and the people behind them.",
    detail:
      "Built for Pendeza Connect staff, sponsors, and clients, the mobile application brings role-aware dashboards, payments, profile management, and field photo capture together. Teams can support children and families while staying connected to their everyday work.",
    image: "/images/projects/pendezaconnect-mobile.svg",
    image_alt:
      "PendezaConnect mobile interface illustration showing a community dashboard and services in two phone mockups",
    technologies: ["React Native", "Expo", "TypeScript"],
    completion_date: null,
    project_type: "Mobile application · Community & finance",
    focus: [
      "Role-aware dashboards",
      "Sponsorship and payments",
      "Loans and savings",
      "Field photo capture",
    ],
    website_url: null,
    status: "available",
    is_featured: false,
    is_published: true,
    sort_order: 4,
  },
  {
    id: -102,
    slug: "duukayo-mobile",
    name: "DuukaYo Mobile",
    title: "DuukaYo Mobile",
    description:
      "Your shop, in your pocket. Discover stores, manage orders, and bring everyday retail checkout onto mobile.",
    detail:
      "The DuukaYo mobile application connects shopping and retail operations through store discovery, wishlists, a shopping cart, checkout, and order tracking. Its point-of-sale workflow also supports offline cash checkout, helping retailers keep serving customers when connectivity is limited.",
    image: "/images/projects/duukayo-mobile.svg",
    image_alt:
      "DuukaYo mobile interface illustration showing shopping and checkout in two phone mockups",
    technologies: ["React Native", "Expo", "TypeScript", "SQLite"],
    completion_date: null,
    project_type: "Mobile application · Shopping & retail",
    focus: [
      "Store discovery and wishlists",
      "Cart and order tracking",
      "Mobile point of sale",
      "Offline cash checkout",
    ],
    website_url: null,
    status: "development",
    is_featured: false,
    is_published: true,
    sort_order: 5,
  },
];

// Shipped with the frontend so portfolio artwork does not depend on API media storage.
export function projectImage(slug: string) {
  const asset = (projectImages as Record<string, string>)[slug];
  return asset ? `/images/projects/${asset}` : undefined;
}

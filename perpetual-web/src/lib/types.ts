export type Service = {
  id: number;
  title: string;
  description: string;
  icon: string;
  highlights?: string[];
  slug: string;
};
export type Project = {
  id: number;
  title: string;
  description: string;
  detail: string | null;
  image: string;
  slug: string;
  technologies: string[];
  completion_date: string | null;
  project_type?: string;
  focus?: string[];
  website_url: string | null;
};
export type Article = {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  slug: string;
  author: string;
  category: string | null;
  created_at: string;
  published_at?: string | null;
  updated_at?: string;
};
export type Testimonial = {
  id: number;
  name: string;
  position: string;
  company: string | null;
  content: string;
  image: string;
};
export type TeamMember = {
  id: number;
  name: string;
  position: string;
  image: string;
};
export type Profile = {
  date_of_birth?: string | null;
  profile_picture?: string | null;
  is_staff: boolean;
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
};
export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export type ContentMap = {
  services: Service;
  products: Product;
  visuals: SiteVisual;
  projects: Project;
  blog: Article;
  testimonials: Testimonial;
  team: TeamMember;
};

export type Product = Project & {
  name: string;
  image_alt: string;
  status: "live" | "development" | "available";
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
};
export type SiteVisual = {
  key: string;
  image: string;
  alt: string;
  credit: string;
  source_url: string;
};

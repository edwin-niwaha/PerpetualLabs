export type Service = {
  id: number;
  title: string;
  description: string;
  icon: string;
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
  completion_date: string;
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

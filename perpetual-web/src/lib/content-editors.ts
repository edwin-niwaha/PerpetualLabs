export type EditorField = {
  name: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "email"
    | "url"
    | "number"
    | "checkbox"
    | "select"
    | "lines"
    | "image";
  removable?: boolean;
  required?: boolean;
  maxLength?: number;
  options?: { value: string; label: string }[];
};
export type EditorConfig = {
  title: string;
  description: string;
  endpoint: string;
  singleton?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
  fields: EditorField[];
};
const publication: EditorField[] = [
  {
    name: "sort_order",
    label: "Display order",
    type: "number",
    required: true,
  },
  { name: "is_published", label: "Published on the website", type: "checkbox" },
];
export const editors: Record<string, EditorConfig> = {
  team: {
    title: "People of Perpetual",
    description:
      "Add team members and upload, replace or remove their About page portraits.",
    endpoint: "/api/manage/team/",
    canCreate: true,
    canDelete: true,
    fields: [
      { name: "name", label: "Full name", required: true, maxLength: 255 },
      {
        name: "position",
        label: "Position",
        type: "select",
        options: [
          { value: "lead_developer", label: "Lead Developer" },
          { value: "security_specialist", label: "Security Specialist" },
          { value: "ceo_founder", label: "CEO & Founder" },
          { value: "cto", label: "CTO" },
          { value: "marketing_officer", label: "Marketing Officer" },
        ],
      },
      { name: "portrait", label: "Portrait", type: "image", removable: true },
    ],
  },
  services: {
    title: "Services",
    description: "Create and update the services shown on the website.",
    endpoint: "/api/manage/services/",
    canCreate: true,
    canDelete: true,
    fields: [
      {
        name: "highlights",
        label: "Highlights (one per line, up to 12)",
        type: "lines",
        maxLength: 1500,
      },
      { name: "title", label: "Service title", required: true, maxLength: 255 },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
        maxLength: 10000,
      },
      {
        name: "icon",
        label: "Icon name (e.g. code, shield, globe)",
        required: true,
        maxLength: 255,
      },
    ],
  },
  testimonials: {
    title: "Testimonials",
    description: "Manage client quotes and their portraits.",
    endpoint: "/api/manage/testimonials/",
    canCreate: true,
    canDelete: true,
    fields: [
      { name: "name", label: "Client name", required: true, maxLength: 255 },
      {
        name: "position",
        label: "Role and company",
        required: true,
        maxLength: 255,
      },
      {
        name: "content",
        label: "Quote",
        type: "textarea",
        required: true,
        maxLength: 10000,
      },
      {
        name: "portrait",
        label: "Client portrait",
        type: "image",
        removable: true,
      },
    ],
  },
  visuals: {
    title: "Site images",
    description:
      "Replace website artwork and maintain its accessible description and credit.",
    endpoint: "/api/manage/visuals/",
    fields: [
      { name: "image", label: "Website image", type: "image" },
      {
        name: "alt",
        label: "Image description",
        required: true,
        maxLength: 255,
      },
      { name: "credit", label: "Image credit", maxLength: 500 },
      { name: "source_url", label: "Source URL", type: "url", maxLength: 200 },
    ],
  },
  settings: {
    title: "Company details",
    description:
      "Contact information, location, mission and vision used across the website.",
    endpoint: "/api/content/settings/",
    singleton: true,
    fields: [
      { name: "name", label: "Company name", required: true, maxLength: 120 },
      { name: "location", label: "Location", required: true, maxLength: 180 },
      { name: "founded", label: "Year founded", required: true, maxLength: 4 },
      { name: "phone", label: "Phone number", required: true, maxLength: 40 },
      {
        name: "email",
        label: "Contact email",
        type: "email",
        required: true,
        maxLength: 254,
      },
      {
        name: "whatsapp",
        label: "WhatsApp HTTPS link",
        type: "url",
        required: true,
        maxLength: 200,
      },
      {
        name: "introduction",
        label: "Introduction",
        type: "textarea",
        required: true,
        maxLength: 2000,
      },
      {
        name: "mission",
        label: "Mission",
        type: "textarea",
        required: true,
        maxLength: 2000,
      },
      {
        name: "vision",
        label: "Vision",
        type: "textarea",
        required: true,
        maxLength: 2000,
      },
    ],
  },
  sections: {
    title: "Page copy",
    description:
      "Edit headings and introductions. Line breaks are supported in hero headings.",
    endpoint: "/api/content/sections/",
    fields: [
      {
        name: "eyebrow",
        label: "Section label",
        required: true,
        maxLength: 180,
      },
      {
        name: "title",
        label: "Heading",
        type: "textarea",
        required: true,
        maxLength: 300,
      },
      {
        name: "description",
        label: "Supporting text",
        type: "textarea",
        maxLength: 2000,
      },
    ],
  },
  faqs: {
    title: "FAQs",
    description:
      "Answer common questions. Unpublish an answer to remove it from the website.",
    endpoint: "/api/content/faqs/",
    canCreate: true,
    fields: [
      { name: "question", label: "Question", required: true, maxLength: 250 },
      {
        name: "answer",
        label: "Answer",
        type: "textarea",
        required: true,
        maxLength: 3000,
      },
      ...publication,
    ],
  },
  features: {
    title: "Approach & values",
    description:
      "Manage the approach on the home page and the values on the about page.",
    endpoint: "/api/content/features/",
    canCreate: true,
    fields: [
      {
        name: "group",
        label: "Show on",
        type: "select",
        required: true,
        options: [
          { value: "approach", label: "Home / Our approach" },
          { value: "values", label: "About / Company values" },
        ],
      },
      { name: "title", label: "Title", required: true, maxLength: 180 },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
        maxLength: 2000,
      },
      ...publication,
    ],
  },
  products: {
    title: "Products",
    description:
      "Create products, upload images, and manage their visibility on the website.",
    endpoint: "/api/projects/products/",
    canCreate: true,
    canDelete: true,
    fields: [
      { name: "name", label: "Product name", required: true, maxLength: 255 },
      { name: "image", label: "Product image", type: "image", removable: true },
      {
        name: "description",
        label: "Short description",
        type: "textarea",
        maxLength: 5000,
      },
      {
        name: "detail",
        label: "Full description",
        type: "textarea",
        maxLength: 20000,
      },
      { name: "category", label: "Category", maxLength: 100 },
      {
        name: "website_url",
        label: "Website HTTPS URL",
        type: "url",
        maxLength: 200,
      },
      { name: "image_alt", label: "Image description", maxLength: 255 },
      {
        name: "focus",
        label: "Features (one per line, up to 12)",
        type: "lines",
        maxLength: 1500,
      },
      {
        name: "status",
        label: "Availability",
        type: "select",
        options: [
          { value: "live", label: "Live" },
          { value: "development", label: "In development" },
          { value: "available", label: "Available" },
        ],
      },
      { name: "is_featured", label: "Featured on home page", type: "checkbox" },
      ...publication,
    ],
  },
};

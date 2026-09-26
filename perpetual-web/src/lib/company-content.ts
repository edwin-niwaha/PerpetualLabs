import type { ContentMap } from "./types";

// Reviewed content from perpetual-web-vert.vercel.app; see docs/content-sources.md.
// API collections take priority. These are editorial records, not database rows.
export const company = {
  name: "Perpetual Labs",
  location: "Kampala, Uganda",
  founded: "2020",
  phone: "+256 703 163 074",
  phoneHref: "tel:+256703163074",
  email: "hello.perpetuallabs@gmail.com",
  whatsapp: "https://wa.me/256703163074",
  introduction:
    "Websites, business software, and IT support for teams ready to work better. From Kampala, we help turn everyday challenges into practical digital solutions.",
  mission:
    "Give businesses the technology to work more efficiently, protect their information, and grow with confidence.",
  vision:
    "Make reliable, thoughtfully built technology a stronger foundation for business growth.",
};

export const referenceContent: { [K in keyof ContentMap]?: ContentMap[K][] } = {
  services: [
    {
      id: -1,
      slug: "web-development",
      title: "Web Development",
      icon: "code",
      description:
        "Customer-facing websites and web applications, designed around your business and the people who use them.",
      highlights: [
        "Responsive websites",
        "Online stores",
        "Content management",
      ],
    },
    {
      id: -2,
      slug: "custom-software",
      title: "Custom Software",
      icon: "workflow",
      description:
        "Purpose-built tools that simplify the way your team works and address the challenges off-the-shelf software cannot.",
      highlights: [
        "Business applications",
        "Workflow improvements",
        "Tailored functionality",
      ],
    },
    {
      id: -3,
      slug: "it-infrastructure",
      title: "IT Infrastructure",
      icon: "network",
      description:
        "The networks, servers, and systems your business depends on, planned for reliability and room to grow.",
      highlights: [
        "Network implementation",
        "Server management",
        "Virtualization",
      ],
    },
    {
      id: -4,
      slug: "cybersecurity",
      title: "Cybersecurity",
      icon: "shield",
      description:
        "Practical protection for your systems and information, supported by informed people and considered security controls.",
      highlights: [
        "Security reviews",
        "Firewalls and encryption",
        "Staff awareness",
      ],
    },
    {
      id: -5,
      slug: "database-management",
      title: "Database Management",
      icon: "database",
      description:
        "Organize, move, and maintain business data so it remains useful, accessible, and recoverable.",
      highlights: [
        "Database design",
        "Migration and integration",
        "Performance and backups",
      ],
    },
    {
      id: -6,
      slug: "it-consulting",
      title: "IT Consulting",
      icon: "compass",
      description:
        "A clearer view of your technology choices, grounded in what your business needs to achieve.",
      highlights: [
        "Technology advice",
        "Business alignment",
        "Planning your next step",
      ],
    },
    {
      id: -7,
      slug: "cloud-services",
      title: "Cloud Services",
      icon: "cloud",
      description:
        "Move to the cloud and manage your environment with scalability and efficiency in mind.",
      highlights: ["Cloud migration", "Ongoing management", "Optimization"],
    },
  ],
  testimonials: [
    {
      id: -31,
      name: "Christbell",
      position: "CEO",
      company: "Jobell Inc.",
      content: "A truly professional and reliable team!",
      image: "",
    },
    {
      id: -32,
      name: "Samuel",
      position: "PD",
      company: "Kasenyi CDC",
      content: "Their custom solution has enhanced member management…",
      image: "",
    },
    {
      id: -33,
      name: "Christine",
      position: "ED",
      company: "Pendeza Uganda",
      content: "We can now track and manage sponsorships with ease!",
      image: "",
    },
  ],
};

export const questions = [
  {
    question: "What can you help my business with?",
    answer:
      "We work across websites, custom software, infrastructure, security, databases, cloud services, and IT consulting. Start with the business challenge; we can discuss which services fit.",
  },
  {
    question: "Can we talk about an existing system?",
    answer:
      "Yes. Tell us what you use today, what is getting in the way, and what you would like to improve. Our conversation can cover building, maintaining, or supporting your technology.",
  },
  {
    question: "How do we get started?",
    answer:
      "Use the contact form, email us, or call. A short description of your idea, current challenges, and priorities is enough to begin.",
  },
];

export function chooseContent<K extends keyof ContentMap>(
  kind: K,
  items: ContentMap[K][] | null,
): {
  items: ContentMap[K][];
  unavailable: boolean;
  source: "api" | "reference" | "unavailable";
} {
  if (items !== null) return { items, unavailable: false, source: "api" };
  const reference = referenceContent[kind] || [];
  return {
    items: reference,
    unavailable: items === null && reference.length === 0,
    source: reference.length
      ? "reference"
      : items === null
        ? "unavailable"
        : "api",
  };
}

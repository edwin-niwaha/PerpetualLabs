import type { ContentMap } from "./types";

// Reviewed content from perpetual-web-vert.vercel.app; see docs/content-sources.md.
// API collections take priority. These are editorial records, not database rows.
export const company = {
  name: "Perpetual Labs",
  location: "Kampala, Uganda",
  founded: "2020",
  phone: "+256 703 163 074",
  phoneHref: "tel:+256703163074",
  email: "perpetual.ict@gmail.com",
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
  projects: [
    {
      id: -11,
      slug: "pureshopper",
      title: "PureShopper",
      project_type: "E-commerce",
      description:
        "An online retail platform for managing products, orders, and the shopping experience.",
      detail:
        "Customizable storefront features support businesses as their online sales grow.",
      focus: ["Product listings", "Order management", "Online retail"],
      image: "",
      technologies: [],
      completion_date: "2024-12-31",
      website_url: null,
    },
    {
      id: -12,
      slug: "sponsorship-donor-management-software-sdms",
      title: "DonorLink",
      project_type: "Nonprofit operations",
      description:
        "Cloud-based donor and sponsorship management for NGOs, charities, and community organizations.",
      detail:
        "Bring supporter relationships, sponsorship administration, and fundraising insights into one place.",
      focus: [
        "Donor relationships",
        "Sponsorship management",
        "Fundraising insights",
      ],
      image: "",
      technologies: [],
      completion_date: "2022-04-23",
      website_url: null,
    },
    {
      id: -13,
      slug: "inventory-management-software",
      title: "StockTrack",
      project_type: "Sales & inventory",
      description:
        "Connected sales and stock management for smaller businesses across multiple selling channels.",
      detail:
        "Track inventory, plan replenishment, and understand sales through operational reporting.",
      focus: ["Stock tracking", "Reordering", "Sales reporting"],
      image: "",
      technologies: [],
      completion_date: "2021-04-11",
      website_url: null,
    },
    {
      id: -14,
      slug: "perpetual-accounting",
      title: "FinCore",
      project_type: "Accounting",
      description:
        "Financial management tools for individuals, small businesses, and growing teams.",
      detail:
        "Keep income, expenses, credit, and savings organized with reporting and automation.",
      focus: ["Income and expenses", "Credit management", "Savings goals"],
      image: "",
      technologies: [],
      completion_date: "2020-08-10",
      website_url: null,
    },
    {
      id: -15,
      slug: "human-resource-management-system-hrms",
      title: "CoreHR",
      project_type: "Human resources",
      description:
        "A central workspace for HR teams managing the employee lifecycle.",
      detail:
        "Connect recruitment, payroll, performance management, and employee engagement.",
      focus: ["Recruitment", "Payroll", "Performance management"],
      image: "",
      technologies: [],
      completion_date: null,
      website_url: null,
    },
    {
      id: -16,
      slug: "school-manager",
      title: "SchoolSync",
      project_type: "Education",
      description:
        "School administration software connecting staff, students, and parents.",
      detail:
        "Manage student records, attendance, family communication, and academic reports.",
      focus: ["Student records", "Attendance", "Academic reporting"],
      image: "",
      technologies: [],
      completion_date: null,
      website_url: null,
    },
  ],
  team: [
    { id: -21, name: "Edwin Niwaha", position: "CEO & Founder", image: "" },
    { id: -22, name: "Elijah Niwaha", position: "CTO", image: "" },
    { id: -23, name: "Albert Ashaba", position: "Lead Developer", image: "" },
    { id: -24, name: "Dennis Samba", position: "Lead Developer", image: "" },
    {
      id: -25,
      name: "Christbell Mujuni",
      position: "Marketing Officer",
      image: "",
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
  if (items?.length) return { items, unavailable: false, source: "api" };
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

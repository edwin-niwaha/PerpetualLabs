import type { Product } from "./types";

// Product descriptions and completion status supplied by Perpetual Labs.
export const businessProducts: Product[] = [
  {
    id: -103,
    slug: "perpetualhr",
    name: "PerpetualHr",
    title: "PerpetualHr",
    description:
      "People first. Paperwork simplified. A complete HR workspace for employees, managers, and HR administrators.",
    detail:
      "PerpetualHr brings the employee lifecycle into one human resource management system, from recruitment and onboarding to attendance, performance, and payroll. Employees can access their records, managers can handle approvals, and HR teams can coordinate their workforce. Payroll records and reporting are tailored to your country.",
    image: "/images/projects/perpetualhr.svg",
    image_alt:
      "PerpetualHr interface illustration with an employee directory, attendance overview, and leave approvals",
    technologies: [],
    completion_date: null,
    project_type: "Human Resource Management System",
    focus: [
      "Dashboard: headcount, attendance, pending approvals, and announcements.",
      "Employee directory: profiles, departments, contracts, and documents.",
      "Attendance and leave: clock-ins, leave balances, requests, and approvals.",
      "Recruitment and onboarding: candidates, offers, and onboarding tasks.",
      "Performance: goals, reviews, and manager feedback.",
      "Payroll: salary records, payslips, and payroll reports, tailored to your country.",
    ],
    website_url: null,
    status: "complete",
    is_featured: false,
    is_published: true,
    sort_order: 6,
  },
  {
    id: -104,
    slug: "perpetuallearn",
    name: "PerpetualLearn",
    title: "PerpetualLearn",
    description:
      "Room to learn. Space to grow. An e-learning platform in development for learners, instructors, and administrators.",
    detail:
      "PerpetualLearn is an e-learning management system in development. Its planned workspace connects structured courses, assessments, live classes, and completion records. Learners will follow their progress, instructors will manage teaching and feedback, and administrators will oversee enrollments and learning reports.",
    image: "/images/projects/perpetuallearn.svg",
    image_alt:
      "PerpetualLearn interface concept with course cards, learning progress, and an upcoming live class",
    technologies: [],
    completion_date: null,
    project_type: "E-learning Management System",
    focus: [
      "Dashboard: learning progress, upcoming sessions, and announcements.",
      "Courses: lessons, videos, downloadable materials, and learning paths.",
      "Assessments: quizzes, assignments, grading, and feedback.",
      "Live classes: schedules, meeting links, and attendance.",
      "Certificates: completion records and achievements.",
      "Administration: users, enrollments, and learning reports.",
    ],
    website_url: null,
    status: "development",
    is_featured: false,
    is_published: true,
    sort_order: 7,
  },
];

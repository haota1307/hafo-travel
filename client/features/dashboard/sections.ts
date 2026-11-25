import {
  CalendarDays,
  CreditCard,
  FileText,
  LayoutDashboard,
  Map,
  MessagesSquare,
  NotebookTabs,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

export const sections = [
  "inquiries",
  "tours",
  "departures",
  "bookings",
  "payments",
  "content",
  "users",
  "roles",
] as const;

export type Section = (typeof sections)[number];

export type Destination = Section | "overview";

export const navigation: { label: string; pages: Destination[] }[] = [
  {
    label: "operations",
    pages: [
      "overview",
      "inquiries",
      "tours",
      "departures",
      "bookings",
      "payments",
    ],
  },
  { label: "administration", pages: ["content", "users", "roles"] },
];

export const sectionIcons = {
  overview: LayoutDashboard,
  inquiries: MessagesSquare,
  tours: Map,
  departures: CalendarDays,
  bookings: NotebookTabs,
  payments: CreditCard,
  content: FileText,
  users: UsersRound,
  roles: ShieldCheck,
};

export function dashboardPath(section: Destination, id?: string) {
  const base = section === "overview" ? "/dashboard" : `/dashboard/${section}`;

  return id ? `${base}?record=${encodeURIComponent(id)}` : base;
}

export function accessibleDestinations(permissions: readonly string[]) {
  const destinations: Destination[] = ["overview", ...sections];

  return destinations.filter((page) =>
    permissions.includes(`UI:${dashboardPath(page).slice(1)}`),
  );
}

export function visibleNavigation(destinations: Destination[]) {
  return navigation
    .map((group) => ({
      ...group,
      pages: group.pages.filter((page) => destinations.includes(page)),
    }))
    .filter((group) => group.pages.length > 0);
}

export function isSection(value: string): value is Section {
  return sections.some((section) => section === value);
}

export function normalizeSearch(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .replaceAll("đ", "d");
}

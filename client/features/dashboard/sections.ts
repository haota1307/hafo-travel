import {
  CalendarDays,
  CreditCard,
  FileText,
  LayoutDashboard,
  Map,
  MessagesSquare,
  NotebookTabs,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";

const sampleSections = [
  "inquiries",
  "tours",
  "departures",
  "bookings",
  "payments",
  "content",
] as const;

export type SampleSection = (typeof sampleSections)[number];

export type Destination =
  SampleSection | "users" | "roles" | "overview" | "permissions";

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
  {
    label: "administration",
    pages: ["content", "users", "roles", "permissions"],
  },
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
  permissions: SlidersHorizontal,
};

export function dashboardPath(section: Destination, id?: string) {
  const base = section === "overview" ? "/dashboard" : `/dashboard/${section}`;

  return id ? `${base}?record=${encodeURIComponent(id)}` : base;
}

export function dashboardPermission(destination: Destination) {
  return `UI:${dashboardPath(destination).slice(1)}`;
}

export function withSystemDashboardPermissions(
  roleName: string,
  permissions: string[],
) {
  const access = dashboardPermission("permissions");

  if (
    roleName === "administrator" &&
    permissions.includes(dashboardPermission("roles")) &&
    !permissions.includes(access)
  ) {
    return [...permissions, access];
  }

  return permissions;
}

export function accessibleDestinations(permissions: readonly string[]) {
  return navigation.flatMap(({ pages }) =>
    pages.filter((page) => permissions.includes(dashboardPermission(page))),
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

export function isSampleSection(value: string): value is SampleSection {
  return sampleSections.some((section) => section === value);
}

export function normalizeSearch(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .replaceAll("đ", "d");
}

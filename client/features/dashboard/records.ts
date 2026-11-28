import type { useTranslations } from "next-intl";
import {
  getRetreats,
  type Retreat,
} from "@/features/public-site/data/retreats";
import type { PublicContentReader } from "@/features/public-site/data/localized-content";
import {
  bookings,
  contentPages,
  departures,
  guests,
  inquiries,
  sampleDate,
  staff,
  tourSamples,
  transactions,
} from "./fixtures";
import type { Section } from "./sections";

export type Labels = ReturnType<typeof useTranslations<"dashboard">>;

export type SampleSection = Exclude<Section, "users" | "roles">;

export type Column =
  | "tour"
  | "owner"
  | "date"
  | "location"
  | "duration"
  | "capacity"
  | "price"
  | "guests"
  | "amount"
  | "booking"
  | "method"
  | "language"
  | "path"
  | "guest"
  | "email"
  | "followUp";

export type DashboardRecord = {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  status?: string;
  values: Partial<Record<Column, string>>;
  links?: Partial<Record<Column, { section: SampleSection; id: string }>>;
  message?: string;
  note?: string;
};

export type DashboardData = Record<SampleSection, DashboardRecord[]>;

export const listColumns: Record<SampleSection, Column[]> = {
  inquiries: ["tour", "owner", "date"],
  tours: ["location", "duration", "language"],
  departures: ["date", "capacity", "price"],
  bookings: ["tour", "date", "guests", "amount"],
  payments: ["booking", "guest", "method", "amount"],
  content: ["path", "language", "owner"],
};

export type InquiryUpdate = {
  owner: string;
  status: string;
  followUp: string;
  note: string;
};

export type LocalInquiry = InquiryUpdate & {
  id: string;
  name: string;
  email: string;
  tour: string;
  message: string;
};

export type SampleChanges = {
  inquiries: Record<string, InquiryUpdate>;
  added: LocalInquiry[];
  publication?: Record<string, string>;
};

export function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value + "T12:00:00Z"));
}

export function buildRecords(
  t: Labels,
  publicT: PublicContentReader,
  locale: string,
  changes: SampleChanges,
): DashboardData {
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
  });
  const catalog = getRetreats(publicT);
  const tour = (slug: string) =>
    catalog.find((item) => item.slug === slug) as Retreat;
  const owner = (id: string) =>
    staff.find((person) => person.id === id)?.name ?? t("unassigned");
  const tourLink = (id: string) => ({ section: "tours" as const, id });
  const nameOf = (slug: string) => tour(slug).title.join(" ");
  const departureOf = (id: string) =>
    departures.find((item) => item.id === id)!;
  const bookingOf = (id: string) => bookings.find((item) => item.id === id)!;
  const total = (booking: (typeof bookings)[number]) =>
    money.format(departureOf(booking.departure).price * booking.seats);
  const seeded = inquiries.map((item) => ({
    ...item,
    name: guests[item.guest][0],
    email: guests[item.guest][1] + "@example.com",
    tour: tourSamples[item.tour].slug,
    message: t(`topics.${item.topic}`),
    note: "",
  }));

  return {
    inquiries: [
      ...changes.added.map((item) => ({ ...item, date: sampleDate })),
      ...seeded,
    ].map((item) => {
      const current = { ...item, ...changes.inquiries[item.id] };
      const date = item.date;

      return {
        id: item.id,
        title: item.name,
        subtitle: item.email,
        status: current.status,
        message: item.message,
        note: current.note,
        values: {
          tour: nameOf(item.tour),
          owner: owner(current.owner),
          date: formatDate(date, locale),
          followUp: current.followUp
            ? formatDate(current.followUp, locale)
            : "—",
        },
        links: { tour: tourLink(item.tour) },
      };
    }),
    tours: tourSamples.map((item) => {
      const entry = tour(item.slug);

      return {
        id: item.slug,
        title: nameOf(item.slug),
        image: entry.image,
        status: changes.publication?.[item.slug] ?? item.status,
        values: {
          location: item.place,
          duration: t("days", { count: item.days }),
          language: "VI / EN",
        },
        message: entry.properties.at(-1)?.label,
      };
    }),
    departures: departures.map((item) => {
      const entry = tourSamples[item.tour];
      const reserved = bookings
        .filter(
          (booking) =>
            booking.departure === item.id && booking.status !== "cancelled",
        )
        .reduce((sum, booking) => sum + booking.seats, 0);

      return {
        id: item.id,
        title: nameOf(entry.slug),
        subtitle: item.id,
        image: tour(entry.slug).image,
        status: reserved === item.capacity ? "full" : "open",
        values: {
          date: formatDate(item.date, locale),
          capacity: t("occupied", { reserved, total: item.capacity }),
          price: money.format(item.price),
          tour: nameOf(entry.slug),
        },
        links: { tour: tourLink(entry.slug) },
      };
    }),
    bookings: bookings.map((item) => {
      const departure = departureOf(item.departure);
      const slug = tourSamples[departure.tour].slug;

      return {
        id: item.id,
        title: item.id,
        subtitle: guests[item.guest][0],
        status: item.status,
        values: {
          tour: nameOf(slug),
          date: formatDate(departure.date, locale),
          guests: String(item.seats),
          amount: total(item),
        },
        links: {
          tour: tourLink(slug),
          date: { section: "departures", id: departure.id },
        },
      };
    }),
    payments: transactions.map((item) => {
      const booking = bookingOf(item.booking);

      return {
        id: item.id,
        title: item.id,
        status: item.status,
        values: {
          booking: booking.id,
          guest: guests[booking.guest][0],
          method: t(`methods.${item.method}`),
          amount: total(booking),
        },
        links: { booking: { section: "bookings", id: booking.id } },
      };
    }),
    content: contentPages.map((item) => ({
      id: item.id,
      title: t(`pages.${item.id}`),
      status: changes.publication?.[item.id] ?? item.status,
      values: {
        path: item.path,
        language: "VI / EN",
        owner: owner(item.owner),
      },
    })),
  };
}

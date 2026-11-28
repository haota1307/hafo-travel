"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  buildRecords,
  type DashboardData,
  type SampleChanges,
  type InquiryUpdate,
  type LocalInquiry,
} from "../records";
import { inquiries } from "../fixtures";
import { visibleNavigation, type Destination } from "../sections";

const storageKey = "dashboard-preview-inquiries-v1";
const empty: SampleChanges = { inquiries: {}, added: [] };
let fallback = "";
let usingMemory = false;

function snapshot() {
  if (usingMemory) {
    return fallback;
  }

  try {
    return window.sessionStorage.getItem(storageKey) ?? fallback;
  } catch {
    return fallback;
  }
}

function readChanges(raw: string): SampleChanges {
  try {
    const value = JSON.parse(raw);

    if (
      value &&
      Array.isArray(value.added) &&
      value.inquiries &&
      typeof value.inquiries === "object"
    ) {
      return value;
    }
  } catch {
    return empty;
  }

  return empty;
}

function subscribe(notify: () => void) {
  window.addEventListener(storageKey, notify);

  return () => window.removeEventListener(storageKey, notify);
}

function updateChanges(transform: (previous: SampleChanges) => SampleChanges) {
  fallback = JSON.stringify(transform(readChanges(snapshot())));

  try {
    window.sessionStorage.setItem(storageKey, fallback);
  } catch {
    usingMemory = true;
  }

  window.dispatchEvent(new Event(storageKey));
}

type Workspace = {
  destinations: Destination[];
  navigation: ReturnType<typeof visibleNavigation>;
  data: DashboardData;
  container: HTMLDivElement | null;
  inquiryState: (id: string) => InquiryUpdate | undefined;
  addInquiry: (item: LocalInquiry) => void;
  editInquiries: (updates: Record<string, InquiryUpdate>) => void;
  changePublication: (ids: string[], value: string) => void;
};

const WorkspaceContext = createContext<Workspace | null>(null);

export function WorkspaceProvider({
  destinations,
  container,
  children,
}: {
  destinations: Destination[];
  container: HTMLDivElement | null;
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const publicT = useTranslations("publicSite");
  const raw = useSyncExternalStore(subscribe, snapshot, () => "");
  const changes = useMemo(() => readChanges(raw), [raw]);
  const data = useMemo(
    () => buildRecords(t, publicT, locale, changes),
    [t, publicT, locale, changes],
  );

  function inquiryState(id: string) {
    if (Object.hasOwn(changes.inquiries, id)) {
      return changes.inquiries[id];
    }

    const initial =
      changes.added.find((item) => item.id === id) ??
      inquiries.find((item) => item.id === id);

    if (initial) {
      return {
        ...initial,
        note: "note" in initial ? String(initial.note) : "",
      };
    }
  }

  function addInquiry(item: LocalInquiry) {
    updateChanges((previous) => ({
      ...previous,
      added: [item, ...previous.added],
    }));
  }

  function editInquiries(updates: Record<string, InquiryUpdate>) {
    updateChanges((previous) => ({
      ...previous,
      inquiries: { ...previous.inquiries, ...updates },
    }));
  }

  function changePublication(ids: string[], value: string) {
    updateChanges((previous) => ({
      ...previous,
      publication: {
        ...previous.publication,
        ...Object.fromEntries(ids.map((id) => [id, value])),
      },
    }));
  }

  return (
    <WorkspaceContext.Provider
      value={{
        destinations,
        navigation: visibleNavigation(destinations),
        data,
        container,
        inquiryState,
        addInquiry,
        editInquiries,
        changePublication,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("Dashboard workspace is missing.");
  }

  return context;
}

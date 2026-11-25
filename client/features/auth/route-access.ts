import {
  accessibleDestinations,
  dashboardPath,
} from "@/features/dashboard/sections";

export function signedInPath(
  permissions: string[],
  locale: string,
  next?: string,
) {
  const paths = accessibleDestinations(permissions).map((page) =>
    dashboardPath(page),
  );

  if (next?.startsWith(`/${locale}/`)) {
    const target = new URL(next, "https://local.invalid");
    const path = target.pathname.slice(locale.length + 1);

    if (target.pathname.startsWith(`/${locale}/`) && paths.includes(path)) {
      return path + target.search;
    }
  }

  return paths[0] ?? "/";
}

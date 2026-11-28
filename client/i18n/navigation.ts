import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

export { useRouter } from "./navigation-router";

export const { Link, redirect, usePathname, getPathname } =
  createNavigation(routing);

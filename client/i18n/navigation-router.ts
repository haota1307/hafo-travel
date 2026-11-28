"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { createNavigation } from "next-intl/navigation";
import { useTopLoader } from "nextjs-toploader";

import { routing } from "./routing";

const { getPathname, useRouter: useIntlRouter } = createNavigation(routing);

export function useRouter() {
  const locale = useLocale();
  const router = useIntlRouter();
  const loader = useTopLoader();
  const [startProgress] = useState(() => loader.start);

  return useMemo(() => {
    function withProgress(navigate: typeof router.push): typeof router.push {
      return (href, options) => {
        const current = window.location;
        const destination = new URL(
          getPathname({ href, locale: options?.locale ?? locale }),
          current.href,
        );

        navigate(href, options);

        if (
          destination.origin === current.origin &&
          destination.pathname !== current.pathname
        ) {
          startProgress();
        }
      };
    }

    return {
      ...router,
      push: withProgress(router.push),
      replace: withProgress(router.replace),
    };
  }, [locale, router, startProgress]);
}

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";

export const publicMotion = {
  duration: 800,
  distance: 40,
  heroDistance: 200,
  easing: "cubic-bezier(0.165, 0.84, 0.44, 1)",
  triggerViewport: 0.88,
} as const;

function mountReveals(root: HTMLElement, reducedMotion: MediaQueryList) {
  const animations = new Set<Animation>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue;
        }

        observer.unobserve(entry.target);

        if (reducedMotion.matches || !(entry.target instanceof HTMLElement)) {
          continue;
        }

        const element = entry.target;
        const kind = element.dataset.anim ?? element.dataset.animation ?? "";
        const distance =
          Number(element.dataset.animDistance) || publicMotion.distance;
        const isBorder = kind.includes("border");
        const isHorizontalBorder = isBorder && !kind.includes("right");
        let startTransform = `translateY(${distance}px)`;

        if (kind === "fade-up-big") {
          startTransform = `translateY(${publicMotion.heroDistance}px)`;
        } else if (kind === "fade-down") {
          startTransform = `translateY(-${distance}px)`;
        } else if (kind.includes("illustration") || kind === "fade-left") {
          startTransform = `translateX(-${distance}px)`;
        } else if (kind === "fade-right") {
          startTransform = `translateX(${distance}px)`;
        } else if (isBorder) {
          startTransform = isHorizontalBorder ? "scaleX(0)" : "scaleY(0)";
        }

        const animation = element.animate(
          [
            {
              opacity: 0,
              transform: startTransform,
              transformOrigin: "left top",
            },
            { opacity: 1, transform: "none", transformOrigin: "left top" },
          ],
          {
            duration:
              (Number(element.dataset.animDuration) ||
                publicMotion.duration / 1000) * 1000,
            delay: (Number(element.dataset.animDelay) || 0) * 1000,
            easing: publicMotion.easing,
          },
        );
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      }
    },
    {
      rootMargin: `0px 0px -${(1 - publicMotion.triggerViewport) * window.innerHeight}px 0px`,
    },
  );

  for (const element of root.querySelectorAll<HTMLElement>(
    "[data-anim], [data-animation]",
  )) {
    if (
      element.closest(".header, .cookie, [data-slot=popover-content]") ||
      element.dataset.animation === "default"
    ) {
      continue;
    }

    observer.observe(element);
  }

  const cancelAnimations = () => {
    for (const animation of animations) {
      animation.cancel();
    }

    animations.clear();
  };
  reducedMotion.addEventListener("change", cancelAnimations);

  return () => {
    observer.disconnect();
    reducedMotion.removeEventListener("change", cancelAnimations);
    cancelAnimations();
  };
}

function mountSectionNavigation(
  root: HTMLElement,
  reducedMotion: MediaQueryList,
) {
  const links = [
    ...root.querySelectorAll<HTMLAnchorElement>(
      '.retreat-page-info__link a[data-target], .legal-nav__link[href^="#"]',
    ),
  ];
  const targets = links.flatMap((link) => {
    const id = link.dataset.target || decodeURIComponent(link.hash.slice(1));
    const element = [...root.querySelectorAll<HTMLElement>("[id]")].find(
      (node) => node.id === id,
    );

    return element ? [{ link, element }] : [];
  });
  let frame = 0;

  function headerOffset() {
    const headerHeight =
      root.querySelector(".header")?.getBoundingClientRect().height ?? 72;
    const nav = root.querySelector<HTMLElement>(
      ".retreat-page-info__nav.mobile-visible",
    );
    const mobileNavHeight =
      nav && window.innerWidth <= 479 ? nav.getBoundingClientRect().height : 0;
    root.style.setProperty("--site-header-height", `${headerHeight}px`);
    root.style.setProperty("--site-nav-height", `${mobileNavHeight}px`);

    return headerHeight + mobileNavHeight + 20;
  }

  function update() {
    frame = 0;
    const offset = headerOffset();
    let active = targets[0]?.element;

    for (const { element } of targets) {
      if (element.getBoundingClientRect().top <= offset + 2) {
        active = element;
      }
    }

    for (const { link, element } of targets) {
      const selected = element === active;
      link.classList.toggle("is-active", selected);

      if (selected) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    }
  }

  function onScroll() {
    if (!frame) {
      frame = window.requestAnimationFrame(update);
    }
  }

  function onClick(event: MouseEvent) {
    const anchor =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>(
            '.retreat-page-info__link a[data-target], .legal-nav__link[href^="#"]',
          )
        : null;
    const target = targets.find(({ link }) => link === anchor)?.element;

    if (
      !target ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    const top =
      window.scrollY + target.getBoundingClientRect().top - headerOffset();
    window.scrollTo({
      top: Math.max(0, top),
      behavior: reducedMotion.matches ? "instant" : "smooth",
    });
    window.history.replaceState(window.history.state, "", `#${target.id}`);
  }

  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  root.addEventListener("click", onClick, true);

  return () => {
    window.cancelAnimationFrame(frame);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    root.removeEventListener("click", onClick, true);
    root.style.removeProperty("--site-header-height");
    root.style.removeProperty("--site-nav-height");
  };
}

const PublicPortalContext = createContext<HTMLElement | null>(null);

export function usePublicPortalContainer() {
  return useContext(PublicPortalContext);
}

export function PublicExperience({ children }: { children: ReactNode }) {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    if (!root) {
      return;
    }

    const element = root;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cleanup = [
      mountReveals(element, reducedMotion),
      mountSectionNavigation(element, reducedMotion),
    ];

    return () => {
      for (const dispose of cleanup) {
        dispose();
      }
    };
  }, [root, pathname, locale]);

  return (
    <PublicPortalContext.Provider value={root}>
      <div ref={setRoot} className="public-site" data-public-page={pathname}>
        {children}
      </div>
    </PublicPortalContext.Provider>
  );
}

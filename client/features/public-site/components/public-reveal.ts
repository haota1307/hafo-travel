const publicMotion = {
  duration: 800,
  distance: 40,
  heroDistance: 200,
  easing: "cubic-bezier(0.165, 0.84, 0.44, 1)",
  triggerViewport: 0.88,
} as const;

export function mountReveals(root: HTMLElement, reducedMotion: MediaQueryList) {
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

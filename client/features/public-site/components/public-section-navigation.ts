const sectionLinkSelector =
  '.retreat-page-info__link a[data-target], .legal-nav__link[href^="#"]';

export function mountSectionNavigation(
  root: HTMLElement,
  reducedMotion: MediaQueryList,
) {
  const links = [
    ...root.querySelectorAll<HTMLAnchorElement>(sectionLinkSelector),
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
        ? event.target.closest<HTMLAnchorElement>(sectionLinkSelector)
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

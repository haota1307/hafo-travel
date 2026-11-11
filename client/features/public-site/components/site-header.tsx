"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link, usePathname } from "@/i18n/navigation";
import { PublicButton } from "./public-button";
import { LanguageSwitcher } from "./language-switcher";
import { usePublicPortalContainer } from "./public-experience";
import { SiteMark } from "./site-mark";
import { publicSiteConfig } from "../site.config";

export function SiteHeader() {
  const t = useTranslations("publicSite");
  const pathname = usePathname();
  const portalContainer = usePublicPortalContainer();
  const headerRef = useRef<HTMLElement>(null);
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const links = [
    { href: "/#retreats", label: t("retreats") },
    { href: "/experiences", label: t("experiences") },
    { href: "/contacts", label: t("contacts") },
  ];

  useEffect(() => {
    const header = headerRef.current;
    const updateHeader = () =>
      header?.classList.toggle("is-active", window.scrollY > 20);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const viewport = window.matchMedia("(min-width: 480px)");
    const closeOnResize = () => setMenuPath(null);
    viewport.addEventListener("change", closeOnResize);

    return () => viewport.removeEventListener("change", closeOnResize);
  }, [menuOpen]);

  function navigation(mobile = false) {
    return (
      <nav aria-label={mobile ? t("mobileNavigation") : t("navigation")}>
        <ul className="header-nav">
          {links.map((link) => (
            <li className="header-nav__item" key={link.href}>
              <Link
                href={link.href}
                className="button-sm color-white header-nav__link"
                aria-current={pathname === link.href ? "page" : undefined}
                onClick={() => setMenuPath(null)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <header
      ref={headerRef}
      className={pathname === "/" ? "header header--on-hero" : "header"}
    >
      <div className="header__in">
        <Link href="/" className="header__l" aria-label={publicSiteConfig.name}>
          <div className="header-logo">
            <SiteMark className="header-logo__icon" />
            <span className="header-logo__title">{publicSiteConfig.name}</span>
          </div>
          <div className="header__dec header__dec--2" />
        </Link>
        <div className="header__actions">
          <div className="header__r">
            {navigation()}
            <Link href="/#retreats" className="header__accent mobile-hidden">
              <span className="button-sm color-white">{t("explore")}</span>
              <div className="header__dec header__dec--3" />
            </Link>
          </div>
          <LanguageSwitcher />
          <div className="header__burger">
            <Sheet
              open={menuOpen}
              onOpenChange={(open) => setMenuPath(open ? pathname : null)}
            >
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    className="header-menu-trigger"
                    aria-label={t("openMenu")}
                  />
                }
              >
                <Menu />
              </SheetTrigger>
              {portalContainer && (
                <SheetContent
                  portalContainer={portalContainer}
                  className="public-mobile-menu"
                  showCloseButton={false}
                >
                  <SheetHeader>
                    <SheetTitle>{publicSiteConfig.name}</SheetTitle>
                    <SheetDescription className="sr-only">
                      {t("mobileNavigation")}
                    </SheetDescription>
                  </SheetHeader>
                  <SheetClose
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-3 top-3"
                        aria-label={t("closeMenu")}
                      />
                    }
                  >
                    <X />
                  </SheetClose>
                  {navigation(true)}
                  <PublicButton
                    href="/#retreats"
                    onClick={() => setMenuPath(null)}
                  >
                    {t("exploreRetreats")}
                  </PublicButton>
                </SheetContent>
              )}
            </Sheet>
          </div>
        </div>
      </div>
      <div className="header__dec header__dec--1" />
    </header>
  );
}

"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicButton } from "./public-button";

const storageKey = "roviet.public.cookie-choice";
const changeEvent = "roviet-public-cookie-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(changeEvent, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(changeEvent, onChange);
  };
}

function getChoice() {
  try {
    return localStorage.getItem(storageKey) ?? "unset";
  } catch {
    return "unavailable";
  }
}

export function CookieNotice() {
  const t = useTranslations("publicSite");
  const choice = useSyncExternalStore(subscribe, getChoice, () => "pending");
  const noticeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const notice = noticeRef.current;
    const root = notice?.closest<HTMLElement>(".public-site");

    if (!notice || !root) {
      return;
    }

    const observer = new ResizeObserver(() => {
      root.style.setProperty(
        "--hafo-cookie-height",
        `${notice.getBoundingClientRect().height}px`,
      );
    });
    observer.observe(notice);

    return () => {
      observer.disconnect();
      root.style.removeProperty("--hafo-cookie-height");
    };
  }, [choice]);

  function dismiss(value: "accepted" | "declined" | "dismissed") {
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      noticeRef.current?.setAttribute("hidden", "");
    }

    window.dispatchEvent(new Event(changeEvent));
  }

  if (choice !== "unset") {
    return null;
  }

  return (
    <div
      ref={noticeRef}
      className="cookie is-active"
      role="region"
      aria-label={t("cookiePreferences")}
    >
      <div className="cookie__text">
        <div className="body-md-regular color-white-60 mobile-no-br">
          {t("cookieDescription")}{" "}
          <Link href="/privacy-policy" className="link">
            <span className="color-white">{t("privacyPolicy")}</span>
          </Link>{" "}
          {t("cookieMore")}
        </div>
      </div>
      <div className="cookie__controls">
        <PublicButton
          type="button"
          variant="secondary"
          withArrow={false}
          onClick={() => dismiss("declined")}
        >
          {t("decline")}
        </PublicButton>
        <PublicButton
          type="button"
          withArrow={false}
          onClick={() => dismiss("accepted")}
        >
          {t("accept")}
        </PublicButton>
        <div className="cookie__close">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => dismiss("dismissed")}
            aria-label={t("closeCookieNotice")}
          >
            <X />
          </Button>
        </div>
      </div>
    </div>
  );
}

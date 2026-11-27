"use client";

import { useLocale, useTranslations } from "next-intl";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

import { FieldSeparator } from "@/components/ui/field";
import { getApiErrorCode } from "@/lib/api-error";
import { HttpError } from "@/lib/http";
import { useGoogleLogin } from "../auth.queries";
import { GOOGLE_EMAIL_CONFIRMATION_REQUIRED } from "../auth.schema";
import { AuthErrorToast } from "./auth-error-toast";

type GoogleButtonText = "signin_with" | "signup_with";

type GoogleIdentity = {
  initialize(options: {
    client_id: string;
    callback: (response: { credential: string }) => void;
  }): void;
  renderButton(
    element: HTMLElement,
    options: {
      theme: "outline";
      size: "large";
      text: GoogleButtonText;
      shape: "pill";
      logo_alignment: "center";
      width: string;
      locale: string;
    },
  ): void;
};

export function GoogleLoginButton({
  confirmEmail = false,
  text = "signin_with",
}: {
  confirmEmail?: boolean;
  text?: GoogleButtonText;
}) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const button = useRef<HTMLDivElement>(null);
  const [identity, setIdentity] = useState<GoogleIdentity | null>(null);
  const emailToken = useRef<string | null>(null);
  const [loadError, setLoadError] = useState<"googleFailed" | "badLink" | null>(
    null,
  );
  const mountButton = useCallback(
    (element: HTMLDivElement | null) => {
      button.current = element;

      if (element && confirmEmail && emailToken.current === null) {
        emailToken.current = window.location.hash.slice(1);
        window.history.replaceState(
          window.history.state,
          "",
          window.location.pathname,
        );
      }
    },
    [confirmEmail],
  );
  const google = useGoogleLogin();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const element = button.current;

    if (!identity || !element) {
      return;
    }

    let lastWidth = 0;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.min(400, Math.floor(entry.contentRect.width));

      if (width <= 0 || width === lastWidth) {
        return;
      }

      lastWidth = width;
      identity.renderButton(element, {
        theme: "outline",
        size: "large",
        text,
        shape: "pill",
        logo_alignment: "center",
        width: String(width),
        locale,
      });
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [identity, locale, text]);

  if (!clientId) {
    return confirmEmail ? <AuthErrorToast message={t("googleFailed")} /> : null;
  }

  function initializeGoogle() {
    const identity = (
      window as Window & { google?: { accounts: { id: GoogleIdentity } } }
    ).google?.accounts.id;

    if (
      confirmEmail &&
      (!emailToken.current || emailToken.current.length > 4096)
    ) {
      setLoadError("badLink");

      return;
    }

    if (!button.current || !identity || !clientId) {
      setLoadError("googleFailed");

      return;
    }

    identity.initialize({
      client_id: clientId,
      callback: ({ credential }) =>
        google.mutate({
          credential,
          emailToken: emailToken.current || undefined,
          locale: locale === "en" ? "en" : "vi",
        }),
    });
    setIdentity(identity);
  }

  const status =
    google.error instanceof HttpError ? google.error.status : undefined;
  const confirmInbox =
    status === 403 &&
    getApiErrorCode(google.error) === GOOGLE_EMAIL_CONFIRMATION_REQUIRED;

  return (
    <div className="space-y-2" aria-busy={google.isPending}>
      <Script
        src="https://accounts.google.com/gsi/client"
        onReady={initializeGoogle}
        onError={() => setLoadError("googleFailed")}
      />
      {identity && !confirmEmail && (
        <FieldSeparator className="mt-0 mb-5">{t("or")}</FieldSeparator>
      )}
      <div
        ref={mountButton}
        className="mx-auto min-h-10 w-full max-w-[400px]"
      />
      {(loadError || google.isError) && (
        <AuthErrorToast
          key={google.submittedAt}
          type={confirmInbox ? "info" : "error"}
          message={t(
            loadError ??
              (status === 409
                ? "existingMethod"
                : confirmInbox
                  ? "googleCheckInbox"
                  : status === 429
                    ? "limited"
                    : confirmEmail && status === 400
                      ? "badLink"
                      : "googleFailed"),
          )}
        />
      )}
    </div>
  );
}

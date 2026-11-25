"use client";

import { useLocale, useTranslations } from "next-intl";
import Script from "next/script";
import { useCallback, useRef, useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { HttpError } from "@/lib/http";
import { useGoogleLogin } from "../auth.queries";

type GoogleIdentity = {
  initialize(options: {
    client_id: string;
    callback: (response: { credential: string }) => void;
  }): void;
  renderButton(
    element: HTMLElement,
    options: { theme: string; size: string; locale: string },
  ): void;
};

export function GoogleLoginButton({
  confirmEmail = false,
}: {
  confirmEmail?: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("auth");
  const locale = useLocale();
  const button = useRef<HTMLDivElement>(null);
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

  if (!clientId) {
    return confirmEmail ? <p role="alert">{t("googleFailed")}</p> : null;
  }

  function renderButton() {
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
        google.mutate(
          {
            credential,
            emailToken: emailToken.current || undefined,
            locale: locale === "en" ? "en" : "vi",
          },
          {
            onSuccess: () => {
              if (confirmEmail) {
                router.replace("/auth/login");
              }
            },
          },
        ),
    });
    identity.renderButton(button.current, {
      theme: "outline",
      size: "large",
      locale,
    });
  }

  return (
    <div className="space-y-2" aria-busy={google.isPending}>
      <Script
        src="https://accounts.google.com/gsi/client"
        onReady={renderButton}
        onError={() => setLoadError("googleFailed")}
      />
      <div ref={mountButton} />
      {(loadError || google.isError) && (
        <p role="alert">
          {t(
            loadError ??
              (google.error instanceof HttpError && google.error.status === 409
                ? "existingMethod"
                : google.error instanceof HttpError &&
                    google.error.status === 403
                  ? "googleCheckInbox"
                  : confirmEmail &&
                      google.error instanceof HttpError &&
                      google.error.status === 400
                    ? "badLink"
                    : "googleFailed"),
          )}
        </p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PublicButton } from "./public-button";

export function ContactForm() {
  const t = useTranslations("publicSite");
  const [unavailable, setUnavailable] = useState(false);
  const ContactSchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, t("nameRequired"))
      .max(256, t("nameTooLong", { max: 256 })),
    email: z.email(t("emailInvalid")).max(256, t("emailTooLong", { max: 256 })),
    message: z
      .string()
      .trim()
      .max(5000, t("messageTooLong", { max: 5000 })),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof ContactSchema>>({
    resolver: zodResolver(ContactSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  return (
    <form
      className="contact-form"
      data-anim="contacts-form"
      noValidate
      onSubmit={handleSubmit(() => setUnavailable(true))}
    >
      <FieldGroup>
        <div className="contact-form-row">
          <Field data-invalid={Boolean(errors.name)}>
            <FieldLabel htmlFor="public-name">{t("name")}</FieldLabel>
            <Input
              id="public-name"
              autoComplete="name"
              maxLength={256}
              placeholder={t("name")}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "public-name-error" : undefined}
              {...register("name")}
            />
            <FieldError id="public-name-error" errors={[errors.name]} />
          </Field>
          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor="public-email">{t("email")}</FieldLabel>
            <Input
              id="public-email"
              type="email"
              autoComplete="email"
              maxLength={256}
              placeholder={t("emailPlaceholder")}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "public-email-error" : undefined}
              {...register("email")}
            />
            <FieldError id="public-email-error" errors={[errors.email]} />
          </Field>
        </div>
        <Field data-invalid={Boolean(errors.message)}>
          <FieldLabel htmlFor="public-message">{t("message")}</FieldLabel>
          <Textarea
            id="public-message"
            rows={5}
            maxLength={5000}
            placeholder={t("message")}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={
              errors.message ? "public-message-error" : undefined
            }
            {...register("message")}
          />
          <FieldError id="public-message-error" errors={[errors.message]} />
        </Field>
        <PublicButton type="submit" className="self-start">
          {t("submit")}
        </PublicButton>
      </FieldGroup>
      {unavailable && (
        <Alert role="status">
          <AlertDescription>{t("contactUnavailable")}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}

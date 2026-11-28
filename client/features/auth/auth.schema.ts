import { z } from "zod";

import { withSystemDashboardPermissions } from "@/features/dashboard/sections";

export const LoginSchema = z.object({
  email: z.string().trim().min(1).max(254).includes("@"),
  password: z.string().min(1).max(1024),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const EmailActionSchema = z.object({
  email: z.string().trim().pipe(z.email().max(254)),
  locale: z.enum(["vi", "en"]),
});

const NewPasswordSchema = z
  .string()
  .refine((value) => [...value].length >= 8)
  .refine((value) => new TextEncoder().encode(value).length <= 1024);

export const ResetPasswordSchema = z.object({
  token: z.string().min(1).max(4096),
  password: NewPasswordSchema,
});

export const VerifyEmailSchema = ResetPasswordSchema.extend({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
});

export const GoogleLoginSchema = z.object({
  credential: z.string().min(1).max(8192),
  emailToken: z.string().min(1).max(4096).optional(),
  locale: z.enum(["vi", "en"]).optional(),
});

export type GoogleLoginInput = z.infer<typeof GoogleLoginSchema>;

export const GOOGLE_EMAIL_CONFIRMATION_REQUIRED =
  "GOOGLE_EMAIL_CONFIRMATION_REQUIRED";

export const accountActionSchemas = {
  register: EmailActionSchema,
  "forgot-password": EmailActionSchema,
  "verify-email": VerifyEmailSchema,
  "reset-password": ResetPasswordSchema,
  "accept-invitation": ResetPasswordSchema,
};

export type AccountAction = keyof typeof accountActionSchemas;

export type AccountCommand = {
  [K in AccountAction]: {
    action: K;
    body: z.infer<(typeof accountActionSchemas)[K]>;
  };
}[AccountAction];

export function isAccountAction(action: string): action is AccountAction {
  return Object.hasOwn(accountActionSchemas, action);
}

export const SessionSchema = z
  .object({
    user: z.object({
      userId: z.string().min(1),
      email: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      roles: z.array(z.object({ id: z.string(), name: z.string() })).length(1),
    }),
    permissions: z.array(z.string()),
  })
  .transform((session) => ({
    ...session,
    permissions: withSystemDashboardPermissions(
      session.user.roles[0].name,
      session.permissions,
    ),
  }));

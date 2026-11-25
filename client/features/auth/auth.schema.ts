import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().trim().min(1).max(254).includes("@"),
  password: z.string().min(1).max(1024),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const SessionSchema = z.object({
  user: z.object({
    userId: z.string().min(1),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    roles: z.array(z.object({ id: z.string(), name: z.string() })).length(1),
  }),
  permissions: z.array(z.string()),
});

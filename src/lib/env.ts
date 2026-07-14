import { z } from "zod";

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
});

export const serverEnvSchema = publicEnvSchema.extend({
  DATABASE_URL: z.string().url().optional(),
  DIRECT_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().optional(),
  SEED_ADMIN_USERNAME: z.string().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

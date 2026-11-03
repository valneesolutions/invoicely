import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    AWS_ENDPOINT_URL_S3: z.string(),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
    AWS_REGION: z.string(),
    AWS_BUCKET_NAME: z.string(),
  },
  client: {
    NEXT_PUBLIC_POSTHOG_HOST: z.string().default(""),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().default(""),
    NEXT_PUBLIC_BASE_URL: z.string(),
    NEXT_PUBLIC_TRPC_BASE_URL: z.string(),
    NEXT_PUBLIC_ASSET_BASE_URL: z.string(),
  },
  runtimeEnv: {
    // =========== SERVER ===========
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    AWS_ENDPOINT_URL_S3: process.env.AWS_ENDPOINT_URL_S3 ?? process.env.CF_R2_ENDPOINT ?? "",
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? process.env.CF_R2_ACCESS_KEY_ID ?? "",
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? process.env.CF_R2_SECRET_ACCESS_KEY ?? "",
    AWS_REGION: process.env.AWS_REGION ?? "auto",
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME ?? process.env.CF_R2_BUCKET_NAME ?? "",
    // =========== PUBLIC ===========
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_TRPC_BASE_URL: process.env.NEXT_PUBLIC_TRPC_BASE_URL,
    NEXT_PUBLIC_ASSET_BASE_URL: process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? process.env.CF_R2_PUBLIC_DOMAIN ?? "",
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

// Load monorepo root .env first, then allow backend/.env to fill in unset keys
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  BACKEND_PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z
    .string()
    .min(16)
    .default("urunana-dev-jwt-secret-change-in-production-2026"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  UPLOAD_DIR: z.string().default("./uploads"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid backend environment configuration:",
    parsed.error.flatten().fieldErrors
  );
  process.exit(1);
}

if (
  parsed.data.NODE_ENV === "production" &&
  parsed.data.JWT_SECRET.startsWith("urunana-dev-")
) {
  console.error("JWT_SECRET must be explicitly set in production.");
  process.exit(1);
}

export const env = {
  ...parsed.data,
  UPLOAD_DIR_ABS: path.resolve(process.cwd(), parsed.data.UPLOAD_DIR),
};

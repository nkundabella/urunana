import fs from "node:fs";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import { env } from "./config/env.js";
import { checkDatabaseConnection } from "./lib/prisma.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { bookmarksRoutes } from "./modules/bookmarks/bookmarks.routes.js";
import { commentsRoutes } from "./modules/comments/comments.routes.js";
import { contactRoutes } from "./modules/contact/contact.routes.js";
import { metadataRoutes } from "./modules/metadata/metadata.routes.js";
import { notificationsRoutes } from "./modules/notifications/notifications.routes.js";
import { postsRoutes } from "./modules/posts/posts.routes.js";
import { profilesRoutes } from "./modules/profiles/profiles.routes.js";
import { reportsRoutes } from "./modules/reports/reports.routes.js";
import { uploadsRoutes } from "./modules/uploads/uploads.routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV !== "test",
  });

  // Ensure upload directory exists for static serving
  fs.mkdirSync(env.UPLOAD_DIR_ABS, { recursive: true });

  await app.register(helmet, {
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
  });

  await app.register(cookie);

  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
  });

  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB max (avatar route enforces 2 MB)
      files: 3,
    },
  });

  await app.register(fastifyStatic, {
    root: env.UPLOAD_DIR_ABS,
    prefix: "/uploads/",
    decorateReply: false,
    setHeaders(res) {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  });

  app.setErrorHandler((err, _request, reply) => {
    const fastifyErr = err as { statusCode?: number; code?: string; message?: string };
    if (fastifyErr.code === "FST_REQ_FILE_TOO_LARGE") {
      return reply.code(413).send({
        error: {
          code: "FILE_TOO_LARGE",
          message: "Ifoto irengeje ubunini bwemewe.",
        },
      });
    }
    const status = fastifyErr.statusCode && fastifyErr.statusCode >= 400 ? fastifyErr.statusCode : 500;
    return reply.code(status).send({
      error: {
        code: fastifyErr.code || "INTERNAL_SERVER_ERROR",
        message:
          status >= 500
            ? "Habaye ikibazo kuri seriveri. Ongera ugerageze."
            : fastifyErr.message || "Ikibazo mu busabe.",
      },
    });
  });

  app.get("/api/v1/health", async () => {
    const dbConnected = await checkDatabaseConnection();
    return {
      ok: true,
      status: "ok",
      service: "urunana-backend",
      database: dbConnected ? "connected" : "unreachable",
      timestamp: new Date().toISOString(),
    };
  });

  app.get("/api/v1/health/ready", async (_request, reply) => {
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      return reply.code(503).send({
        ok: false,
        status: "degraded",
        service: "urunana-backend",
        database: "unreachable",
      });
    }
    return {
      ok: true,
      status: "ready",
      service: "urunana-backend",
      database: "connected",
    };
  });

  await app.register(authRoutes);
  await app.register(metadataRoutes);
  await app.register(postsRoutes);
  await app.register(commentsRoutes);
  await app.register(bookmarksRoutes);
  await app.register(profilesRoutes);
  await app.register(uploadsRoutes);
  await app.register(notificationsRoutes);
  await app.register(reportsRoutes);
  await app.register(contactRoutes);
  await app.register(adminRoutes);

  return app;
}

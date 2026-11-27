import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { pool, prisma } from "./lib/prisma.js";

const app = await buildApp();

async function shutdown(signal: string) {
  app.log.info(`Received ${signal}, shutting down...`);
  try {
    await app.close();
    await prisma.$disconnect();
    await pool.end();
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ port: env.BACKEND_PORT, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

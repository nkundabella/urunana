#!/bin/sh
set -eu

echo "[urunana-backend] Applying Prisma migrations..."
./node_modules/.bin/prisma migrate deploy

if [ "${SEED_ON_BOOT:-false}" = "true" ]; then
  echo "[urunana-backend] SEED_ON_BOOT=true — running database seed..."
  ./node_modules/.bin/prisma db seed
fi

echo "[urunana-backend] Starting Fastify API server..."
exec node dist/server.js

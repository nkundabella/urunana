# Stage 1: Install dependencies, generate Prisma 7 client, compile TypeScript
FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma.config.ts tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# prisma generate does not require a live database connection
RUN npx prisma generate
RUN npm run build

# Stage 2: Non-root production runtime with Prisma CLI, sharp, migrations & seed
FROM node:22-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV BACKEND_PORT=4000
ENV UPLOAD_DIR=/app/uploads

COPY --from=builder --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/src/generated ./src/generated
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh

RUN sed -i 's/\r$//' /app/docker-entrypoint.sh \
 && chmod +x /app/docker-entrypoint.sh \
 && mkdir -p /app/uploads/avatars /app/uploads/stories \
 && chown -R node:node /app/uploads

USER node

EXPOSE 4000

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/v1/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/app/docker-entrypoint.sh"]

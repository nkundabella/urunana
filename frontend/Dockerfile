# Stage 1: Install dependencies & build Next.js standalone bundle
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG INTERNAL_API_URL=http://backend:4000
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV INTERNAL_API_URL=${INTERNAL_API_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 2: Minimal non-root production runtime
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

USER node

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/v1/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]

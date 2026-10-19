# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
FROM base AS dependencies
COPY package.json package-lock.json .npmrc ./
RUN npm ci
FROM base AS builder
ENV BUILD_STANDALONE=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json next.config.ts ./
COPY src ./src
COPY public ./public
COPY skills ./skills
RUN npm run build
FROM base AS runner
ARG IMAGE_VERSION=dev
ARG VCS_REF=unknown
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
LABEL org.opencontainers.image.title="HTMLinks" org.opencontainers.image.description="Publish HTML. Keep the link." org.opencontainers.image.licenses="MIT" org.opencontainers.image.source="https://github.com/michael-elkabetz/HTMLinks"
LABEL org.opencontainers.image.version=$IMAGE_VERSION org.opencontainers.image.revision=$VCS_REF
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=dependencies --chown=node:node /app/node_modules/postgres ./node_modules/postgres
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node migrations ./migrations
COPY --chown=node:node skills ./skills
COPY --chown=node:node LICENSE ./LICENSE
RUN mkdir -p /app/data/uploads && chown -R node:node /app/data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]

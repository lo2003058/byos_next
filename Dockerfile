ARG NODE_VERSION=22.22.3

# Base stage - minimal Node.js only
FROM node:${NODE_VERSION}-slim AS base

LABEL org.opencontainers.image.title="TRMNL BYOS Next.js"
LABEL org.opencontainers.image.description="A Next.js application for BYOS"
LABEL org.opencontainers.image.vendor="rbouteiller"

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

RUN corepack enable

# Install dependencies only when needed
FROM base AS deps

COPY package.json yarn.lock .yarnrc.yml ./

RUN yarn install --immutable \
    && rm -rf ~/.npm /root/.yarn /root/.cache

# Build the application
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build \
    && rm -rf node_modules/.cache

# Browser-renderer image (REACT_RENDERER=browser): build with `--target runner-browser`
FROM chromedp/headless-shell:146.0.7655.3 AS runner-browser

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROME_EXECUTABLE_PATH=/headless-shell/headless-shell
ENV XDG_CACHE_HOME=/home/nextjs/.cache

# Copy Node.js binary from build stage
COPY --from=base /usr/local/bin/node /usr/local/bin/node

# Install fonts for HTML rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Create non-privileged user
RUN groupadd -g 1001 nodejs \
    && useradd -u 1001 -g nodejs -s /bin/false nextjs

RUN mkdir -p /var/cache/fontconfig /home/nextjs/.cache/fontconfig /home/nextjs/.fontconfig \
    && chown -R nextjs:nodejs /var/cache/fontconfig /home/nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN mkdir -p .next/cache \
    && chown -R nextjs:nodejs .next

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT []
CMD ["node", "server.js"]

# Default production image: Node only, for the Takumi/Satori renderers (no Chrome)
FROM base AS runner

RUN groupadd -g 1001 nodejs \
    && useradd -u 1001 -g nodejs -s /bin/false -m nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# CI migration runner (`node scripts/migrate.js`) and the SQL it applies
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrate.js ./scripts/migrate.js
COPY --from=builder --chown=nextjs:nodejs /app/migrations ./migrations

RUN mkdir -p .next/cache \
    && chown -R nextjs:nodejs .next

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

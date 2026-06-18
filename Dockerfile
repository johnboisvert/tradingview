# CryptoIA Platform - Railway Deployment v4 - Express server with API proxies + server-side users
FROM node:20-alpine AS builder

WORKDIR /app

# Build-time arguments — Railway passes service variables as build args
# These MUST be declared with ARG to be visible to Vite during npm run build
ARG VITE_SENTRY_DSN=""
ARG RAILWAY_GIT_COMMIT_SHA=""
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_RELEASE=$RAILWAY_GIT_COMMIT_SHA

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY . .
RUN cd frontend && npm run build

FROM node:20-alpine AS production

WORKDIR /app

# Copy the built frontend assets
COPY --from=builder /app/frontend/dist ./dist

# Copy server.js
COPY --from=builder /app/frontend/server.js ./server.js

# Copy Sentry instrumentation (loaded via --import BEFORE server.js)
COPY --from=builder /app/frontend/instrument.mjs ./instrument.mjs

# Copy backend route modules (ESM refactor) and gamification seed
COPY --from=builder /app/frontend/routes ./routes
COPY --from=builder /app/frontend/gamification_seed.js ./gamification_seed.js

# Copy assets (logo for Telegram alerts)
COPY --from=builder /app/frontend/assets ./assets

# Create data directory for persistent user storage
RUN mkdir -p /app/data /app/seeds

# Copy blog seed (evergreen articles auto-imported on first boot)
# IMPORTANT: copied OUTSIDE /app/data because Railway mounts a persistent volume there
COPY --from=builder /app/frontend/data/blog_seed.json ./seeds/blog_seed.json

# Create a minimal package.json for the production server (ES modules + deps)
RUN echo '{"type":"module","dependencies":{"express":"^5.2.1","dotenv":"^16.4.0","stripe":"^17.0.0","resend":"^4.4.1","web-push":"^3.6.7","@sentry/node":"^10.58.0"}}' > package.json && npm install --omit=dev

EXPOSE 3000

CMD ["node", "--import", "./instrument.mjs", "server.js"]

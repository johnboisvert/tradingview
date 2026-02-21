# CryptoIA Platform - Railway Deployment v4 - Express server with API proxies + server-side users
FROM node:20-alpine AS builder

WORKDIR /app

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

# Create data directory for persistent user storage
RUN mkdir -p /app/data

# Create a minimal package.json for the production server (ES modules + deps)
RUN echo '{"type":"module","dependencies":{"express":"^4.21.0","dotenv":"^16.4.0"}}' > package.json && npm install --omit=dev

EXPOSE 3000

CMD ["node", "server.js"]
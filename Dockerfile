# CryptoIA Platform - Railway Deployment v2 - Dockerfile build
FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY . .
RUN cd frontend && npm run build

FROM node:20-alpine AS production

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/frontend/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "exec serve dist --single --listen ${PORT:-3000}"]
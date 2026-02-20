FROM node:20-alpine AS builder

WORKDIR /app

# Copy frontend package files first for better caching
COPY frontend/package*.json ./frontend/

# Install frontend dependencies
RUN cd frontend && npm install

# Copy all source files
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/frontend/dist ./dist

# Expose port
EXPOSE 3000

# Start serve directly as PID 1 (proper SIGTERM handling)
CMD ["sh", "-c", "serve dist --single --listen ${PORT:-3000}"]
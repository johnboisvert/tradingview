FROM node:20-alpine AS builder

WORKDIR /app

# Copy frontend files
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
EXPOSE $PORT

# Start serve directly (no npm wrapper = proper SIGTERM handling)
CMD ["sh", "-c", "serve dist --single --listen $PORT"]
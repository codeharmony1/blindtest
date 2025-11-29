# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files for workspace
COPY package*.json ./

# Copy workspace package files
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Install all dependencies (including dev for building)
RUN npm install --include=dev --no-audit --no-fund

# Copy workspace source code
COPY apps/api ./apps/api
COPY apps/web ./apps/web

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy root package files for workspace
COPY --chown=nodejs:nodejs package*.json ./

# Copy workspace package files
COPY --chown=nodejs:nodejs apps/api/package*.json ./apps/api/

# Install ALL dependencies (production + dev)
# On garde les dev dependencies pour TypeORM CLI et ts-node
RUN npm install --no-audit --no-fund

# Copy built API application
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist

# Copy source TypeScript files (nécessaires pour typeorm CLI et scripts)
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/src ./apps/api/src
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/tsconfig.json ./apps/api/

# Create logs directory
RUN mkdir -p /app/logs && chown nodejs:nodejs /app/logs

# Switch to non-root user
USER nodejs

# Expose API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "apps/api/dist/index.js"]

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files for workspace
COPY package*.json ./

# Copy workspace package files
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm install --include=dev --no-audit --no-fund

# Copy only web source code
COPY apps/web ./apps/web

# Build only the Web application
RUN npm run build -w @blindtest/web -- --configuration=production

# Prune dev dependencies
RUN npm prune --omit=dev

# Production stage with Nginx
FROM nginx:1.25-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy custom nginx configuration
COPY apps/web/nginx.conf /etc/nginx/nginx.conf

# Copy built Angular app from builder
# Angular 20 builds to apps/web/dist/web/browser when using workspace
COPY --from=builder /app/apps/web/dist/web/browser /usr/share/nginx/html

# Create non-root user for nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Touch log files and set permissions
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

FROM node:18-alpine

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --only=production --no-audit --no-fund

# Copy source code
COPY src ./src

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3004/health/live', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run as non-root user
USER node

CMD ["node", "src/index.js"]

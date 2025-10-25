FROM node:18-alpine AS builder
WORKDIR /app

# Install Tesseract dependencies
RUN apk add --no-cache \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    tesseract-ocr-data-fra

COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app

RUN apk add --no-cache \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    tesseract-ocr-data-fra

COPY --from=builder /app/node_modules ./node_modules
COPY . .

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN mkdir -p /app/uploads && chown -R nodejs:nodejs /app/uploads

USER nodejs
EXPOSE 3000
CMD ["node", "src/index.js"]

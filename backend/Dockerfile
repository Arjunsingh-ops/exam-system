# Production Dockerfile for Apex University Examination Seating Backend
FROM node:20-bookworm-slim

# Install Chromium and system dependencies required for Puppeteer PDF rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-freefont-ttf \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer executable path to system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PORT=5000

WORKDIR /app

# Install dependencies first for Docker caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy backend source code
COPY . .

# Expose backend port
EXPOSE 5000

# Start production server
CMD ["node", "server.js"]

# Stage 1 - Build Stage
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies for building node modules if needed
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install ALL dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Generate Prisma client and build the application
RUN npx prisma generate
RUN npm run build

# Stage 2 - Production Stage
FROM node:20-slim

# Install required system dependencies for Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    ca-certificates \
    dumb-init \
    --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Default command
CMD ["node", "dist/src/main"]
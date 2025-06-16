# Stage 1 - Build Stage
FROM node:23-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

# Stage 2 - Production Stage
FROM node:23-alpine

# Install system packages required by phantomjs
RUN apk add --no-cache \
    fontconfig \
    freetype \
    ttf-dejavu

WORKDIR /app

# Copy built application and production dependencies manifest
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY ./runSeeder.ts ./runSeeder.ts

# Install production dependencies
RUN npm install --production

# Reinstall phantomjs-prebuilt to ensure it's compiled for the correct environment
RUN npm uninstall phantomjs-prebuilt && \
    npm install phantomjs-prebuilt

# Your command to run the application
CMD ["node", "dist/src/main"]
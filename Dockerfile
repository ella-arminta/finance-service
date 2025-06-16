# Stage 1 - Build Stage
FROM node:23-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Generate Prisma client and build the application
RUN npx prisma generate
RUN npm run build

# Stage 2 - Production Stage
FROM node:23-alpine

# Install system packages required by PhantomJS, including a key compatibility library
RUN apk add --no-cache \
    fontconfig \
    freetype \
    ttf-dejavu \
    libc6-compat

WORKDIR /app

# Copy build artifacts from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# CRITICAL CHANGE: Copy the entire node_modules from the builder.
# This is less optimized but more reliable for problematic packages like phantomjs.
COPY --from=builder /app/node_modules ./node_modules

# Command to run the application
# Make sure this path is correct for your build output.
# CMD ["node", "dist/src/main"]
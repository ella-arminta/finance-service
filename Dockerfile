# Use official Node.js image
FROM node:22

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Prisma Generate and Migrate
RUN npx prisma generate

# Build the NestJS
RUN npm run build

RUN ls -la /app/dist
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

# ✅ Add system packages needed by PhantomJS
RUN apk add --no-cache \
    curl \
    fontconfig \
    freetype \
    ttf-dejavu \
    libpng \
    libstdc++ \
    dumb-init

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY ./runSeeder.ts ./runSeeder.ts

RUN npm install --production

# ✅ Optional, if you need seeders
RUN npm install ts-node --save-dev
RUN npm install --save-dev @types/bcrypt

# ✅ Ensure PhantomJS & html-pdf modules are copied
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/phantomjs-prebuilt ./node_modules/phantomjs-prebuilt
COPY --from=builder /app/node_modules/html-pdf ./node_modules/html-pdf

CMD ["node", "dist/main"]
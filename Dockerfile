# Use the official Node.js image as the base image
FROM node:22-alpine AS base
RUN apk add --no-cache git docker-cli curl
RUN curl -sSL https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc && \
  chmod +x /usr/local/bin/mc

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

FROM base  AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npx prisma generate \
  && npm run build

FROM base AS runner
WORKDIR /app
COPY package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
RUN npm ci --production --legacy-peer-deps


# Expose the application port
EXPOSE 2000

# Command to run the application
CMD ["node", "dist/main"]

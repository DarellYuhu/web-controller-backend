# Use the official Node.js image as the base image
FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM base  AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npx prisma generate \
  && npm run build

FROM base AS runner
COPY package*.json ./
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
RUN npm ci --production


# Expose the application port
EXPOSE 2000

# Command to run the application
CMD ["node", "dist/main"]

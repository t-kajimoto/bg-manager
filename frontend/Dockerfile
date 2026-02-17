# Dockerfile for Next.js Application

# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
EXPOSE 3000
# Start the production server via the canonical next CLI entry point
# (Next.js 13+ no longer ships the legacy next-start binary).
CMD ["node", "node_modules/next/dist/bin/next", "start"]

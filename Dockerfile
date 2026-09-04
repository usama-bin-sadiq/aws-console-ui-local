# Multi-stage production image for AWS Console
# Production stage uses next start; adapter connects to user endpoint.

FROM node:20.11-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20.11-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV ADAPTER_MODE=localstack
ENV LOCALSTACK_HOSTNAME=localstack
ENV LOCALSTACK_EDGE_PORT=4566
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
HEALTHCHECK CMD curl -f http://localhost:3000/api/health || exit 1
CMD ["npm", "start"]

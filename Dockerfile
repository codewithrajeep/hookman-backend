FROM node:22-alpine AS builder

WORKDIR /app

RUN apk upgrade --no-cache
RUN npm install -g pnpm@latest

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG DATABASE_URL
ARG DIRECT_URL
ENV DATABASE_URL=${DATABASE_URL}
ENV DIRECT_URL=${DIRECT_URL}

RUN pnpm prisma generate
RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./dist/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/server.js"]
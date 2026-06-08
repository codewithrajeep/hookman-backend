FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

ARG DATABASE_URL
ARG DIRECT_URL
ENV DATABASE_URL=$DATABASE_URL
ENV DIRECT_URL=$DIRECT_URL

RUN pnpm prisma generate
RUN pnpm build
RUN pnpm prisma generate
RUN mkdir -p dist/generated/prisma && \
    cp -r src/generated/prisma/. dist/generated/prisma/ && \
    mkdir -p dist/generated/prisma/node_modules/@prisma && \
    ln -s /app/node_modules/.pnpm/@prisma+client-runtime-utils@7.8.0/node_modules/@prisma/client-runtime-utils \
    dist/generated/prisma/node_modules/@prisma/client-runtime-utils

EXPOSE 3000
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/server.js"]
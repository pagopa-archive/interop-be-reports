FROM node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e AS base

FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN apk update

# Set working directory
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo prune --scope=selfcare-onboarding-consumer --docker

# remove all empty node_modules folder structure
RUN rm -rf /app/out/full/*/*/node_modules

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN corepack enable

# Build the project
COPY --from=builder /app/out/full/ .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=selfcare-onboarding-consumer

CMD node ./jobs/selfcare-onboarding-consumer/dist

# Use Node.js LTS version
FROM node:20-alpine AS base

# Install curl for dotenvx installation
RUN apk add --no-cache curl

# Install dotenvx globally
RUN curl -fsS https://dotenvx.sh | sh

# Set working directory
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

# ==============================
# Dependencies stage
# ==============================
FROM base AS dependencies

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# ==============================
# Build stage
# ==============================
FROM base AS build

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Prevent .env files from being built into the container
RUN dotenvx ext prebuild

# Build TypeScript
RUN pnpm build

# ==============================
# Production stage
# ==============================
FROM base AS production

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files from build stage
COPY --from=build /app/dist ./dist

# Expose the web app port
EXPOSE 3000

# Use dotenvx to run the application
# This will load environment variables securely at runtime
CMD ["dotenvx", "run", "--", "node", "dist/main.js"]


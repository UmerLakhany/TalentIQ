# ---------- Build stage: compile TypeScript ----------
FROM node:22-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY settings ./settings
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ---------- Runtime stage: compiled code + production dependencies only ----------
# Debian-based (not Alpine) so pdf-parse's native canvas binary works.
FROM node:22-slim
WORKDIR /app

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Uploaded CVs and request logs; uploads is mounted as a shared volume for the API and the worker.
RUN mkdir -p uploads logs && chown -R node:node /app
USER node

EXPOSE 4000

# Default: the API. The worker service overrides this with: node dist/src/worker.js
CMD ["node", "dist/src/index.js"]

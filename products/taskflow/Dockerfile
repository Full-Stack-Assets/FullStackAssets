FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci
COPY src ./src
COPY api ./api
COPY scripts ./scripts
COPY tests ./tests
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
RUN addgroup -S taskflow && adduser -S taskflow -G taskflow
COPY --from=build /app/dist ./dist
COPY package.json ./package.json
RUN mkdir -p /app/.taskflow-runs && chown -R taskflow:taskflow /app
USER taskflow
EXPOSE 3000
CMD ["node", "dist/src/server.js"]

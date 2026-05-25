FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .

FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=backend-build /app/backend /app/backend
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist
EXPOSE 5000
ENV NODE_ENV=production
WORKDIR /app/backend
CMD ["node", "server.js"]

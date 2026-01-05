FROM node:18-alpine AS builder
WORKDIR /app

# install deps and build
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

# copy production deps
COPY package.json package-lock.json* ./
RUN npm install --production

# copy built app and helper
COPY --from=builder /app/dist ./dist
COPY wait-for-postgres.js ./wait-for-postgres.js

EXPOSE 3000

CMD ["sh", "-c", "node wait-for-postgres.js && node dist/main.js"]

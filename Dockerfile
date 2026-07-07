# syntax=docker/dockerfile:1
# community-hub-admin — Vite/React SPA → nginx static server for Cloud Run.
# Cloud Run injects PORT (default 8080); nginx listens on 8080.

# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Vite inlines these at BUILD time. All three are PUBLIC values
# (API URL + Stripe *publishable* key), so baking them into the image is safe.
# Override at build via --build-arg if you ever point at a different API.
ARG VITE_GRAPHQL_ENDPOINT="https://api.diaspoplug.net/graphql"
ARG VITE_MESSAGE_WS_URL="https://api.diaspoplug.net"
ARG VITE_STRIPE_PUBLISHABLE_KEY=""
ENV VITE_GRAPHQL_ENDPOINT=$VITE_GRAPHQL_ENDPOINT \
    VITE_MESSAGE_WS_URL=$VITE_MESSAGE_WS_URL \
    VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

# ---------- Build Stage ----------
FROM node:20-alpine AS build

WORKDIR /app

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Break Railway cache
ARG CACHE_BREAK=1

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

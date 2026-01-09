# ---------- Build Stage ----------
FROM node:20-alpine AS build

WORKDIR /app

ARG CACHE_BREAK
ENV CACHE_BREAK=$CACHE_BREAK

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

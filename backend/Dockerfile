# ---------- Build Stage ----------
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build the React app
RUN npm run build

# ---------- Production Stage ----------
FROM nginx:alpine

# Copy build output to Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

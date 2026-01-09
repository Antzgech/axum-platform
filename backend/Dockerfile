FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Railway needs a fixed port for Dockerfile services
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]

FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
# Run npm install to install runtime dependencies
RUN npm install

COPY . .
RUN mkdir -p server/data

EXPOSE 3000
CMD ["node", "server/index.js"]

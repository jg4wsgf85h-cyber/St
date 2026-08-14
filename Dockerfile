FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build client and server bundles
RUN npm run build

# Expose default port
EXPOSE 3000

ENV NODE_ENV=production

# Start production server
CMD ["npm", "start"]

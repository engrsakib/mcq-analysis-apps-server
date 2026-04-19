FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cache layer)
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.paths.json ./

RUN npm install

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 9001

# Start the server
CMD ["npm", "start"]

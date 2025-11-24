FROM node:20-alpine

WORKDIR /app

# Install build tools required for better-sqlite3 (native addon)
RUN apk add --no-cache python3 make g++

# Install backend dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy backend source
COPY . .

EXPOSE 8080

CMD ["npm", "start"]

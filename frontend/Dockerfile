# Stage 1: Build Vite React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests first for optimal caching
COPY package*.json ./

# Install dependencies inside Linux container
RUN npm install

# Copy source code (excluding node_modules and dist via .dockerignore)
COPY . .

# Ensure binaries have executable permissions
RUN chmod +x node_modules/.bin/* || true

# Build production bundle
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose container port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# ---------- Stage 1: Build the Vite React app ----------
FROM node:18 AS build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------- Stage 2: Serve built files using Nginx ----------
FROM nginx:stable-alpine

# Copy build output from Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Expose web port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

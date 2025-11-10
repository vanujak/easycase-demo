# Use Node.js LTS image
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy dependency files first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the backend source
COPY . .

# Expose backend port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]

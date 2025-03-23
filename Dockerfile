FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install

# Copy remaining code
COPY . .

# Build client
RUN cd client && npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"] 
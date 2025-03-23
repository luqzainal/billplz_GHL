FROM node:16-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies for root
RUN npm install

# Copy the entire project
COPY . .

# Install dependencies and build client
RUN cd client && npm install && npm run build

# Install dependencies for server
RUN cd server && npm install

# Expose the server port
EXPOSE 5000

# Start the server
CMD ["npm", "start"] 
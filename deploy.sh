#!/bin/bash

# This script helps to deploy the application to a DigitalOcean Droplet
# Usage: bash deploy.sh DROPLET_IP

# Check if IP is provided
if [ -z "$1" ]; then
  echo "Please provide the Droplet IP address"
  echo "Usage: bash deploy.sh DROPLET_IP"
  exit 1
fi

DROPLET_IP=$1
REMOTE_USER="root"

echo "Deploying to DigitalOcean Droplet at $DROPLET_IP..."

# Ensure server is clean for deployment
ssh $REMOTE_USER@$DROPLET_IP << 'EOF'
  # Stop any running containers
  docker stop billplz-app || true
  docker rm billplz-app || true
  
  # Clean up old data
  rm -rf /root/billplz-app
  mkdir -p /root/billplz-app
EOF

# Copy files to server
echo "Copying files to server..."
scp -r ./* $REMOTE_USER@$DROPLET_IP:/root/billplz-app/

# Deploy on server
echo "Building and starting the application..."
ssh $REMOTE_USER@$DROPLET_IP << 'EOF'
  cd /root/billplz-app
  
  # Create .env file (you should edit this with real values)
  cp .env.example .env
  nano .env
  
  # Build and run Docker container
  docker build -t billplz-payment .
  docker run -d -p 80:5000 --name billplz-app --env-file .env billplz-payment
  
  echo "Checking if container is running..."
  docker ps
  
  echo "Application deployed successfully!"
  echo "You can access it at: http://$HOSTNAME"
EOF

echo "Deployment completed!"
echo "Your application should be available at: http://$DROPLET_IP" 
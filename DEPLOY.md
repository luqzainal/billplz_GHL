# Deployment Guide

This guide will help you deploy the Billplz Payment application to a DigitalOcean Droplet.

## Prerequisites

1. A DigitalOcean account
2. SSH key setup with your DigitalOcean account
3. MongoDB instance (can be MongoDB Atlas or self-hosted)
4. Billplz account with API credentials

## Creating a Droplet

1. Log in to DigitalOcean
2. Click **Create > Droplets**
3. Choose **Marketplace > Docker on Ubuntu**
4. Select a plan (Basic, $6/month is sufficient for most use cases)
5. Choose a datacenter region close to your users
6. Add your SSH key
7. Click **Create Droplet**

## Deploying the Application

### Option 1: Using the Deployment Script

1. Clone this repository:
   ```bash
   git clone https://github.com/luqzainal/billplz_GHL.git
   cd billplz_GHL
   ```

2. Make the deployment script executable:
   ```bash
   chmod +x deploy.sh
   ```

3. Run the deployment script with your Droplet's IP:
   ```bash
   ./deploy.sh YOUR_DROPLET_IP
   ```

4. Follow the prompts to complete the deployment

### Option 2: Manual Deployment

1. SSH into your Droplet:
   ```bash
   ssh root@YOUR_DROPLET_IP
   ```

2. Clone the repository:
   ```bash
   git clone https://github.com/luqzainal/billplz_GHL.git billplz-app
   cd billplz-app
   ```

3. Create and edit the .env file:
   ```bash
   cp .env.example .env
   nano .env
   ```

   Update the environment variables with your values:
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/billplz_payment
   BASE_URL=http://YOUR_DROPLET_IP
   CLIENT_ID=your_client_id
   CLIENT_SECRET=your_client_secret
   REDIRECT_URI=http://YOUR_DROPLET_IP/oauth/callback
   NODE_ENV=production
   ```

4. Build and run the Docker container:
   ```bash
   docker build -t billplz-payment .
   docker run -d -p 80:5000 --name billplz-app --env-file .env billplz-payment
   ```

5. Verify the container is running:
   ```bash
   docker ps
   ```

## Accessing the Application

Once deployed, your application will be available at:
```
http://YOUR_DROPLET_IP
```

## Troubleshooting

### Viewing Logs
```bash
docker logs billplz-app
```

### Restarting the Application
```bash
docker restart billplz-app
```

### Rebuilding After Changes
```bash
docker stop billplz-app
docker rm billplz-app
docker build -t billplz-payment .
docker run -d -p 80:5000 --name billplz-app --env-file .env billplz-payment
```

## Setting Up a Domain (Optional)

1. Add an A record in your domain's DNS settings pointing to your Droplet's IP

2. Install Nginx:
   ```bash
   apt-get update
   apt-get install nginx
   ```

3. Configure Nginx:
   ```bash
   nano /etc/nginx/sites-available/billplz-app
   ```

   Add the following configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. Enable the site:
   ```bash
   ln -s /etc/nginx/sites-available/billplz-app /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

5. Set up SSL with Certbot:
   ```bash
   apt-get install certbot python3-certbot-nginx
   certbot --nginx -d your-domain.com
   ```

6. Update your .env file with the new domain:
   ```
   BASE_URL=https://your-domain.com
   REDIRECT_URI=https://your-domain.com/oauth/callback
   ```

7. Restart the container:
   ```bash
   docker restart billplz-app
   ``` 
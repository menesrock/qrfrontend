# QR Restaurant System - Deployment Guide

## VM Requirements
- Ubuntu 20.04+ or Debian 11+
- 2GB RAM minimum
- 20GB disk space
- Node.js 18+
- PostgreSQL 14+
- Nginx

## Quick Deployment

### 1. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

### 2. Setup Database
```bash
sudo -u postgres psql
CREATE DATABASE qr_restaurant;
CREATE USER restaurant_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE qr_restaurant TO restaurant_user;
\q
```

### 3. Deploy Backend
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run build
pm2 start dist/server.js --name qr-restaurant-api
pm2 save
pm2 startup
```

### 4. Deploy Frontend
```bash
npm install
npm run build
sudo cp -r web-build/* /var/www/qr-restaurant/
```

### 5. Configure Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/qr-restaurant;
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /path/to/backend/uploads;
    }
}
```

### 6. SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Environment Variables
Create `.env` files in both frontend and backend directories.

## Monitoring
```bash
pm2 monit
pm2 logs qr-restaurant-api
```

## Backup
```bash
pg_dump qr_restaurant > backup.sql
```

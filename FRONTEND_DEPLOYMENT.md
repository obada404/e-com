# Frontend Deployment Guide (React + Vite + TypeScript)

This guide explains how to deploy your React frontend application on the same server as your backend.

## Prerequisites

- Server IP: `159.198.36.64`
- Backend API running at: `http://159.198.36.64:3000`
- Frontend Repository: `https://github.com/obada404/alezgraduation.git`
- Nginx installed (for serving static files)

## Option 1: Deploy with Nginx (Recommended for Production)

### Step 1: Install Nginx

```bash
apt update
apt install -y nginx
```

### Step 2: Build Your Frontend Locally or on Server

**Option A: Build on your local machine:**
```bash
# On your local machine
cd /path/to/your/frontend
npm install
npm run build
# This creates a 'dist' folder
```

**Option B: Build on the server (Recommended):**
```bash
# On server - clone your frontend repository
cd /var/www
git clone git@github.com:obada404/alezgraduation.git frontend
cd frontend

# Create .env file with your backend API URL
nano .env
```

Add this to `.env`:
```env
VITE_API_BASE_URL=http://159.198.36.64:3000
```

Then build:
```bash
npm install
npm run build
```

### Step 3: Configure Nginx

Create Nginx configuration file:

```bash
nano /etc/nginx/sites-available/frontend
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name 159.198.36.64;  # Or your domain name if you have one

    root /var/www/frontend/dist;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend (if your frontend uses /api prefix)
    # If your frontend calls the API directly, you may not need this
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Optional: Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Note:** Your frontend uses `VITE_API_BASE_URL` environment variable, so make sure it's set to `http://159.198.36.64:3000` in the `.env` file before building.

### Step 4: Enable the Site

```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/

# Remove default site (optional)
rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx
```

### Step 5: Configure Firewall

```bash
# Allow HTTP (port 80)
ufw allow 80/tcp

# Allow HTTPS (port 443) if you plan to use SSL
ufw allow 443/tcp

# Check firewall status
ufw status
```

### Step 6: Access Your Frontend

- **Frontend:** `http://159.198.36.64`
- **Backend API:** `http://159.198.36.64/api` (proxied to port 3000)

## Option 2: Deploy with Docker

### Step 1: Create Dockerfile for Frontend

Create `Dockerfile` in your frontend project root:

```dockerfile
# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (optional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Step 2: Create docker-compose.yml for Frontend

Create `docker-compose.frontend.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ecommerce-frontend
    ports:
      - "80:80"
    networks:
      - ecommerce-network
    restart: unless-stopped

networks:
  ecommerce-network:
    external: true
```

### Step 3: Deploy Frontend

```bash
cd /var/www/frontend
docker-compose -f docker-compose.frontend.yml up -d --build
```

### Step 4: Update Backend docker-compose.yml to Share Network

Make sure your backend `docker-compose.yml` uses the same network:

```yaml
networks:
  ecommerce-network:
    driver: bridge
```

## Option 3: Combined docker-compose.yml (Frontend + Backend)

Create a single `docker-compose.yml` that includes both:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: ecommerce-postgres
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: ecommerce
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - ecommerce-network
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready -U user" ]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ecommerce-api
    env_file:
      - ./backend/.env
    environment:
      DATABASE_URL: postgresql://user:password@postgres:5432/ecommerce?schema=public
      JWT_SECRET: your-secret-key-change-this-in-production
      JWT_EXPIRES_IN: 1d
      ADMIN_EMAIL: admin@example.com
      ADMIN_PASSWORD: admin123
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ecommerce-network
    command: sh -c "npx prisma generate && npx prisma db push --accept-data-loss && node dist/main.js"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: ecommerce-frontend
    ports:
      - "80:80"
    depends_on:
      - api
    networks:
      - ecommerce-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  ecommerce-network:
    driver: bridge
```

## Frontend Environment Variables

Your frontend repository uses `VITE_API_BASE_URL`. Create `.env` file in your frontend root:

```env
VITE_API_BASE_URL=http://159.198.36.64:3000
```

**Important:** 
- Create this `.env` file BEFORE running `npm run build`
- The environment variable is embedded at build time
- After building, the API URL is baked into the built files
- If you need to change it later, rebuild the frontend

## Quick Deployment Steps Summary

### For Nginx Deployment (Recommended):

```bash
# 1. Install Nginx
apt update && apt install -y nginx

# 2. Clone frontend repository
cd /var/www
git clone git@github.com:obada404/alezgraduation.git frontend
cd frontend

# 3. Create .env file with backend API URL
echo "VITE_API_BASE_URL=http://159.198.36.64:3000" > .env

# 4. Install dependencies and build
npm install
npm run build

# 5. Configure Nginx
nano /etc/nginx/sites-available/frontend
# (Add configuration from Step 3 above)

# 6. Enable site
ln -s /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Remove default site
nginx -t
systemctl restart nginx

# 7. Open firewall
ufw allow 80/tcp
```

### For Docker Deployment:

```bash
# 1. Clone frontend
cd /var/www
git clone git@github.com:obada404/alezgraduation.git frontend
cd frontend

# 2. Create .env file
echo "VITE_API_BASE_URL=http://159.198.36.64:3000" > .env

# 3. Create Dockerfile (see Option 2 above)

# 4. Build and run
docker-compose -f docker-compose.frontend.yml up -d --build
```

## Troubleshooting

### Frontend not loading:
```bash
# Check Nginx status
systemctl status nginx

# Check Nginx logs
tail -f /var/log/nginx/error.log

# Check if files exist
ls -la /var/www/frontend/dist/
```

### API calls failing:
```bash
# Check if backend is running
curl http://localhost:3000

# Check CORS settings in backend
# Make sure backend allows requests from frontend domain
```

### Docker issues:
```bash
# Check container logs
docker logs ecommerce-frontend

# Check if containers are running
docker ps
```

## SSL/HTTPS Setup (Optional but Recommended)

If you have a domain name, set up SSL with Let's Encrypt:

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com

# Auto-renewal is set up automatically
```

## Access URLs

After deployment:
- **Frontend:** `http://159.198.36.64` (or your domain)
- **Backend API:** `http://159.198.36.64:3000` (direct) or `http://159.198.36.64/api` (via Nginx proxy)
- **Swagger Docs:** `http://159.198.36.64:3000/docs`

---

**Last Updated:** January 2025

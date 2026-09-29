# ShopiTry: Enterprise AWS Production Deployment Guide

This document provides a comprehensive, step-by-step production deployment guide for the **ShopiTry** full-stack microservices ecosystem. It covers provisioning databases on MongoDB Atlas, deploying serverless functions to AWS Lambda, deploying core microservices to AWS EC2 / VM Instances, and hosting twin React SPAs on AWS S3 with CloudFront CDN distributions.

---

## 🔑 Production Environment & Database Parameters

| Parameter | Value |
| :--- | :--- |
| **Application Name** | `ShopiTry` |
| **MongoDB Atlas Cluster Name** | `edublitz` |
| **Database Username** | `linux` |
| **Database Password** | `redhat` |
| **Connection URI Pattern** | `mongodb+srv://<db_username>:<db_password>@edublitz.laegfsa.mongodb.net/?appName=edublitz` |
| **Catalog Database Name** | `catalog_db` |
| **Cart Database Name** | `cart_db` |
| **Orders Database Name** | `orders_db` |

---

## 📋 Architecture & Deployment Topology

| Component | Target Infrastructure | Deployment Primitive | Target URL / Port |
| :--- | :--- | :--- | :--- |
| **`storefront`** | AWS S3 Bucket + CloudFront CDN | React Production SPA (`dist/`) | `https://store.shopitry.com` |
| **`admin-dashboard`** | AWS S3 Bucket + CloudFront CDN | React Production SPA (`dist/`) | `https://admin.ankush.fun` |
| **`gateway-service`** | AWS EC2 (VM Server 1) | Node.js + PM2 + Nginx Proxy | `https://api.ankush.fun` (5000) |
| **`catalog-service`** | AWS EC2 (VM Server 2) | Node.js + PM2 + MongoDB Atlas | Private VPC (5001) |
| **`cart-service`** | AWS EC2 (VM Server 3) | Node.js + PM2 + MongoDB Atlas | Private VPC (5002) |
| **`order-service`** | AWS EC2 (VM Server 4) | Node.js + PM2 + MongoDB Atlas | Private VPC (5003) |
| **`payment-service`** | AWS Lambda 1 | Node.js 20.x Runtime | AWS Lambda API Gateway (5004) |
| **`notification-service`** | AWS Lambda 2 | Node.js 20.x Runtime | AWS Lambda API Gateway (5005) |

---
```
url to install mongosh - https://www.mongodb.com/docs/mongodb-shell/install/?operating-system=linux&linux-distribution=ubuntu&ubuntu-version=noble 
url to install node npm - https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-22-04
```
## 🗄️ Phase 1: MongoDB Atlas Database Provisioning (`edublitz`)

1. Connect to the **MongoDB Atlas Cluster** named `edublitz`:
   - Cluster Host: `edublitz.laegfsa.mongodb.net`
   - Application Name: `edublitz`
2. Create the Database User and Password:
   - **Username**: `linux`
   - **Password**: `redhat`
3. Verify the creation of the three microservice databases:
   - `catalog_db`
   - `cart_db`
   - `orders_db`
4. Add your EC2 VM server public/private IPs to the Atlas **Network Access / IP Access List**.
5. The MongoDB Atlas Connection URIs for each microservice are:

   **Catalog Service Connection URI**:
   ```env
   MONGODB_URI=mongodb+srv://linux:redhat@edublitz.laegfsa.mongodb.net/catalog_db?appName=edublitz
   ```

   **Cart Service Connection URI**:
   ```env
   MONGODB_URI=mongodb+srv://linux:redhat@edublitz.laegfsa.mongodb.net/cart_db?appName=edublitz
   ```

   **Order Service Connection URI**:
   ```env
   MONGODB_URI=mongodb+srv://linux:redhat@edublitz.laegfsa.mongodb.net/orders_db?appName=edublitz
   ```

---

## ⚡ Phase 2: Deploying AWS Lambda Serverless Functions

### 1. Deploy `payment-service` (AWS Lambda 1)
```
aws iam create-role \
  --role-name ShopiTryLambdaRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "lambda.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

```
```
aws iam attach-role-policy \
  --role-name ShopiTryLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

```
```
aws lambda create-function \
  --function-name shopitry-payment-service \
  --runtime nodejs20.x \
  --role arn:aws:iam::897013207591:role/ShopiTryLambdaRole \
  --handler src/handler.handler \
  --zip-file fileb://payment-service.zip \
  --region us-east-1  #ap-south-1

```

```bash
# Navigate to payment service
cd backend/payment-service

# Install production dependencies only
npm install --production

# Create deployment package artifact
zip -r payment-service.zip src node_modules package.json

# Deploy to AWS Lambda via AWS CLI
aws lambda create-function \
  --function-name shopitry-payment-service \
  --runtime nodejs20.x \
  --role arn:aws:iam::123456789012:role/service-role/ShopiTryLambdaRole \
  --handler src/handler.handler \
  --zip-file fileb://payment-service.zip \
  --region us-east-1

# Configure environment variables
aws lambda update-function-configuration \
  --function-name shopitry-payment-service \
  --environment "Variables={AWS_REGION=us-east-1,PAYMENT_GATEWAY_MODE=PRODUCTION}"
```

### 2. Deploy `notification-service` (AWS Lambda 2)
```
aws sns create-topic \
  --name aethercart-notifications \
  --region ap-south-1
```
```
aws lambda create-function \
  --function-name shopitry-notification-service \
  --runtime nodejs20.x \
  --role arn:aws:iam::897013207591:role/ShopiTryLambdaRole \
  --handler src/handler.handler \
  --zip-file fileb://notification-service.zip \
  --region us-east-1
```

```bash
# Navigate to notification service
cd backend/notification-service

# Install production dependencies
npm install --production

# Create deployment package artifact
zip -r notification-service.zip src node_modules package.json

# Deploy to AWS Lambda via AWS CLI
aws lambda create-function \
  --function-name shopitry-notification-service \
  --runtime nodejs20.x \
  --role arn:aws:iam::123456789012:role/service-role/ShopiTryLambdaRole \
  --handler src/handler.handler \
  --zip-file fileb://notification-service.zip \
  --region us-east-1
```

---

## 🖥️ Phase 3: Deploying Core Microservices to AWS EC2 / VM Instances

### 1. Provision EC2 Instances
Launch 4 Ubuntu 22.04 LTS EC2 instances (or VM Servers):
- **VM Server 1**: `gateway-service` (Public subnet, Ports 80, 443, 5000)
- **VM Server 2**: `catalog-service` (Private subnet, Port 5001)
- **VM Server 3**: `cart-service` (Private subnet, Port 5002)
- **VM Server 4**: `order-service` (Private subnet, Port 5003)

### 2. Server Setup Commands (All VM Servers)
Execute on each VM server via SSH:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS & Nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# Install PM2 process manager globally
sudo npm install -g pm2
```

### 3. Deploy Gateway Service (VM Server 1)

```bash
# Clone project repository
git clone https://github.com/your-org/placement-project.git /var/www/shopitry
cd /var/www/shopitry/backend/gateway-service

# Install dependencies
npm install --production

# Configure production .env file
cat <<EOT > .env
PORT=5000
JWT_SECRET=shopitry_super_secret_jwt_key_2026
CATALOG_SERVICE_URL=http://<VM_SERVER_2_PRIVATE_IP>:5001
CART_SERVICE_URL=http://<VM_SERVER_3_PRIVATE_IP>:5002
ORDER_SERVICE_URL=http://<VM_SERVER_4_PRIVATE_IP>:5003
PAYMENT_SERVICE_URL=http://<LAMBDA_PAYMENT_URL_OR_PORT_5004>
NOTIFICATION_SERVICE_URL=http://<LAMBDA_NOTIFICATION_URL_OR_PORT_5005>
EOT

# Start gateway service using PM2
pm2 start src/index.js --name "gateway-service"
pm2 save
pm2 startup
```

### 4. Deploy Catalog Service (VM Server 2)

```bash
cd /var/www/shopitry/backend/catalog-service
npm install --production

cat <<EOT > .env
PORT=5001
MONGODB_URI=mongodb+srv://linux:redhat@edublitz.laegfsa.mongodb.net/catalog_db?appName=edublitz
EOT

pm2 start src/index.js --name "catalog-service"
pm2 save
```

### 5. Deploy Cart Service (VM Server 3)

```bash
cd /var/www/shopitry/backend/cart-service
npm install --production

cat <<EOT > .env
PORT=5002
MONGODB_URI=mongodb+srv://linux:redhat@edublitz.laegfsa.mongodb.net/cart_db?appName=edublitz
EOT

pm2 start src/index.js --name "cart-service"
pm2 save
```

### 6. Deploy Order Service (VM Server 4)

```bash
cd /var/www/shopitry/backend/order-service
npm install --production

cat <<EOT > .env
PORT=5003
MONGODB_URI=mongodb+srv://linux:redhat@edublitz.laegfsa.mongodb.net/orders_db?appName=edublitz
CART_SERVICE_URL=http://<VM_SERVER_3_PRIVATE_IP>:5002
PAYMENT_SERVICE_URL=http://<LAMBDA_PAYMENT_URL_OR_PORT_5004>
NOTIFICATION_SERVICE_URL=http://<LAMBDA_NOTIFICATION_URL_OR_PORT_5005>
EOT

pm2 start src/index.js --name "order-service"
pm2 save
```

### 7. Configure Nginx Reverse Proxy & SSL on Gateway Server
On **VM Server 1** (`gateway-service`):

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/shopitry

# Paste configuration:
server {
    server_name admin.ankush.fun;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Enable site & restart Nginx
sudo ln -s /etc/nginx/sites-available/shopitry /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# SSL Certificate setup with Certbot
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d admin.ankush.fun
```

### 🔒 Advanced Custom Domain & SSL/TLS Certificate Setup 

To secure the production environment and enable HTTPS encryption for the admin dashboard (`admin.ankush.fun`), an automated SSL/TLS certificate was provisioned and configured using Certbot and Let's Encrypt on VM Server 1.

#### 1. Install Certbot and Nginx Plugin
Execute the following commands on your EC2 instance via SSH to install Certbot:
```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

2. Request and Deploy SSL Certificate
Run the Certbot Nginx plugin to automatically fetch the SSL certificate, update your Nginx configuration block to listen on port 443, and handle HTTP-to-HTTPS redirection:
```bash
sudo certbot --nginx -d admin.ankush.fun
```
During the prompt, enter your valid email address, agree to the terms of service, and choose the option to Redirect all HTTP traffic to HTTPS automatically

4. Verify Automatic SSL Renewal
Let's Encrypt certificates expire every 90 days. To ensure zero downtime, verify the automated renewal cron job or systemd timer:
```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

---

## 🌐 Phase 4: Deploying React SPAs to AWS S3 & CloudFront

### 1. Deploy Customer Storefront (`frontend/storefront`)

```bash
# Build React storefront for production
cd frontend/storefront
npm run build

# Create S3 Bucket
aws s3 mb s3://shopitry-storefront-prod --region us-east-1

# Enable static website hosting
aws s3 website s3://shopitry-storefront-prod/ --index-document index.html --error-document index.html

# Sync build files to S3 bucket
aws s3 sync dist/ s3://shopitry-storefront-prod --delete --acl public-read
```

### 2. Deploy Operations Admin Dashboard (`frontend/admin-dashboard`)

```bash
# Build React admin application for production
cd frontend/admin-dashboard
npm run build

# Create S3 Bucket
aws s3 mb s3://shopitry-admin-prod --region us-east-1

# Enable static website hosting
aws s3 website s3://shopitry-admin-prod/ --index-document index.html --error-document index.html

# Sync build files to S3 bucket
aws s3 sync dist/ s3://shopitry-admin-prod --delete --acl public-read
```

---

## 🔍 Phase 5: Verification & Health Checks

Run these commands to verify that all deployment targets are online and healthy:

```bash
# 1. Test Gateway Health Endpoint
curl -i https://admin.ankush.fun/health

# 2. Test Catalog Products API via Gateway
curl -i https://admin.ankush.fun/api/catalog/products

# 3. Test Admin Authentication via Gateway
curl -i -X POST https://admin.ankush.fun/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shopitry.com","password":"adminpassword123"}'

# 4. Check PM2 status on VM Servers
pm2 status
pm2 logs --lines 50
```

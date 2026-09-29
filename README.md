# ShopiTry: Full-Stack Microservices E-Commerce Ecosystem

Welcome to **ShopiTry**—a production-ready, decoupled microservices e-commerce platform built using Node.js, MongoDB Atlas, AWS deployment primitives, and two distinct React single-page applications (`storefront` and `admin-dashboard`).

🌐 **Live Production & SSL Deployment**: 
* Hosted live on **AWS EC2** using custom domains (**`admin.ankush.fun`** and your ankush.fun ).
* Secured with active **SSL/TLS Certificates** via AWS Certificate Manager and NGINX reverse proxy routing.

---

## 📖 About the Application

**ShopiTry** is designed around a modern **Database-per-Service** and **Decoupled API Gateway** architecture. It simulates an enterprise e-commerce platform where microservices communicate over HTTP/REST APIs, authenticate using JSON Web Tokens (JWT), enforce fine-grained Role-Based Access Control (RBAC), and integrate serverless AWS primitives (AWS Lambda, S3, CloudFront).

### Sub-Brands & Ecosystem Components:
- **`ShopiTry Storefront`**: Customer-facing React SPA offering a sleek glassmorphic UI, real-time product filtering, interactive quick-specs modals, a slide-in shopping cart drawer, multi-step checkout pipeline, customer authentication, order history tracking, and a live microservices cluster telemetry monitor.
- **`ShopiTry Admin`**: Operations & Analytics React SPA allowing platform administrators to view real-time revenue KPIs, manage product SKUs (CRUD), control order state machine transitions (`PENDING` -> `PAID` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`), and monitor backend cluster health.
- **`ShopiTry Gateway`**: Central API Gateway handling user authentication, session security, CORS, rate-limiting, and reverse-proxying request traffic to upstream microservices.

---

## 💻 Tech Stack

### Frontend Architecture
- **Framework**: React 18 + Vite (SPA)
- **Styling**: Modern Vanilla CSS Design System with Glassmorphism, Dark Ambient Gradients, and CSS Custom Properties.
- **Icons**: Lucide React (`lucide-react`)
- **Hosting Target**: AWS S3 Static Website Hosting + AWS CloudFront CDN

### Backend Microservices
- **Runtime**: Node.js 20.x
- **Framework**: Express.js
- **Authentication & Security**: JSON Web Token (`jsonwebtoken`), Role-Based Access Control (RBAC), CORS (`cors`), Rate Limiting (`express-rate-limit`).
- **Database**: MongoDB Atlas (`edublitz` cluster) with Mongoose ORM.
- **Serverless Primitives**: AWS Lambda compatible handler signatures (`exports.handler`) with local HTTP Express wrappers for local development.

### Infrastructure & Deployment Primitives
- **AWS S3 & CloudFront**: Hosting & CDN distribution for both React SPAs (`storefront` and `admin-dashboard`).
- **AWS EC2 / VM Instances**: Hosting for long-running Node.js microservices (`gateway-service`, `catalog-service`, `cart-service`, `order-service`).
- **AWS Lambda**: Hosting for serverless event-driven functions (`payment-service` and `notification-service`).
- **Process Manager**: PM2 for EC2 process resilience.
- **Custom Domains**: Live production setup configured with custom domains including `admin.ankush.fun`.
- **SSL / TLS Security**: Secure HTTPS traffic routing configured using SSL/TLS certificates and NGINX reverse proxy on AWS EC2.

---

## 🏗️ Ecosystem Architecture

```text
                [ Custom Domains: admin.ankush.fun & ankush.fun (HTTPS / SSL Secure) ]
                                                    │
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │       AWS CloudFront / AWS S3           │
                               │  ┌──────────────────┐ ┌───────────────┐ │
                               │  │ShopiTry Storefront││ ShopiTry Admin│ │
                               │  └────────┬─────────┘ └───────┬───────┘ │
                               └───────────┼───────────────────┼─────────┘
                                           │                   │
                                           ▼                   ▼
                               ┌─────────────────────────────────────────┐
                               │     VM Server 1: Gateway Service        │
                               │           (Port 5000 / JWT Auth)        │
                               └───────────────────┬─────────────────────┘
                                                   │
         ┌───────────────────┬─────────────────────┼─────────────────────┬───────────────────┐
         │                   │                     │                     │                   │
         ▼                   ▼                     ▼                     ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│  VM Server 2    │ │   VM Server 3   │ │   VM Server 4   │ │   AWS Lambda 1    │ │   AWS Lambda 2    │
│ Catalog Service │ │  Cart Service   │ │  Order Service  │ │  Payment Service  │ │Notification Service│
│   (Port 5001)   │ │   (Port 5002)   │ │   (Port 5003)   │ │    (Port 5004)    │ │    (Port 5005)    │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘ └───────────────────┘ └───────────────────┘
         │                   │                   │
         ▼                   ▼                   ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             MongoDB Atlas Cluster: edublitz                                      │
│        (catalog_db)               (cart_db)                    (orders_db)                       │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Directory Structure

```text
/
├── README.md                   # System Architecture & Documentation
├── DEPLOYMENT.md               # Production AWS Deployment Guide & Step-by-Step Commands
├── start-all.js                # Root Node.js Cluster Orchestration Launcher
├── cleanup-ports.js            # Port cleanup utility (Ports 5000-5005)
├── frontend/
│   ├── storefront/             # Customer React SPA (Port 5173 dev)
│   └── admin-dashboard/        # Admin Operations React SPA (Port 5174 dev)
└── backend/
    ├── gateway-service/        # Node.js API Gateway & Auth Engine (Port 5000)
    ├── catalog-service/        # Product Catalog Microservice (Port 5001)
    ├── cart-service/           # Cart & Session Microservice (Port 5002)
    ├── order-service/          # Order Processing Microservice (Port 5003)
    ├── payment-service/        # AWS Lambda 1 Payment Microservice (Port 5004)
    └── notification-service/   # AWS Lambda 2 Notification Microservice (Port 5005)
```

---

## 🔌 Service Port Registry & API Specifications

| Service Name | Type / Primitive | Port | Primary Endpoint | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Gateway Service** | VM Server 1 | `5000` | `/api/auth/*`, `/api/*` | Central reverse proxy, JWT Auth & RBAC |
| **Catalog Service** | VM Server 2 | `5001` | `/api/catalog/products` | Product listings, categories, search & CRUD |
| **Cart Service** | VM Server 3 | `5002` | `/api/cart` | Session shopping cart & tax/shipping calculation |
| **Order Service** | VM Server 4 | `5003` | `/api/orders` | Checkout pipeline, order state machine |
| **Payment Service** | AWS Lambda 1 | `5004` | `/api/payments/process` | Payment authorization & intent processing |
| **Notification Service** | AWS Lambda 2 | `5005` | `/api/notifications/send` | Order email confirmations & SNS event alerts |

---

## 🚀 Quick Start Guide (Local Development)

### 1. Install Dependencies & Launch Backend Cluster
Run the root launcher script to start all 6 microservices simultaneously:

```bash
# Launch all 6 microservices
node start-all.js
```

### 2. Launch Customer Storefront
In a new terminal window:
```bash
cd frontend/storefront
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Launch Operations Admin Dashboard
In another terminal window:
```bash
cd frontend/admin-dashboard
npm run dev
```
Open [http://localhost:5174](http://localhost:5174) in your browser.

---

## 🔑 Default Credentials & Accounts

- **Customer Demo Account**:
  - Email: `elena@example.com`
  - Password: `customerpassword123`
- **Admin Demo Account**:
  - Email: `admin@shopitry.com`
  - Password: `adminpassword123`

---

## 📘 Production Deployment Guide

For step-by-step instructions on deploying **ShopiTry** to AWS S3, CloudFront, EC2, Lambda, and MongoDB Atlas (`edublitz`), please see [DEPLOYMENT.md](file:///Users/shubhamkalsait/claude-projects/development/placement-project/DEPLOYMENT.md).

# BIZPOS Deployment Guide

Complete step-by-step guide to deploy BIZPOS for free demo hosting using Railway (backend) and Vercel (frontend).

---

## Prerequisites

- GitHub account with code pushed (✓ Done: https://github.com/adiityapratap/pos)
- Railway account (free): https://railway.app
- Vercel account (free): https://vercel.com

---

## Part 1: Deploy Backend to Railway

### Step 1: Create Railway Account & Project

1. Go to **https://railway.app**
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your GitHub

### Step 2: Create New Project

1. Click **"New Project"** button
2. Select **"Deploy from GitHub repo"**
3. Find and select **"adiityapratap/pos"** repository
4. Railway will detect the monorepo - **DO NOT** start deployment yet
5. Click **"Add variables"** first

### Step 3: Add PostgreSQL Database

1. In your project, click **"+ New"** button
2. Select **"Database"** → **"Add PostgreSQL"**
3. Wait for PostgreSQL to provision (takes ~30 seconds)
4. Click on the PostgreSQL service
5. Go to **"Variables"** tab
6. Copy the **DATABASE_URL** value (you'll need this)

### Step 4: Configure Backend Service

1. Click on the GitHub service (your code)
2. Go to **"Settings"** tab
3. Set **Root Directory**: `apps/backend`
4. Set **Build Command**: `npm install && npx prisma generate && npm run build`
5. Set **Start Command**: `npx prisma migrate deploy && npm run start:prod`

### Step 5: Add Environment Variables

Go to **"Variables"** tab and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | (paste the URL from PostgreSQL service) |
| `JWT_SECRET` | `bizpos-demo-secret-key-change-in-prod-2024` |
| `JWT_EXPIRATION` | `8h` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |

### Step 6: Deploy Backend

1. Click **"Deploy"** button
2. Wait for build to complete (3-5 minutes)
3. Once deployed, go to **"Settings"** → **"Networking"**
4. Click **"Generate Domain"**
5. Copy your URL (e.g., `https://pos-production-xxxx.up.railway.app`)

### Step 7: Seed Database (One-time)

After deploy succeeds, go to **"Settings"** tab and temporarily change:
- **Start Command** to: `npx prisma migrate deploy && npx prisma db seed && npm run start:prod`
- Redeploy once, then change it back to just: `npx prisma migrate deploy && npm run start:prod`

---

## Part 2: Deploy Admin Portal to Vercel

### Step 1: Create Vercel Account

1. Go to **https://vercel.com**
2. Click **"Sign Up"** → **"Continue with GitHub"**
3. Authorize Vercel

### Step 2: Import Project

1. Click **"Add New..."** → **"Project"**
2. Click **"Import"** next to **"adiityapratap/pos"**

### Step 3: Configure Admin Portal

1. **Root Directory**: Click "Edit" → Enter `apps/admin-portal` → Click "Continue"
2. **Framework Preset**: Vite (should auto-detect)
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`

### Step 4: Add Environment Variables

Click **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://YOUR-RAILWAY-URL.up.railway.app/api` |
| `VITE_TENANT_SUBDOMAIN` | `demo` |

**Replace** `YOUR-RAILWAY-URL` with your actual Railway backend URL from Part 1.

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for build (2-3 minutes)
3. Copy your URL (e.g., `https://pos-admin-xxxx.vercel.app`)

---

## Part 3: Deploy POS Terminal to Vercel

### Step 1: Add Another Project

1. Go back to Vercel dashboard
2. Click **"Add New..."** → **"Project"**
3. Click **"Import"** next to **"adiityapratap/pos"** again

### Step 2: Configure POS Terminal

1. **Root Directory**: Click "Edit" → Enter `apps/pos-terminal` → Click "Continue"
2. **Framework Preset**: Vite
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`

### Step 3: Add Environment Variables

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://YOUR-RAILWAY-URL.up.railway.app/api` |
| `VITE_TENANT_SUBDOMAIN` | `demo` |

### Step 4: Deploy

1. Click **"Deploy"**
2. Copy your URL (e.g., `https://pos-terminal-xxxx.vercel.app`)

---

## Part 4: Test Your Deployment

### Test Credentials

| Role | Employee ID | PIN | Email | Password |
|------|-------------|-----|-------|----------|
| Owner | EMP-001 | 1234 | admin@demo.com | password123 |
| Manager | EMP-002 | 9999 | manager@demo.com | password123 |
| Cashier | EMP-003 | 5678 | cashier@demo.com | password123 |

### Test Admin Portal

1. Open your Vercel Admin Portal URL
2. Login with: `admin@demo.com` / `password123`
3. You should see the dashboard

### Test POS Terminal

1. Open your Vercel POS Terminal URL
2. Enter Employee ID: `EMP-001`
3. Enter PIN: `1234`
4. Click "SIGN IN"
5. You should see the POS interface

---

## Troubleshooting

### "Build Failed" on Railway

**Check build logs for the error. Common fixes:**

1. **Prisma error**: Make sure `DATABASE_URL` is set correctly
2. **Missing dependencies**: Build command should be `npm install && npx prisma generate && npm run build`

### "Cannot connect to API" on Frontend

1. Check `VITE_API_URL` is set correctly in Vercel
2. Make sure it includes `/api` at the end
3. Verify Railway backend is running (check deploy logs)

### "401 Unauthorized" Errors

1. Database might not be seeded - run seed command
2. JWT_SECRET must be at least 32 characters

### CORS Errors

1. The backend already allows all Vercel domains
2. If using custom domain, add to `CORS_ORIGINS` in Railway variables

---

## Your Deployment URLs

After deployment, share these URLs with your client:

| Application | URL |
|-------------|-----|
| **Admin Portal** | https://your-admin.vercel.app |
| **POS Terminal** | https://your-pos.vercel.app |
| **Backend API** | https://your-backend.up.railway.app/api |

---

## Cost Summary

| Service | Free Tier |
|---------|-----------|
| Railway | $5 credit (lasts ~2-3 weeks with light usage) |
| Vercel | Unlimited for hobby projects |
| PostgreSQL (Railway) | Included in Railway credit |

**Total Cost for Demo: $0**

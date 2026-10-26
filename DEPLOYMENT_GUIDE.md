# 🚀 Flight Management System - Deployment Guide

This guide explains how to deploy the Flight Management application to production without using Docker.

---

## 🛠️ Prerequisites
- MySQL Database (Local or Cloud-hosted like Aiven, Clever Cloud, or Railway)
- Node.js 18+
- The SQL schema file: `flight_management final.sql`

---

## Option 1: Free Cloud Deployment (Render / Railway + Vercel) - Recommended

### Step 1: Deploy MySQL Database
You can use any free managed MySQL service such as:
- **Aiven MySQL** (Free tier available)
- **Clever Cloud MySQL** (Free tier available)
- **Railway MySQL**

**Database Setup:**
1. Connect to your cloud MySQL instance using MySQL Workbench or terminal CLI.
2. Run the `flight_management final.sql` script to automatically create all tables, triggers, procedures, and initial seed data.

---

### Step 2: Deploy Backend (Render / Railway)
1. Push this repository to GitHub.
2. In **Render** or **Railway**, create a new **Web Service** connected to your repository.
3. Configure the service:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Add Environment Variables:
   - `DB_HOST`: Host of your cloud MySQL instance
   - `DB_USER`: Username for MySQL
   - `DB_PASS`: Password for MySQL
   - `DB_NAME`: `flight_management`
   - `PORT`: `5000`
   - `JWT_SECRET`: `supersecretflightkey2026_xyz_production`

---

### Step 3: Deploy Frontend (Vercel)
1. In **Vercel**, import your GitHub repository.
2. Configure the project:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Create React App`
3. Add Environment Variable:
   - `REACT_APP_API_URL`: Your deployed backend URL (e.g. `https://your-backend.onrender.com`)
4. Click **Deploy**!

---

## Option 2: Single-Server Fullstack Deployment (Local / VPS / EC2)

The backend `server.js` is already configured to automatically serve the optimized React frontend build directly!

1. Build the frontend:
   ```bash
   cd d:\flight_management\frontend
   npm run build
   ```
2. Start the backend:
   ```bash
   cd d:\flight_management\backend
   node server.js
   ```
3. Open `http://localhost:5000` — both the React website and all backend APIs will run together on port 5000 with zero extra processes needed!

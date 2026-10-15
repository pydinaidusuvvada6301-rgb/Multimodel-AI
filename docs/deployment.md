# OmniMind AI — Production Deployment Guide

This guide outlines the exact steps to deploy OmniMind AI across Supabase, Render, Vercel, and GitHub.

---

## 1. Supabase (Database & Storage Setup)

1. Create a new project in the [Supabase Dashboard](https://supabase.com).
2. Navigate to **SQL Editor** -> **New Query**.
3. Open `supabase/migrations/20261015000000_init_omnimind_schema.sql` and run the script. This creates all tables, indexes, triggers, and the vector match RPC function.
4. Optional: Run `supabase/seed.sql` to populate demo accounts.
5. In the **Storage** section:
   - Create a new bucket named `omnimind-private`.
   - Toggle **Public bucket** to `OFF` (Private).
6. In **Project Settings** -> **API**:
   - Note the **Project URL** (`SUPABASE_URL`).
   - Note the **service_role secret key** (`SUPABASE_SERVICE_ROLE_KEY`).
7. In **Project Settings** -> **Database**:
   - Copy the PostgreSQL **Connection string (URI)** (`SUPABASE_DB_URL`).

---

## 2. Render (Backend API Deployment)

1. Log into [Render](https://render.com) and click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name:** `omnimind-api`
   - **Root Directory:** `apps/api`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. In the **Environment Variables** section, add:
   ```env
   NODE_ENV=production
   PORT=5000
   API_BASE_URL=/api/v1
   FRONTEND_URL=https://your-omnimind-web.vercel.app
   CORS_ORIGINS=https://your-omnimind-web.vercel.app

   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SUPABASE_DB_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

   JWT_ACCESS_SECRET=your_super_secret_64_character_random_key_min
   JWT_ACCESS_TTL=15m
   REFRESH_TOKEN_TTL_DAYS=30

   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-2.5-flash
   GEMINI_EMBEDDING_MODEL=text-embedding-004

   STORAGE_BUCKET=omnimind-private
   MAX_FILE_SIZE_MB=25
   ```
5. Set Health Check path to `/health`.
6. Click **Create Web Service**. Once deployed, copy your Render backend URL (e.g. `https://omnimind-api.onrender.com`).

---

## 3. Vercel (Frontend Deployment)

1. Log into [Vercel](https://vercel.com) and click **Add New...** -> **Project**.
2. Select your GitHub repository.
3. In **Configure Project**:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Edit and select `apps/web`.
4. In **Environment Variables**:
   ```env
   VITE_API_BASE_URL=https://omnimind-api.onrender.com/api/v1
   ```
5. Click **Deploy**.
6. Direct URL routing is handled by `apps/web/vercel.json` rewrites.

---

## 4. Local Development Quickstart

To run the complete monorepo locally:

```bash
# 1. Install all dependencies across monorepo
npm install

# 2. Run backend API (Port 5000)
npm run dev:api

# 3. In another terminal, run frontend web app (Port 5173)
npm run dev:web
```

Access the frontend at `http://localhost:5173`.
Access the backend API at `http://localhost:5000`.

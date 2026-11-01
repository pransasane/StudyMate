# Deploying StudyMate on Vercel (Full Functionality Guide)

This guide walks you through deploying **StudyMate** to **Vercel** with full backend and frontend functionality:
- ⚡ **Frontend**: React 19 + Tailwind CSS + Lucide Icons + Motion
- 🤖 **AI Features**: Gemini 3.8 Flash summary generation, interactive quizzes, flashcards, and document analysis
- 📄 **Document Processing**: PDF, DOCX, and TXT parsing via serverless backend
- 🔐 **Authentication & Realtime Sync**: Firebase Firestore + JWT token session management

---

## 🚀 Step 1: Push Code to GitHub

Your GitHub repository (`https://github.com/pransasane/StudyMate`) is configured with `vercel.json` and the `/api` serverless handler.

---

## 🌐 Step 2: Import Project in Vercel

1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New...** ➔ **Project**.
3. Under **Import Git Repository**, find and select `StudyMate` (or `pransasane/StudyMate`).
4. Vercel will automatically detect the build settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

---

## 🔑 Step 3: Add Environment Variables in Vercel (CRITICAL)

Before clicking Deploy, expand the **Environment Variables** section:

| Variable Name | Value | Required? | Purpose |
| :--- | :--- | :--- | :--- |
| **`GEMINI_API_KEY`** | `AIzaSy...` *(Your Gemini API key)* | **Yes** | Powers all AI summaries, quizzes, and analysis |
| **`JWT_SECRET`** | `any_strong_random_secret_here` | Recommended | Secures user login tokens and sessions |

> 💡 **Tip**: If you already added `GEMINI_API_KEY` in GitHub Secrets, copy that exact same key into the Vercel **Environment Variables** box.

---

## 🚀 Step 4: Click Deploy

1. Click **Deploy**.
2. Vercel will build the frontend assets and deploy the `/api` serverless function.
3. Once finished, Vercel gives you a live domain (e.g. `https://studymate-pransasane.vercel.app`).

---

## 🔍 How It Works on Vercel Under the Hood

- **`vercel.json`**: Rewrites all `/api/*` network requests to `/api/index.ts`.
- **`/api/index.ts`**: Serverless function that executes the Express backend routes (Gemini AI, document extraction, auth).
- **`server/db.ts`**: Configured to run in serverless mode (using `/tmp` with safe in-memory fallback), preventing read-only filesystem errors.
- **Firebase Firestore**: User records, saved documents, quizzes, and summaries automatically sync in real-time to your Firestore instance (`ai-studio-studymate-8fbf6039-7fb7-464b-b648-f55ad68ef8b1`).

# StudyMate - GitHub Setup & Gemini AI API Configuration

This guide explains how to link this repository to GitHub and securely configure your **Google Gemini AI API Key** (`GEMINI_API_KEY`).

---

## 🔒 Security Best Practice: Why API Keys Are Not Committed

Committing raw API keys to GitHub in code or `.env` files triggers automated security scanners (GitHub Secret Scanning and Google Cloud Secret Manager), which **immediately deactivates and revokes** the API key to prevent billing abuse.

Instead, GitHub provides **Repository Secrets**, and local development uses git-ignored `.env` files.

---

## 🚀 Step 1: Push This Codebase to Your GitHub Repository

If you haven't linked your remote GitHub repository yet, run:

```bash
# Add your GitHub repository as origin
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git

# Push the main branch to GitHub
git push -u origin main
```

*(If the remote already exists or you want to update it, run `git remote set-url origin <URL>`)*

---

## 🔑 Step 2: Add Your Gemini AI API Key in GitHub

To allow GitHub Actions or deployments to use your AI key safely:

1. Open your repository on GitHub: `https://github.com/<YOUR_USERNAME>/<YOUR_REPO>`
2. Click **Settings** (gear icon at the top right of your repo)
3. In the left sidebar, expand **Secrets and variables** and click **Actions**
4. Click the green **New repository secret** button
5. Enter the following:
   - **Name**: `GEMINI_API_KEY`
   - **Secret**: Paste your Gemini API key (starts with `AIzaSy...`)
6. Click **Add secret**

Now your API key is encrypted and securely accessible to your GitHub workflows without exposing it publicly in code.

---

## 💻 Step 3: Local Development Setup

For running locally on your computer:

1. Clone your repository:
   ```bash
   git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
   cd <YOUR_REPO>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your local `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Open `.env` and set your key:
   ```env
   GEMINI_API_KEY=AIzaSyYourActualKeyHere
   ```
   *(The `.gitignore` file automatically ensures `.env` is never pushed to GitHub).*

5. Test the AI API standalone runner:
   ```bash
   npx tsx ai-api.ts
   ```

6. Start the full application:
   ```bash
   npm run dev
   ```

---

## 📦 What Files Are Included for AI?

- **`ai-api.ts`**: Standalone TypeScript interface powered by `@google/genai` and `gemini-3.8-flash`.
- **`server/ai.ts`**: Express backend proxy routes for summaries, quizzes, and chat tutoring.
- **`src/services/aiApi.ts`**: Frontend React service layer.
- **`.github/workflows/verify-ai.yml`**: Continuous Integration testing verifying build and AI secrets.

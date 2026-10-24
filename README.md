# StudyMate - AI-Powered Learning Companion

> Learn Smarter. Prepare Better. Achieve More. StudyMate converts lecture slides, textbook chapters, and study materials into structured multi-tier summaries and interactive mastery quizzes.

---

## 🔑 Why API Keys Are Not Committed to GitHub

In modern software development, **secret API keys (like Gemini or OpenRouter keys) are NEVER hardcoded into source code or committed to GitHub repositories**. 

Reasons:
1. **Security & Anti-Theft**: Committing API keys to a Git repository exposes them publicly, allowing anyone to steal your key and consume your quota or incur billing.
2. **Automated Secret Scanning**: GitHub and Google Cloud automatically scan all commits. If a private API key is committed, it is instantly flagged and automatically revoked/disabled for safety.
3. **Best Practice**: Secret keys are stored in an uncommitted `.env` file (which is excluded by `.gitignore`), while `.env.example` serves as the public blueprint.

---

## 🚀 How to Set Up Your API Key (Running Locally from GitHub)

### Step 1: Clone the Repository
```bash
git clone <your-repository-url>
cd <repository-directory>
```

### Step 2: Create Your `.env` File
Copy the example environment template into `.env`:
```bash
cp .env.example .env
```

### Step 3: Add Your Free Google Gemini API Key
1. Get a free API key at [Google AI Studio](https://aistudio.google.com/apikey).
2. Open your `.env` file and set:
```bash
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere..."
```

*(Optional: If you want to use OpenRouter, you can also set `OPENROUTER_API_KEY="sk-or-v1-..."` in `.env`)*

### Step 4: Install Dependencies & Run
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## ⚙️ Alternative: Enter Your API Key Directly in the App UI

Don't want to edit `.env`? You don't have to!
1. Start the app and sign in.
2. Click the **Settings (gear icon)** in the top navigation bar.
3. Paste your Gemini API key (or OpenRouter key) into the **Gemini API Key** field.
4. Click **Save Settings & API Keys**. The key will be used for your AI summaries and quizzes!

---

## 🗄️ Google Firebase Database

StudyMate connects to Google Firebase Firestore to store and persist user data:
- Configuration is in `firebase-applet-config.json`
- Security rules are defined in `firestore.rules` (zero-trust, user-scoped ABAC)
- Collections:
  - `/users/{userId}`: User profile and preferences
  - `/users/{userId}/documents`: Uploaded notes and extracted text
  - `/users/{userId}/summaries`: AI-generated summaries
  - `/users/{userId}/quizzes`: Interactive quizzes
  - `/users/{userId}/quizAttempts`: Scored test results and review feedback

---

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Backend**: Node.js, Express, Multer, Mammoth (DOCX), PDF-Parse (PDF)
- **AI Engine**: `@google/genai` (Google Gemini 2.0 / 3.0 Flash) & OpenRouter API
- **Database & Auth**: Google Firebase Firestore & Firebase Authentication

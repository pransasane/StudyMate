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

## ⚙️ Alternative 1: Enter Your API Key Directly in the App UI

Don't want to edit `.env`? You don't have to!
1. Start the app and sign in.
2. Click the **Settings (gear icon)** in the top navigation bar.
3. Paste your Gemini API key (or OpenRouter key) into the **Gemini API Key** field.
4. Click **Save Settings & API Keys**. The key will be used for your AI summaries and quizzes!

---

## 💻 Alternative 2: Code File Configuration (`server/config.ts`)

The AI engine configuration and key resolution logic is located in:
👉 **`server/config.ts`**

In `server/config.ts`:
- `AI_CONFIG.GEMINI_API_KEY`: Resolves the Gemini AI key from environment variables or a fallback value.
- `getActiveGeminiApiKey()`: Prioritizes user session overrides, then server environment, ensuring seamless AI generation in any hosting setup.
- If running in a private repository or testing locally without `.env`, you can customize the default values in `server/config.ts`.

---

## 🤖 Dedicated AI API Code File (`ai-api.ts`)

For developers working directly with the GitHub repository, a dedicated, standalone AI API module is provided right in the root directory:
👉 **`ai-api.ts`**

### Features:
- **Direct Google GenAI SDK**: Implements `@google/genai` with the official, high-performance `gemini-3.8-flash` model.
- **Standalone Execution**: You can test the AI API directly via command line:
  ```bash
  npx tsx ai-api.ts
  ```
- **Exported Functions**:
  - `generateSummaryWithGemini({ text, title, summaryType })`: Produces 4-tier structured academic summaries with high-yield takeaways.
  - `generateQuizWithGemini({ text, title, questionCount, difficulty, questionType })`: Generates multiple choice and true/false questions with thorough explanations.
  - `generateFlashcardsWithGemini(text, count)`: Generates active-recall flashcard pairs.
  - `askDocumentQuestion(documentText, question, history)`: Interactive AI tutoring grounded in student notes.
  - `testGeminiApi(customApiKey?)`: Pings and tests the Google Gemini connection.

Frontend components can also import the typed client service from `src/services/aiApi.ts`.

---

## 🗄️ Firebase Authentication & Firestore

Firebase is the durable source of truth for StudyMate accounts and student records. The Vercel API does not store profiles or study material in local files or server memory.

- **Firebase Authentication** manages email/password and Google sign-in, password reset, and user sessions.
- **Cloud Firestore** stores each user's profile and preferences, extracted study documents and storage paths, AI summaries, quizzes, and quiz attempts.
- **Firebase Storage** stores each original uploaded PDF, DOCX, TXT, or Markdown file at a private path under `users/{uid}/documents/{documentId}/`.
- Each signed-in user's data is stored below `users/{uid}`; Firestore rules restrict access to that same Firebase UID.
- The API verifies the Firebase ID token on every protected request. Uploaded text is extracted by the API and then saved by the signed-in client directly to Firestore.
- AI requests receive the selected document text and the user's chosen provider credentials only for that request. The server does not persist those credentials.

Configuration:
- Firebase Web configuration is in `firebase-applet-config.json`.
- The server verification key is `FIREBASE_API_KEY`; it must be set as a Vercel environment variable (Production, Preview, and Development).
- Firestore rules are in `firestore.rules`; Storage rules are in `storage.rules`.
- `firebase.json` and `.firebaserc` target the named Firestore database configured in `firebase-applet-config.json`.

### One-time Firebase setup

1. In Firebase Console, enable **Authentication → Email/Password** and **Google** providers.
2. Add the deployed StudyMate domain to **Authentication → Settings → Authorized domains**.
3. Ensure the named Firestore database in `firebase-applet-config.json` exists.
4. From the repository root, authenticate with the Firebase CLI and deploy the Firestore rules:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore,storage --project studymate-135bf
```

The CLI deployment applies the checked-in rules to the database listed in `firebase.json`. Review the Firebase Console's current rules before deploying because a CLI rules deployment replaces the rules currently published there.

StudyMate's per-user collections are:
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

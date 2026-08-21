# Deploying NutriGuide to Vercel

NutriGuide is configured for deployment on [Vercel](https://vercel.com).

---

## 🚀 Quick Deployment Steps

### 1. Push or Import to GitHub
Export or push this repository to your GitHub account (or GitLab / Bitbucket).

### 2. Import Project in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New"** > **"Project"**.
2. Select your NutriGuide repository.
3. Vercel will auto-detect the configuration from `vercel.json`:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

---

## 🔑 Environment Variables to Configure in Vercel

In the Vercel project settings, navigate to **Settings** > **Environment Variables** and add the following:

| Variable Name | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Yes** | Google Gemini API Key for NutriGuide AI Assistant | `AIzaSy...` |
| `VITE_FIREBASE_API_KEY` | *Optional* | Firebase API Key (if using Cloud Auth/Firestore) | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | *Optional* | Firebase Auth Domain | `your-app.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | *Optional* | Firebase Project ID | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | *Optional* | Firebase Storage Bucket | `your-app.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | *Optional* | Firebase Messaging Sender ID | `1234567890` |
| `VITE_FIREBASE_APP_ID` | *Optional* | Firebase App ID | `1:1234567890:web:...` |

---

## 🏗️ How Architecture Works on Vercel

- **Frontend (SPA)**: Built with Vite into static assets served from the high-speed global Edge CDN.
- **Backend (API)**: Serverless function at `/api` configured via `api/index.ts` and `vercel.json` routing:
  - `POST /api/ai/nutrition-assistant` (Gemini API server-side proxy)
  - `GET /api/health`
  - `GET /api/food-database/sample`
- **Security**: The server-side Gemini API key remains hidden from the browser client at all times.

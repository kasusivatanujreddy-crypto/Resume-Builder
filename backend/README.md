# CraftCV Studio — Backend

Zero-dependency Node.js server with built-in Google Gemini AI proxy, static file server, and CORS support.

## 📁 Directory Structure

```
backend/
├── .env                     # Private environment variables (GEMINI_API_KEY, PORT)
├── .env.example             # Template for environment variables
├── package.json             # Backend package configuration
├── server.js                # HTTP server with Gemini AI proxy & static file serving
└── README.md                # Backend documentation
```

## 🔑 Environment Setup

1. Copy `.env.example` to `.env` (or edit existing `.env`):
   ```bash
   cp .env.example .env
   ```
2. Paste your Google Gemini API key:
   ```env
   PORT=3000
   GEMINI_API_KEY=AIzaSy...
   ```

## 🚀 Running the Server

From the `backend/` folder:
```bash
node server.js
```

Or using npm:
```bash
npm start
```

Or from the project root:
```bash
npm run dev
```

## 🔌 API Endpoints

- `GET /api/status` — Returns server health and Gemini configuration status.
- `POST /api/ai/summary` — Generates an executive resume summary given a role and skills.
- `POST /api/ai/enhance` — Rewrites bullet points to add quantifiable impact and metrics.
- `GET /*` — Serves static frontend files from `../frontend`.

# CraftCV Studio — Next-Gen Interactive Resume Builder

**CraftCV Studio** is a state-of-the-art, client-side interactive resume builder designed to create high-impact, ATS-optimized, designer-grade professional resumes.

---

## ✨ Key Features

1. **Live Split-Pane Studio**:
   - **Modular Editor (Left)**: Organized into intuitive tabs (Contact, Experience, Education, Skills, Projects, Certifications, Languages, Design).
   - **Live Pixel-Perfect Canvas (Right)**: Exact A4 canvas with dynamic scaling (zoom in/out, fit-to-screen, 100%), instant keystroke auto-sync, and print-ready margins.
   - **View Modes**: One-click toggles between **Split View**, **Editor Focused**, and **Preview Focused**.

2. **4 Handcrafted Designer Templates**:
   - **Modern Executive**: Two-tone header banner with contact chips, dual-column structure with profile photo framing.
   - **Silicon Valley Tech**: Single-column high-density layout, ATS-optimized section hierarchy, inline tech stack tags, and repository links.
   - **Creative Studio**: Dark accent sidebar, visual timeline nodes, and modern geometric typography.
   - **Harvard Corporate**: Classic formal layout, clean divider lines, traditional serif/sans-serif hybrid formatting for finance, consulting, and law.

3. **Real-Time ATS Analyzer & Optimization Engine**:
   - Live **ATS Score (0–100)** calculated automatically as you edit.
   - Evaluates contact details completeness, measurable metrics, strong action verbs, keyword density, and summary impact.
   - Slide-over drawer with **Passed Checks** and **Actionable Tips**.

4. **AI-Assisted Writing & Action Verbs**:
   - **100+ Curated Action Verbs**: Grouped into Leadership, Development, Optimization, Collaboration, and Innovation.
   - **1-Click Smart Summary Enhancer**: Automatically crafts a punchy executive elevator pitch based on your target title and top skills.
   - **Pre-loaded Profiles**: Instant 1-click loading of Senior Full-Stack Architect, Principal Product Manager, or Lead UI/UX Designer.

5. **Aesthetic Customization**:
   - 8 curated color palettes (Electric Indigo, Royal Sapphire, Emerald Slate, Amethyst Luxe, Ruby Crimson, Warm Amber, Modern Obsidian, Nordic Cyan).
   - Premium Google Fonts (Inter, Plus Jakarta Sans, Outfit, Space Grotesk, Merriweather, Roboto Slab).
   - Content Density options: **Compact** (fit more achievements), **Normal**, or **Relaxed**.

6. **Export & Zero-Dependency Data Privacy**:
   - **Direct PDF Export**: Native `@media print` CSS formatted for standard A4 pages with zero watermarks or browser headers/footers.
   - **JSON Backup & Restore**: Save your entire resume state to a `.json` file and restore it on any computer.
   - **Auto-Save**: Automatically preserves your draft in browser `localStorage`.
   - **100% Local & Private**: No account required, no server-side telemetry.

---

## 📁 Project Architecture

The codebase is organized into clean, decoupled `frontend` and `backend` modules:

```
resume-builder/
├── frontend/                # Client-Side Application
│   ├── assets/              # Avatar images & static media
│   ├── css/                 # Studio CSS & Print-ready Templates CSS
│   ├── js/                  # App logic, configuration, sample data & templates
│   ├── supabase/            # Supabase credentials & setup guide
│   └── index.html           # Main Studio UI entry point
│
├── backend/                 # Node.js Server & AI Proxy
│   ├── .env                 # Private environment variables (API keys)
│   ├── .env.example         # Template for environment variables
│   ├── package.json         # Backend scripts
│   └── server.js            # Node HTTP server with Gemini AI proxy & CORS
│
├── package.json             # Root workspace scripts
└── README.md                # Project documentation
```

---

## 🔑 API Keys & Configuration Setup

### 1. Backend (Google Gemini AI)
1. Open [backend/.env](file:///c:/Users/kasus/.antigravity-ide/resume-builder/backend/.env) (or [.env](file:///c:/Users/kasus/.antigravity-ide/resume-builder/.env) in root).
2. Paste your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey):
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```
3. The server ([backend/server.js](file:///c:/Users/kasus/.antigravity-ide/resume-builder/backend/server.js)) securely proxies AI requests so your key is never exposed to users.

### 2. Frontend (Supabase Cloud Database & Auth)
1. Open [frontend/supabase/supabase-keys.js](file:///c:/Users/kasus/.antigravity-ide/resume-builder/frontend/supabase/supabase-keys.js).
2. Paste your project URL and `anon` public key from [Supabase Dashboard](https://supabase.com/dashboard) (Project Settings -> API):
   ```javascript
   const SUPABASE_KEYS = {
     url: 'https://xyz.supabase.co',
     anonKey: 'eyJhbGciOi...'
   };
   ```

---

## 🚀 How to Run

### Option 1: Run Full App via Node Server (Recommended)
From the project root:
```bash
npm run dev
# or: node backend/server.js
```
Then open your browser at:
👉 **[http://localhost:3000](http://localhost:3000)**

### Option 2: Direct File Open
You can also directly open [frontend/index.html](file:///c:/Users/kasus/.antigravity-ide/resume-builder/frontend/index.html) in any browser (Google Chrome, Edge, Firefox, Brave, or Safari). AI calls will automatically connect to `http://localhost:3000`.

---

## 🖨️ How to Export as PDF
1. Click the **"Download PDF"** button in the top navigation bar (or press `Ctrl + P` / `Cmd + P`).
2. In the print dialog:
   - **Destination**: Choose *"Save as PDF"*.
   - **Paper Size**: Choose *"A4"*.
   - **Margins**: Choose *"None"*.
   - **Options**: Ensure *"Background graphics"* is checked.
3. Click **Save** to generate your resume PDF.

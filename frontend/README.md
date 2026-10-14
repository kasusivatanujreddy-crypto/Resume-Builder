# CraftCV Studio — Frontend

Interactive, client-side resume builder with live A4 split-pane canvas, ATS analysis, and print-ready PDF export.

## 📁 Directory Structure

```
frontend/
├── assets/                  # Static images (avatar, icons)
│   └── avatar.jpg
├── css/                     # Application & Template Stylesheets
│   ├── style.css            # Studio layout, dark mode, split pane, UI controls
│   └── templates.css        # 4 designer templates & @media print A4 formatting
├── js/                      # Core JavaScript Application Modules
│   ├── app.js               # Studio lifecycle, form binding, ATS sync, zoom
│   ├── config.js            # Frontend configuration, API base URL & endpoints
│   ├── data.js              # Sample profiles (SWE, PM, Designer) & ATS engine
│   └── templates.js         # HTML renderers for Modern, Tech, Creative, Classic
├── supabase/                # Supabase Client Configuration
│   ├── README.md            # Setup guide for Supabase dashboard & keys
│   └── supabase-keys.js     # User's public anon key and project URL
└── index.html               # Main application entry point
```

## 🚀 How to Run Frontend

### Option 1: Via Backend Server (Recommended)
When you start the Node.js backend server (`node backend/server.js`), it serves this `frontend/` directory automatically at:
[http://localhost:3000](http://localhost:3000)

### Option 2: Direct File Open
You can directly double-click `index.html` to open it in Google Chrome, Edge, Firefox, or Safari (`file:///` protocol). The frontend will automatically route AI enhancement calls to `http://localhost:3000`.

### Option 3: Any Static Server
Run with any static web server:
```bash
npx serve frontend
# or
python -m http.server --directory frontend 8080
```

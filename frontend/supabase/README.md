# ⚡ Supabase Setup & Database Migration Guide

This directory holds your **Supabase** credentials, client configuration, and database migration files.

---

## 🗄️ Database Migration (Create All Tables in 1 Step)

The migration file is available at:
👉 [schema.sql](file:///c:/Users/kasus/.antigravity-ide/resume-builder/supabase/schema.sql)
👉 [supabase/migrations/20261014000000_create_resume_builder_schema.sql](file:///c:/Users/kasus/.antigravity-ide/resume-builder/supabase/migrations/20261014000000_create_resume_builder_schema.sql)

### Option 1: Via Supabase Web Dashboard (Easiest & Fastest)
1. Open your project on [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **SQL Editor** (icon `>_` on the left sidebar).
3. Click **"New query"**.
4. Open [schema.sql](file:///c:/Users/kasus/.antigravity-ide/resume-builder/supabase/schema.sql), copy everything, and paste it into the editor.
5. Click **"Run"** (or press `Ctrl + Enter`).
   - ✅ All tables (`user_profiles`, `resumes`, `resume_analytics`), indexes, RLS policies, triggers, and the `resume-avatars` storage bucket are created instantly.

### Option 2: Via Supabase CLI (Single Terminal Command)
From the project root:
```bash
npx supabase db push
```

### Option 3: Via PostgreSQL Connection (psql)
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f supabase/schema.sql
```

---

## 📍 Where to Paste Your API Keys

Open the file:
👉 [supabase-keys.js](file:///c:/Users/kasus/.antigravity-ide/resume-builder/frontend/supabase/supabase-keys.js)

And paste your credentials:
```javascript
const SUPABASE_KEYS = {
  url: 'https://your-project-id.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

---

## ❓ Where to Find Your Keys in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Click the **Project Settings** (gear icon ⚙️) on the left sidebar.
4. Click **API** under Configuration.
5. You will see:
   - **Project URL**: Copy and paste into `url`.
   - **Project API Keys** -> `anon` / `public`: Copy and paste into `anonKey`.

---

## 🔒 Security Note: Anon Key vs Service Role Key

- **`anon` (public) Key**: Safe for client-side JavaScript. Supabase secures database access through **Row-Level Security (RLS)** in PostgreSQL.
- **`service_role` (secret) Key**: **NEVER** put this in public scripts or browser code. It has full admin rights and bypasses all RLS rules.

-- ==============================================================================
-- 🚀 CraftCV Studio — Comprehensive Supabase Database Migration
-- Single-command execution file that creates all tables, triggers, indexes,
-- storage buckets, and Row-Level Security (RLS) policies.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. USER PROFILES TABLE (Extends Supabase auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  target_job_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. RESUMES TABLE (Primary store for all user resumes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- user_id is nullable to support anonymous/guest drafts before signup
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Resume title & shareable metadata
  title TEXT NOT NULL DEFAULT 'My Professional Resume',
  slug TEXT,
  share_id TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  
  -- Structured Resume Data (JSONB for high-performance schema flexibility)
  personal_info JSONB NOT NULL DEFAULT '{
    "fullName": "",
    "title": "",
    "email": "",
    "phone": "",
    "location": "",
    "website": "",
    "linkedin": "",
    "github": "",
    "avatar": "",
    "showAvatar": true,
    "summary": ""
  }'::jsonb,
  
  experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  education JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Designer settings (Template selection, colors, fonts, density)
  settings JSONB NOT NULL DEFAULT '{
    "template": "modern",
    "primaryColor": "#2563eb",
    "fontFamily": "Inter",
    "fontSize": "normal"
  }'::jsonb,
  
  -- ATS Scoring & Visibility
  ats_score INTEGER DEFAULT 0 CHECK (ats_score >= 0 AND ats_score <= 100),
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_starred BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. RESUME ANALYTICS TABLE (Tracks view counts on public shared resumes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.resume_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  viewer_ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_share_id ON public.resumes(share_id);
CREATE INDEX IF NOT EXISTS idx_resumes_is_public ON public.resumes(is_public);
CREATE INDEX IF NOT EXISTS idx_resumes_updated_at ON public.resumes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_resumes_personal_email ON public.resumes ((personal_info->>'email'));
CREATE INDEX IF NOT EXISTS idx_resumes_skills_gin ON public.resumes USING gin (skills);
CREATE INDEX IF NOT EXISTS idx_analytics_resume_id ON public.resume_analytics(resume_id);

-- ==============================================================================
-- 6. AUTOMATIC TIMESTAMP TRIGGERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_resumes_updated_at ON public.resumes;
CREATE TRIGGER trigger_resumes_updated_at
BEFORE UPDATE ON public.resumes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 7. NEW USER SIGNUP HOOK (Automatically populates public.user_profiles)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 8. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analytics ENABLE ROW LEVEL SECURITY;

-- 8.1 USER PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id);

-- 8.2 RESUMES POLICIES
-- Owner can read their own resumes
DROP POLICY IF EXISTS "Users can view their own resumes" ON public.resumes;
CREATE POLICY "Users can view their own resumes"
ON public.resumes FOR SELECT
USING (auth.uid() = user_id);

-- Anyone can read public resumes or resumes viewed via share_id
DROP POLICY IF EXISTS "Public can view shared resumes" ON public.resumes;
CREATE POLICY "Public can view shared resumes"
ON public.resumes FOR SELECT
USING (is_public = true OR user_id IS NULL);

-- Authenticated users or anonymous users can insert resumes
DROP POLICY IF EXISTS "Users can insert resumes" ON public.resumes;
CREATE POLICY "Users can insert resumes"
ON public.resumes FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Owner can update their resumes (or anonymous draft with null user_id)
DROP POLICY IF EXISTS "Users can update their own resumes" ON public.resumes;
CREATE POLICY "Users can update their own resumes"
ON public.resumes FOR UPDATE
USING (
  auth.uid() = user_id OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Owner can delete their resumes
DROP POLICY IF EXISTS "Users can delete their own resumes" ON public.resumes;
CREATE POLICY "Users can delete their own resumes"
ON public.resumes FOR DELETE
USING (auth.uid() = user_id);

-- 8.3 ANALYTICS POLICIES
DROP POLICY IF EXISTS "Anyone can record a resume view" ON public.resume_analytics;
CREATE POLICY "Anyone can record a resume view"
ON public.resume_analytics FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Resume owners can view analytics" ON public.resume_analytics;
CREATE POLICY "Resume owners can view analytics"
ON public.resume_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.resumes
    WHERE public.resumes.id = public.resume_analytics.resume_id
    AND public.resumes.user_id = auth.uid()
  )
);

-- ==============================================================================
-- 9. STORAGE BUCKET CONFIGURATION (For Profile Photos & Avatars)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('resume-avatars', 'resume-avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS: Anyone can view avatars from the public bucket
DROP POLICY IF EXISTS "Public Access to Resume Avatars" ON storage.objects;
CREATE POLICY "Public Access to Resume Avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'resume-avatars');

-- Storage RLS: Authenticated or anonymous users can upload avatars
DROP POLICY IF EXISTS "Users can upload resume avatars" ON storage.objects;
CREATE POLICY "Users can upload resume avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resume-avatars');

DROP POLICY IF EXISTS "Users can update their resume avatars" ON storage.objects;
CREATE POLICY "Users can update their resume avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'resume-avatars');

DROP POLICY IF EXISTS "Users can delete their resume avatars" ON storage.objects;
CREATE POLICY "Users can delete their resume avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'resume-avatars');

-- ==============================================================================
-- 🎉 MIGRATION COMPLETE!
-- All tables (user_profiles, resumes, resume_analytics), RLS rules, triggers,
-- and the 'resume-avatars' storage bucket are ready to use.
-- ==============================================================================

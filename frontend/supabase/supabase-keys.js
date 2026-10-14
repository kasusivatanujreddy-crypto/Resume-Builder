/**
 * ==============================================================================
 * 🔑 SUPABASE CREDENTIALS & API KEYS
 * ==============================================================================
 * 
 * Paste your Supabase credentials below.
 * 
 * 📍 WHERE TO GET YOUR KEYS:
 * 1. Open your Supabase project dashboard: https://supabase.com/dashboard
 * 2. Click "Project Settings" (the gear icon on the left sidebar) -> "API"
 * 3. Copy "Project URL" and paste below in 'url'
 * 4. Under "Project API keys", copy the 'anon' (public) key and paste in 'anonKey'
 * ==============================================================================
 */

const SUPABASE_KEYS = {
  // 1. Supabase Project URL (e.g. 'https://abcdefghijklm.supabase.co')
  url: 'https://vwffjybatsevtthenpsg.supabase.co',

  // 2. Supabase Anon (Public) Key (starts with 'eyJhbGciOi...')
  // Safe for browser use because Supabase uses Row-Level Security (RLS)
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZmZqeWJhdHNldnR0aGVucHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3Nzg5ODksImV4cCI6MjEwNzM1NDk4OX0.ysDW2u1Swt5ethci4jCHpBbEbqqnTXzbVCnheEP3DpA',

  // 3. (OPTIONAL) Service Role Key - BACKEND ONLY
  // WARNING: Bypasses all security rules. DO NOT expose to browser users.
  serviceRoleKey: ''
};

// Make available globally in the browser
if (typeof window !== 'undefined') {
  window.SUPABASE_KEYS = SUPABASE_KEYS;

  if (!window.APP_CONFIG) {
    window.APP_CONFIG = {};
  }

  window.APP_CONFIG.supabase = {
    url: SUPABASE_KEYS.url,
    anonKey: SUPABASE_KEYS.anonKey,
    isConfigured: function () {
      return (
        this.url &&
        !this.url.includes('PASTE_YOUR') &&
        this.anonKey &&
        !this.anonKey.includes('PASTE_YOUR') &&
        this.url.startsWith('https://')
      );
    }
  };
}

// Export for Node.js backend if required
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUPABASE_KEYS;
}

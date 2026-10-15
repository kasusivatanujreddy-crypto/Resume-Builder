/**
 * ==============================================================================
 * CraftCV Studio - Frontend Configuration
 * ==============================================================================
 * 
 * 💡 FRONTEND vs BACKEND RULE:
 * - This file runs in the user's browser.
 * - NEVER put private secrets (like GEMINI_API_KEY or SUPABASE_SERVICE_ROLE_KEY) here!
 * - It IS safe to put your Supabase Project URL and Anon (Public) Key here, 
 *   because Supabase enforces data protection via Row-Level Security (RLS) policies.
 * 
 * ------------------------------------------------------------------------------
 * How to get your Supabase keys:
 * 1. Open your project on https://supabase.com/dashboard
 * 2. Go to Project Settings -> API
 * 3. Copy "Project URL" and paste below in 'url'
 * 4. Copy "Project API keys" -> 'anon' / 'public' and paste below in 'anonKey'
 * ==============================================================================
 */

window.APP_CONFIG = {
  supabase: {
    // Reads directly from supabase/supabase-keys.js if configured
    url: (window.SUPABASE_KEYS && window.SUPABASE_KEYS.url && !window.SUPABASE_KEYS.url.includes('PASTE_YOUR')) 
      ? window.SUPABASE_KEYS.url 
      : 'YOUR_SUPABASE_URL_HERE',

    anonKey: (window.SUPABASE_KEYS && window.SUPABASE_KEYS.anonKey && !window.SUPABASE_KEYS.anonKey.includes('PASTE_YOUR')) 
      ? window.SUPABASE_KEYS.anonKey 
      : 'YOUR_SUPABASE_ANON_KEY_HERE',

    // Flag indicating whether Supabase has been configured
    isConfigured: function() {
      const u = (window.SUPABASE_KEYS && window.SUPABASE_KEYS.url) || this.url;
      const k = (window.SUPABASE_KEYS && window.SUPABASE_KEYS.anonKey) || this.anonKey;
      return Boolean(u && !u.includes('YOUR_') && !u.includes('PASTE_YOUR') && k && !k.includes('YOUR_') && !k.includes('PASTE_YOUR') && u.startsWith('https://'));
    }
  },

  // 🔗 RENDER BACKEND CONNECTION:
  // Live Render Web Service URL
  renderBackendUrl: 'https://craftcv-backend-66er.onrender.com',

  // Backend API Base URL resolution
  apiBase: (function () {
    if (typeof window !== 'undefined' && window.APP_CONFIG_RENDER_URL) {
      return window.APP_CONFIG_RENDER_URL.replace(/\/+$/, '');
    }
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocal && window.location.port && window.location.port !== '3000') {
        return 'http://localhost:3000';
      }
    }
    return '';
  })(),

  // Helper: Get active backend URL
  getApiBase: function () {
    const renderUrl = this.renderBackendUrl && this.renderBackendUrl.trim();
    if (renderUrl && renderUrl.startsWith('https://')) {
      return renderUrl.replace(/\/+$/, '');
    }
    return this.apiBase || '';
  },

  // API endpoints hosted by your Node server (server.js)
  api: {
    aiSummary: '/api/ai/summary',
    aiEnhance: '/api/ai/enhance',
    status: '/api/status'
  }
};

// CraftCV Local Web Server with Gemini AI Proxy (Zero dependencies)
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 1. Load .env file automatically (Zero dependency)
function loadEnv() {
  const possiblePaths = [
    path.join(__dirname, '.env'),
    path.join(__dirname, '..', '.env')
  ];
  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        const idx = line.indexOf('=');
        if (idx !== -1) {
          const key = line.slice(0, idx).trim();
          const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
      break;
    }
  }
}
loadEnv();

// Supabase Client Initialization
let supabase = null;
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('your-project-id')) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    });
    console.log(`⚡ Supabase client initialized (${SUPABASE_URL})`);
  } catch (err) {
    console.warn('⚠️ Supabase client failed to initialize:', err.message);
  }
}

const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const BASE_DIR = fs.existsSync(FRONTEND_DIR) ? FRONTEND_DIR : __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Helper: Call Google Gemini REST API using native https with multi-model fallback
async function callGeminiAPI(apiKey, prompt) {
  const models = process.env.GEMINI_MODEL 
    ? [process.env.GEMINI_MODEL] 
    : ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3.7-flash', 'gemini-3.5-flash'];

  const postData = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000
    }
  });

  let lastError = null;

  for (const model of models) {
    try {
      const text = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'generativelanguage.googleapis.com',
          port: 443,
          path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const req = https.request(options, (res) => {
          let body = '';
          res.on('data', chunk => { body += chunk; });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              if (res.statusCode >= 200 && res.statusCode < 300) {
                const resultText = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (resultText) {
                  resolve(resultText.trim());
                } else {
                  reject(new Error('Unexpected response format from Gemini API'));
                }
              } else {
                const errMsg = parsed?.error?.message || `Gemini API returned status ${res.statusCode}`;
                reject(new Error(errMsg));
              }
            } catch (e) {
              reject(new Error(`Failed to parse Gemini response: ${e.message}`));
            }
          });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
      });

      return text;
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error('All Gemini model endpoints failed');
}

// Helper: Parse incoming JSON request body
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // CORS support for cross-origin frontend requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  let reqPath = decodeURI(req.url.split('?')[0]);

  // ---------------------------------------------------------------------------
  // BACKEND API ROUTES
  // ---------------------------------------------------------------------------

  // Helper: send JSON response
  const sendJSON = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  // Status check endpoint
  if (reqPath === '/api/status' && req.method === 'GET') {
    const apiKey = process.env.GEMINI_API_KEY || '';
    const isGeminiConfigured = apiKey.length > 10 && !apiKey.includes('your_gemini_api_key_here');
    return sendJSON(200, {
      geminiConfigured: isGeminiConfigured,
      supabaseConfigured: !!supabase,
      supabaseUrl: SUPABASE_URL || null,
      serverTime: new Date().toISOString()
    });
  }

  // Supabase Live Healthcheck / Diagnostic
  if (reqPath === '/api/supabase/status' && req.method === 'GET') {
    if (!supabase) {
      return sendJSON(503, {
        connected: false,
        error: 'Supabase client is not configured. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in .env.'
      });
    }

    try {
      const { count, error } = await supabase.from('resumes').select('*', { count: 'exact', head: true });
      if (error) throw error;
      return sendJSON(200, {
        connected: true,
        url: SUPABASE_URL,
        resumesCount: count || 0,
        message: 'Successfully connected to Supabase PostgreSQL database',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      return sendJSON(500, {
        connected: false,
        error: err.message || 'Failed to query Supabase'
      });
    }
  }

  // Supabase public configuration endpoint for browser client
  if (reqPath === '/api/supabase/config' && req.method === 'GET') {
    return sendJSON(200, {
      url: SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY || ''
    });
  }

  // List all resumes from Supabase
  if (reqPath === '/api/resumes' && req.method === 'GET') {
    if (!supabase) {
      return sendJSON(503, { error: 'Supabase is not configured on the server' });
    }
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('id, title, slug, share_id, ats_score, is_public, is_starred, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return sendJSON(200, { success: true, resumes: data || [] });
    } catch (err) {
      return sendJSON(500, { success: false, error: err.message });
    }
  }

  // Get a shared public resume by share_id
  if (reqPath.startsWith('/api/resumes/share/') && req.method === 'GET') {
    if (!supabase) return sendJSON(503, { error: 'Supabase is not configured' });
    const shareId = reqPath.replace('/api/resumes/share/', '').trim();
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('share_id', shareId)
        .single();

      if (error || !data) {
        return sendJSON(404, { success: false, error: 'Shared resume not found' });
      }

      // Record view in resume_analytics (async, fire & forget)
      supabase.from('resume_analytics').insert({
        resume_id: data.id,
        user_agent: req.headers['user-agent'] || '',
        referrer: req.headers['referer'] || ''
      }).then(() => {}).catch(() => {});

      return sendJSON(200, { success: true, resume: data });
    } catch (err) {
      return sendJSON(500, { success: false, error: err.message });
    }
  }

  // Get a single resume by ID
  if (reqPath.startsWith('/api/resumes/') && req.method === 'GET') {
    if (!supabase) return sendJSON(503, { error: 'Supabase is not configured' });
    const resumeId = reqPath.replace('/api/resumes/', '').trim();
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .single();

      if (error) throw error;
      return sendJSON(200, { success: true, resume: data });
    } catch (err) {
      return sendJSON(404, { success: false, error: err.message });
    }
  }

  // Create or Update (Upsert) Resume
  if (reqPath === '/api/resumes' && req.method === 'POST') {
    if (!supabase) return sendJSON(503, { error: 'Supabase is not configured on the server' });
    try {
      const body = await parseRequestBody(req);
      const {
        id,
        title,
        personal,
        experience,
        education,
        skills,
        projects,
        certifications,
        languages,
        settings,
        atsScore,
        isPublic
      } = body;

      const resumePayload = {
        title: title || (personal && personal.fullName ? `${personal.fullName}'s Resume` : 'My Professional Resume'),
        personal_info: personal || {},
        experience: Array.isArray(experience) ? experience : [],
        education: Array.isArray(education) ? education : [],
        skills: Array.isArray(skills) ? skills : [],
        projects: Array.isArray(projects) ? projects : [],
        certifications: Array.isArray(certifications) ? certifications : [],
        languages: Array.isArray(languages) ? languages : [],
        settings: settings || {},
        ats_score: typeof atsScore === 'number' ? Math.max(0, Math.min(100, Math.round(atsScore))) : 0,
        is_public: Boolean(isPublic)
      };

      let result;
      if (id) {
        // Update existing resume
        result = await supabase
          .from('resumes')
          .update(resumePayload)
          .eq('id', id)
          .select()
          .single();
      } else {
        // Insert new resume
        result = await supabase
          .from('resumes')
          .insert(resumePayload)
          .select()
          .single();
      }

      if (result.error) throw result.error;
      return sendJSON(200, { success: true, resume: result.data });
    } catch (err) {
      return sendJSON(500, { success: false, error: err.message });
    }
  }

  // Delete resume
  if (reqPath.startsWith('/api/resumes/') && req.method === 'DELETE') {
    if (!supabase) return sendJSON(503, { error: 'Supabase is not configured' });
    const resumeId = reqPath.replace('/api/resumes/', '').trim();
    try {
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId);

      if (error) throw error;
      return sendJSON(200, { success: true, message: 'Resume deleted successfully' });
    } catch (err) {
      return sendJSON(500, { success: false, error: err.message });
    }
  }

  // AI Summary & Content Generation Proxy
  if ((reqPath === '/api/ai/summary' || reqPath === '/api/ai/enhance') && req.method === 'POST') {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.includes('your_gemini_api_key_here')) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: false,
        error: 'Gemini API key is not configured. Please paste your key into resume-builder/.env file and restart the server.'
      }));
    }

    try {
      const data = await parseRequestBody(req);
      const prompt = data.prompt;

      if (!prompt || typeof prompt !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Missing prompt in request body' }));
      }

      const generatedText = await callGeminiAPI(apiKey, prompt);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, text: generatedText }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  // ---------------------------------------------------------------------------
  // STATIC ASSETS SERVING (Frontend)
  // ---------------------------------------------------------------------------
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.normalize(path.join(BASE_DIR, reqPath));

  // Security check: ensure path stays within BASE_DIR
  if (!filePath.startsWith(BASE_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
    console.error(`👉 You can either stop the process using port ${PORT}, or set a different PORT in .env (e.g. PORT=3001).\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

server.listen(PORT, () => {
  const hasGemini = process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_gemini_api_key_here');
  console.log(`\n============================================================`);
  console.log(`🚀 CraftCV Studio Server running at: http://localhost:${PORT}`);
  console.log(`📂 Serving frontend from: ${BASE_DIR}`);
  console.log(`🤖 Gemini AI Status:  ${hasGemini ? 'Configured ✅' : 'Waiting for GEMINI_API_KEY in .env ⚠️'}`);
  console.log(`⚡ Supabase Database: ${supabase ? `Connected ✅ (${SUPABASE_URL})` : 'Waiting for SUPABASE_URL in .env ⚠️'}`);
  console.log(`============================================================\n`);
});

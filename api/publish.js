/**
 * Signed overwrite of the Cloudinary site catalog (kalongo/site-content).
 * Firebase Auth ID token required. Cloudinary API secret stays on the server.
 */
const crypto = require('crypto');

const DEFAULT_CLOUD = 'dae3rpnmg';
const DEFAULT_PUBLIC_ID = 'kalongo/site-content';

function env(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value == null) continue;
    const trimmed = String(value).trim();
    if (trimmed) return trimmed;
  }
  return '';
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function isSiteData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const hasSettings = data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings);
  const hasSlides = Array.isArray(data.hero_slides);
  return Boolean(hasSettings || hasSlides);
}

function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return Promise.resolve(req.body);
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    return Promise.resolve(JSON.parse(req.body));
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function bearerToken(req) {
  const header = String(req.headers.authorization || req.headers.Authorization || '');
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function decodeJwtPayload(token) {
  const parts = String(token || '').split('.');
  if (parts.length < 2) return null;
  const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const jsonText = Buffer.from(padded, 'base64').toString('utf8');
  return JSON.parse(jsonText);
}

async function verifyFirebaseToken(idToken) {
  const apiKey = env('VITE_FIREBASE_API_KEY', 'FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_API_KEY');
  const projectId = env('VITE_FIREBASE_PROJECT_ID', 'FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!apiKey || !projectId) {
    const err = new Error('Firebase is not configured on the server.');
    err.status = 500;
    throw err;
  }
  const payload = decodeJwtPayload(idToken);
  const audience = payload && payload.aud;
  const issuer = payload && payload.iss;
  if (
    !payload
    || audience !== projectId
    || issuer !== `https://securetoken.google.com/${projectId}`
    || !payload.exp
    || payload.exp * 1000 < Date.now()
  ) {
    const err = new Error('Sign in required to save.');
    err.status = 401;
    throw err;
  }
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.users || !data.users[0]) {
    const err = new Error('Sign in required to save.');
    err.status = 401;
    throw err;
  }
  return data.users[0];
}

function signParams(params, apiSecret) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');
}

async function overwriteCatalog(data) {
  const cloud = env('CLOUDINARY_CLOUD_NAME') || DEFAULT_CLOUD;
  const apiKey = env('CLOUDINARY_API_KEY');
  const apiSecret = env('CLOUDINARY_API_SECRET');
  const publicId = (env('CLOUDINARY_CONTENT_PUBLIC_ID') || DEFAULT_PUBLIC_ID).replace(/^\/+/, '').replace(/\.json$/i, '');
  if (!apiKey || !apiSecret) {
    const err = new Error('Cloudinary API credentials are not configured on the server.');
    err.status = 500;
    throw err;
  }
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signed = {
    invalidate: 'true',
    overwrite: 'true',
    public_id: publicId,
    timestamp,
  };
  const form = new FormData();
  form.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }), 'site-content');
  form.append('api_key', apiKey);
  form.append('timestamp', timestamp);
  form.append('signature', signParams(signed, apiSecret));
  form.append('public_id', publicId);
  form.append('overwrite', 'true');
  form.append('invalidate', 'true');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/raw/upload`, {
    method: 'POST',
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.secure_url) {
    const err = new Error((json.error && json.error.message) || 'Could not publish site content');
    err.status = 502;
    throw err;
  }
  const storedId = String(json.public_id || '');
  if (storedId !== publicId) {
    const err = new Error('Publish did not update kalongo/site-content.');
    err.status = 502;
    throw err;
  }
  return json;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    json(res, 405, { error: 'Method not allowed' });
    return;
  }
  try {
    const token = bearerToken(req);
    if (!token) {
      json(res, 401, { error: 'Sign in required to save.' });
      return;
    }
    await verifyFirebaseToken(token);
    const data = await readBody(req);
    if (!isSiteData(data)) {
      json(res, 400, { error: 'Refusing to publish: payload is not valid site data.' });
      return;
    }
    const uploaded = await overwriteCatalog(data);
    json(res, 200, { ok: true, url: uploaded.secure_url, public_id: uploaded.public_id });
  } catch (err) {
    const status = Number(err && err.status) || (err instanceof SyntaxError ? 400 : 500);
    json(res, status, { error: (err && err.message) || 'Could not publish site content' });
  }
};

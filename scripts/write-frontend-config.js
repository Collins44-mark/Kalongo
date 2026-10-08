#!/usr/bin/env node
/**
 * Writes frontend/js/kalongo-config.js from environment variables at deploy time.
 * This is a static site (not Vite/Next). Vercel env vars are copied into the client config here.
 * Firebase is used for admin authentication only — no Firestore / Realtime Database / Storage.
 */
const fs = require('fs');
const path = require('path');

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, 'utf8').split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq < 1) return;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === '') process.env[key] = value;
  });
}

const root = path.join(__dirname, '..');
loadDotEnv(path.join(root, '.env'));
loadDotEnv(path.join(root, '.env.local'));

function env(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value == null) continue;
    let trimmed = String(value).trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      trimmed = trimmed.slice(1, -1).trim();
    }
    if (trimmed) return trimmed;
  }
  return '';
}

const config = {
  firebase: {
    apiKey: env('VITE_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_API_KEY', 'FIREBASE_API_KEY'),
    authDomain: env('VITE_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'FIREBASE_AUTH_DOMAIN'),
    projectId: env('VITE_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'FIREBASE_PROJECT_ID'),
    storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET', 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID', 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'FIREBASE_MESSAGING_SENDER_ID'),
    appId: env('VITE_FIREBASE_APP_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID', 'FIREBASE_APP_ID'),
  },
  cloudinaryCloudName: env('CLOUDINARY_CLOUD_NAME', 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'VITE_CLOUDINARY_CLOUD_NAME') || 'dae3rpnmg',
  cloudinaryUploadPreset: env('CLOUDINARY_UPLOAD_PRESET', 'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET', 'VITE_CLOUDINARY_UPLOAD_PRESET'),
  contentPublicId: env('CLOUDINARY_CONTENT_PUBLIC_ID', 'NEXT_PUBLIC_CLOUDINARY_CONTENT_PUBLIC_ID') || 'kalongo/site-content',
};

const out = path.join(root, 'frontend', 'js', 'kalongo-config.js');
const source = `/**
 * Generated at build time. Do not edit by hand on Vercel.
 * Firebase is used for admin authentication only.
 */
window.KALONGO_CONFIG = ${JSON.stringify(config, null, 2)};
`;

fs.writeFileSync(out, source);

const firebaseStatus = {
  apiKey: config.firebase.apiKey ? 'set' : 'missing',
  authDomain: config.firebase.authDomain ? 'set' : 'missing',
  projectId: config.firebase.projectId ? 'set' : 'missing',
  storageBucket: config.firebase.storageBucket ? 'set' : 'missing',
  messagingSenderId: config.firebase.messagingSenderId ? 'set' : 'missing',
  appId: config.firebase.appId ? 'set' : 'missing',
};
console.log('Wrote', out);
console.log('Firebase Auth env:', firebaseStatus);

const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingRequired = required.filter((key) => !config.firebase[key]);
if (missingRequired.length) {
  const message = 'Missing required Firebase Auth values: ' + missingRequired.join(', ')
    + '. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID for the Vercel build.';
  if (process.env.VERCEL) {
    console.error(message);
    process.exit(1);
  }
  console.warn(message);
}

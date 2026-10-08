/**
 * Firebase Authentication only — no Firestore, Realtime Database, Storage, or Functions.
 */
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

function firebaseConfig() {
  const cfg = (window.KALONGO_CONFIG && window.KALONGO_CONFIG.firebase) || {};
  return {
    apiKey: cfg.apiKey || '',
    authDomain: cfg.authDomain || '',
    projectId: cfg.projectId || '',
    storageBucket: cfg.storageBucket || '',
    messagingSenderId: cfg.messagingSenderId || '',
    appId: cfg.appId || '',
  };
}

export function isFirebaseConfigured() {
  const c = firebaseConfig();
  return Boolean(c.apiKey && c.authDomain && c.projectId && c.appId);
}

export function getFirebaseAuth() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase Authentication is not configured.');
  }
  const existing = getApps()[0];
  const app = existing || initializeApp(firebaseConfig());
  return getAuth(app);
}

export function signIn(email, password) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export function logOut() {
  return signOut(getFirebaseAuth());
}

export function onAuthChange(callback) {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export function authErrorMessage(err) {
  const code = err && err.code;
  if (
    code === 'auth/wrong-password'
    || code === 'auth/invalid-credential'
    || code === 'auth/user-not-found'
    || code === 'auth/invalid-email'
    || code === 'auth/missing-password'
  ) {
    return 'Incorrect email or password.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait and try again.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Check your connection and try again.';
  }
  return (err && err.message) || 'Sign in failed.';
}

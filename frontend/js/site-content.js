/**
 * Site content loader — static JSON + optional Cloudinary published copy.
 * No Render backend. No Firestore.
 */
(function (global) {
  'use strict';

  const BUNDLED_URL = '/data/site.json';
  const CANONICAL_PUBLIC_ID = 'kalongo/site-content';
  let cache = null;
  let cacheAt = 0;
  const TTL = 15000;

  function cfg() {
    return global.KALONGO_CONFIG || {};
  }

  function canonicalPublicId() {
    return (cfg().contentPublicId || CANONICAL_PUBLIC_ID).replace(/^\/+/, '').replace(/\.json$/i, '');
  }

  function cloudinaryContentUrls() {
    const cloud = cfg().cloudinaryCloudName || 'dae3rpnmg';
    const pid = canonicalPublicId();
    const base = `https://res.cloudinary.com/${cloud}/raw/upload/${pid}`;
    // Do not prefer `pid.json` — that is a different Cloudinary asset (the old probe file).
    return [base, `${base}.json`];
  }

  function cloudinaryContentUrl() {
    return cloudinaryContentUrls()[0];
  }

  function isCanonicalContentResource(json) {
    if (!json || typeof json !== 'object') return false;
    const pid = String(json.public_id || '');
    if (pid === canonicalPublicId()) return true;
    const url = String(json.secure_url || json.url || '');
    if (/site-content\.json/.test(url)) return false;
    return /\/raw\/upload\/(?:v\d+\/)?kalongo\/site-content(?:$|\?)/.test(url);
  }

  async function fetchJson(url, timeoutMs) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs || 8000);
    try {
      const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
      if (!res.ok) throw new Error(String(res.status));
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function emptySite() {
    return {
      hero_slides: [], rooms: [], facilities: [], activities: [],
      pricing: [], food: [], restaurant_menu: [], videos: [],
      gallery_images: [], reviews: [], settings: {},
    };
  }

  function isSiteData(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
    const hasSettings = data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings);
    const hasSlides = Array.isArray(data.hero_slides);
    return Boolean(hasSettings || hasSlides);
  }

  function siteFingerprint(data) {
    const s = (data && data.settings) || {};
    return JSON.stringify({
      hs: s.hero_services || '',
      hb: s.hero_booking || '',
      ha: s.hero_activities || '',
      hk: s.hero_kalongo || '',
      hp: s.hero_pricing || '',
      slides: (data.hero_slides || []).length,
      rooms: (data.rooms || []).length,
      gallery: (data.gallery_images || []).length,
      menu: (data.restaurant_menu || []).length,
      videos: (data.videos || []).length,
    });
  }

  async function load(force) {
    if (!force && cache && Date.now() - cacheAt < TTL) return cache;
    const bundledPromise = fetchJson(BUNDLED_URL, 8000);
    let remote = null;
    const bust = '?t=' + Date.now();
    for (const url of cloudinaryContentUrls()) {
      try {
        const candidate = await fetchJson(url + bust, 4000);
        if (isSiteData(candidate)) {
          remote = candidate;
          break;
        }
      } catch (_) { /* try next */ }
    }
    let bundled = null;
    try { bundled = await bundledPromise; } catch (_) { /* missing bundled file */ }
    cache = (isSiteData(remote) ? remote : null)
      || (isSiteData(bundled) ? bundled : null)
      || emptySite();
    cacheAt = Date.now();
    return cache;
  }

  function slice(endpoint) {
    const data = cache || emptySite();
    const path = String(endpoint || '').replace(/^\//, '');
    if (path === 'hero-slides') {
      const slides = Array.isArray(data.hero_slides) ? data.hero_slides : [];
      const active = slides.filter((s) => s.active !== false);
      return (active.length ? active : slides).map((s) => ({
        id: s.id, image_url: s.image_url, title: s.title, subtitle: s.subtitle, order: s.order,
      }));
    }
    if (path === 'rooms') return data.rooms || [];
    if (path === 'facilities') return data.facilities || [];
    if (path === 'activities') return data.activities || [];
    if (path === 'pricing') return data.pricing || [];
    if (path === 'food') return data.food || [];
    if (path === 'restaurant-menu') return data.restaurant_menu || [];
    if (path === 'videos') return data.videos || [];
    if (path === 'gallery-images') return data.gallery_images || [];
    if (path === 'reviews') return data.reviews || [];
    if (path === 'settings') return data.settings || {};
    if (path === 'homepage-data') {
      const slides = Array.isArray(data.hero_slides) ? data.hero_slides : [];
      const active = slides.filter((s) => s.active !== false);
      return {
        hero_slides: (active.length ? active : slides),
        rooms: data.rooms || [],
        facilities: data.facilities || [],
        reviews: data.reviews || [],
        settings: data.settings || {},
      };
    }
    return null;
  }

  function nextId(data) {
    let max = 0;
    const walk = (v) => {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') {
        if (typeof v.id === 'number' && v.id > max) max = v.id;
        Object.values(v).forEach(walk);
      }
    };
    walk(data);
    return max + 1;
  }

  function cloudName() {
    return cfg().cloudinaryCloudName || 'dae3rpnmg';
  }

  function uploadPreset() {
    return cfg().cloudinaryUploadPreset || 'kalongo_unsigned';
  }

  async function uploadToCloudinary(file, resourceType) {
    const cloud = cloudName();
    const preset = uploadPreset();
    if (!cloud || !preset) throw new Error('Cloudinary unsigned upload preset is not configured.');
    const type = resourceType || (file.type && file.type.startsWith('video/') ? 'video' : 'image');
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', preset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${type}/upload`, {
      method: 'POST',
      body: form,
    });
    const json = await res.json();
    if (!res.ok || !json.secure_url) {
      throw new Error(json.error && json.error.message ? json.error.message : 'Cloudinary upload failed');
    }
    return json.secure_url;
  }

  async function publish(data) {
    if (!isSiteData(data)) {
      throw new Error('Refusing to publish: payload is not valid site data.');
    }
    const cloud = cloudName();
    const preset = uploadPreset();
    const pid = canonicalPublicId();
    if (!cloud || !preset) {
      throw new Error('Set CLOUDINARY_UPLOAD_PRESET so admin changes can be published (unsigned Cloudinary preset).');
    }
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json; charset=utf-8' });
    const form = new FormData();
    // Filename must NOT be *.json — that writes a different asset (kalongo/site-content.json).
    form.append('file', blob, 'site-content');
    form.append('upload_preset', preset);
    form.append('public_id', pid);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/raw/upload`, {
      method: 'POST',
      body: form,
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error && json.error.message ? json.error.message : 'Could not publish site content');
    }
    if (!isCanonicalContentResource(json)) {
      throw new Error(
        'Publish did not update kalongo/site-content. In Cloudinary, set unsigned preset kalongo_unsigned to Unique filename OFF and Overwrite ON.'
      );
    }
    let stored = null;
    try {
      stored = await fetchJson(String(json.secure_url) + (String(json.secure_url).includes('?') ? '&' : '?') + 't=' + Date.now(), 8000);
    } catch (_) {
      stored = null;
    }
    if (!isSiteData(stored) || siteFingerprint(stored) !== siteFingerprint(data)) {
      throw new Error(
        'Cloudinary did not store the new site content at kalongo/site-content. In the unsigned preset kalongo_unsigned, turn Unique filename OFF and Overwrite ON, then save again.'
      );
    }
    cache = data;
    cacheAt = Date.now();
    return json.secure_url;
  }

  global.KalongoContent = {
    load,
    slice,
    nextId,
    uploadToCloudinary,
    publish,
    cloudinaryContentUrl,
    bundledUrl: BUNDLED_URL,
  };
})(window);

/**
 * Site content loader — static JSON + optional Cloudinary published copy.
 * No Render backend. No Firestore.
 */
(function (global) {
  'use strict';

  const BUNDLED_URL = '/data/site.json';
  let cache = null;
  let cacheAt = 0;
  const TTL = 15000;

  function cfg() {
    return global.KALONGO_CONFIG || {};
  }

  function cloudinaryContentUrl() {
    const c = cfg();
    const cloud = c.cloudinaryCloudName || 'dae3rpnmg';
    const pid = (c.contentPublicId || 'kalongo/site-content').replace(/^\/+/, '');
    return `https://res.cloudinary.com/${cloud}/raw/upload/${pid}.json`;
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
    return Boolean(data && typeof data === 'object' && (Array.isArray(data.hero_slides) || data.settings));
  }

  function fromLocalStorage() {
    try {
      const raw = localStorage.getItem('kalongo-site-content');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return isSiteData(parsed) ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  async function load(force) {
    if (!force && cache && Date.now() - cacheAt < TTL) return cache;
    const bundledPromise = fetchJson(BUNDLED_URL, 8000);
    let remote = null;
    try {
      remote = await fetchJson(cloudinaryContentUrl() + '?t=' + Date.now(), 2500);
    } catch (_) { /* unpublished or unreachable */ }
    let bundled = null;
    try { bundled = await bundledPromise; } catch (_) { /* missing bundled file */ }
    cache = (isSiteData(remote) ? remote : null)
      || (isSiteData(bundled) ? bundled : null)
      || fromLocalStorage()
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
    const c = cfg();
    const cloud = cloudName();
    const preset = uploadPreset();
    const pid = c.contentPublicId || 'kalongo/site-content';
    if (!cloud || !preset) {
      throw new Error('Set CLOUDINARY_UPLOAD_PRESET so admin changes can be published (unsigned Cloudinary preset).');
    }
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const form = new FormData();
    form.append('file', blob, 'site-content.json');
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
    cache = data;
    cacheAt = Date.now();
    try { localStorage.setItem('kalongo-site-content', JSON.stringify(data)); } catch (_) {}
    return json.secure_url || true;
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

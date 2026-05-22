/**
 * Our Services — interactive restaurant menu showcase
 */
(function () {
  'use strict';

  const SVC_CLOUD = 'https://res.cloudinary.com/dae3rpnmg/image/upload';

  const DRINK_NAMES = new Set([
    'soft drinks', 'vodka', 'liquor', 'beer', 'gin', 'wine', 'whiskey', 'other drinks',
  ]);

  const MENU_DEFAULTS = {
    breakfast: {
      subtitle: 'Fresh farm breakfast selections',
      image: `${SVC_CLOUD}/c_fill,w_900,h_600,q_auto/v1769247200/farm-fresh-food_tkrtak.jpg`,
      icon: 'breakfast',
      group: 'food',
    },
    'main course': {
      subtitle: 'Hearty local and international meals',
      image: `${SVC_CLOUD}/c_fill,w_900,h_600,q_auto/v1769247284/hero-slide2_f67kon.jpg`,
      icon: 'main',
      group: 'food',
    },
    'burgers & pizza': {
      subtitle: 'Crispy, cheesy and delicious',
      image: `${SVC_CLOUD}/c_fill,w_900,h_600,q_auto/v1769247205/activities_im4edt.jpg`,
      icon: 'burger',
      group: 'food',
    },
    bbq: {
      subtitle: 'Smoked and grilled favorites',
      image: `${SVC_CLOUD}/c_fill,w_900,h_600,q_auto/v1769247205/activities_im4edt.jpg`,
      icon: 'bbq',
      group: 'food',
    },
    'salads and juices': {
      subtitle: 'Fresh organic healthy choices',
      image: `${SVC_CLOUD}/c_fill,w_900,h_600,q_auto/v1769247200/farm-fresh-food_tkrtak.jpg`,
      icon: 'salad',
      group: 'food',
    },
    'salads & juices': {
      subtitle: 'Fresh organic healthy choices',
      image: `${SVC_CLOUD}/c_fill,w_900,h_600,q_auto/v1769247200/farm-fresh-food_tkrtak.jpg`,
      icon: 'salad',
      group: 'food',
    },
    'other dishes': {
      subtitle: 'Tasty side dishes and specials',
      image: `${SVC_CLOUD}/c_fill,w_900,h_600,q_auto/v1769247541/cottage-inside1_b6zcxz.jpg`,
      icon: 'other-dish',
      group: 'food',
    },
    'soft drinks': {
      subtitle: 'Refreshing chilled beverages',
      image: `${SVC_CLOUD}/c_fill,w_900,h_600,q_auto/v1769247489/customer1_expjr7.jpg`,
      icon: 'soft-drink',
      group: 'drinks',
    },
    vodka: {
      subtitle: 'Premium vodka collection',
      image: `${SVC_CLOUD}/c_fill,w_900,h_600,q_auto/v1769247595/kalongo-surroundings1_iha0us.jpg`,
      icon: 'vodka',
      group: 'drinks',
    },
    liquor: {
      subtitle: 'Smooth premium liquor',
      image: `${SVC_CLOUD}/c_fill,w_900,h_600,q_auto/v1769247597/kalongo-surroundings2_k0rfgu.jpg`,
      icon: 'liquor',
      group: 'drinks',
    },
    beer: {
      subtitle: 'Local and imported beers',
      image: `${SVC_CLOUD}/c_fill,w_900,h_600,q_auto/v1769247489/customer1_expjr7.jpg`,
      icon: 'beer',
      group: 'drinks',
    },
    gin: {
      subtitle: 'Classic gin selections',
      image: `${SVC_CLOUD}/c_fill,w_900,h_600,q_auto/v1769247598/kalongo-surroundings3_urxadi.jpg`,
      icon: 'gin',
      group: 'drinks',
    },
    wine: {
      subtitle: 'Fine wine collection',
      image: `${SVC_CLOUD}/c_fill,w_900,h_600,q_auto/v1769247395/our-kalongo-hero-background_sedoxy.jpg`,
      icon: 'wine',
      group: 'drinks',
    },
    whiskey: {
      subtitle: 'Premium whiskey collection',
      image: `${SVC_CLOUD}/c_fill,w_900,h_600,q_auto/v1769247595/kalongo-surroundings1_iha0us.jpg`,
      icon: 'whiskey',
      group: 'drinks',
    },
    'other drinks': {
      subtitle: 'Special drinks and collections',
      image: `${SVC_CLOUD}/c_fill,w_900,h_600,q_auto/v1769247283/booking-hero-background_idfar7.jpg`,
      icon: 'other-drink',
      group: 'drinks',
    },
  };

  const ICONS = {
    breakfast: '<svg viewBox="0 0 24 24"><path d="M4 14h16M6 10h12M8 6h8"/><circle cx="12" cy="16" r="2"/></svg>',
    main: '<svg viewBox="0 0 24 24"><path d="M4 12h16M6 8h12M8 4h8"/><path d="M5 16h14v2H5z"/></svg>',
    burger: '<svg viewBox="0 0 24 24"><path d="M4 10h16M5 7h14M6 13h12M7 16h10"/></svg>',
    bbq: '<svg viewBox="0 0 24 24"><path d="M8 18l2-8h4l2 8M6 20h12"/><path d="M10 6c0-2 2-3 2-3s2 1 2 3"/></svg>',
    salad: '<svg viewBox="0 0 24 24"><path d="M12 4c-3 2-5 5-5 8a5 5 0 0010 0c0-3-2-6-5-8z"/><path d="M8 14h8"/></svg>',
    'other-dish': '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M8 12h8M12 8v8"/></svg>',
    'soft-drink': '<svg viewBox="0 0 24 24"><path d="M9 3h6v4l-1 14H10L9 7V3z"/></svg>',
    vodka: '<svg viewBox="0 0 24 24"><path d="M9 3h6v3l-2 15H11L9 6V3z"/></svg>',
    liquor: '<svg viewBox="0 0 24 24"><path d="M8 4h8l-1 16H9L8 4zM10 8h4"/></svg>',
    beer: '<svg viewBox="0 0 24 24"><path d="M8 6h9a2 2 0 012 2v9a3 3 0 01-3 3H9a3 3 0 01-3-3V8a2 2 0 012-2z"/><path d="M17 9h2v6h-2"/></svg>',
    gin: '<svg viewBox="0 0 24 24"><path d="M10 3h4l-1 17h-2L10 3z"/></svg>',
    wine: '<svg viewBox="0 0 24 24"><path d="M8 4h8l-2 14H10L8 4z"/><path d="M9 20h6"/></svg>',
    whiskey: '<svg viewBox="0 0 24 24"><path d="M9 4h6l-1 14h-4L9 4z"/><circle cx="12" cy="10" r="2"/></svg>',
    'other-drink': '<svg viewBox="0 0 24 24"><path d="M8 6h8v2l-2 12h-4l-2-12V6z"/></svg>',
  };

  const OTHER_CHARGES = [
    { title: 'Room Service', subtitle: 'In-room convenience', price: 'TZS 5,000' },
    { title: 'Laundry (Soft)', subtitle: 'Per cloth', price: 'TZS 2,000' },
    { title: 'Laundry (Hard)', subtitle: 'Per cloth', price: 'TZS 4,000' },
    { title: 'Mountain Bikes', subtitle: 'Per hour', price: 'TZS 20,000' },
    { title: 'Photo Shooting', subtitle: 'Per person', price: 'TZS 10,000' },
    { title: 'Wedding Photos', subtitle: 'Full session', price: 'TZS 100,000' },
    { title: 'Prewedding Photos', subtitle: 'Full session', price: 'TZS 50,000' },
  ];

  let categories = [];
  let activeIndex = 0;
  let showPrices = true;
  let pollTimer = null;

  function esc(text) {
    return String(text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function normName(name) {
    return (name || '').trim().toLowerCase();
  }

  function catMeta(cat) {
    const key = normName(cat.name);
    const def = MENU_DEFAULTS[key] || {};
    const group = DRINK_NAMES.has(key) ? 'drinks' : (def.group || 'food');
    const icon = cat.icon_key || def.icon || 'main';
    return {
      subtitle: cat.subtitle || def.subtitle || '',
      image: cat.image_url || def.image || `${SVC_CLOUD}/c_fill,w_900,h_600,q_auto/v1769247200/farm-fresh-food_tkrtak.jpg`,
      icon,
      group,
    };
  }

  function iconHtml(key) {
    return `<span class="lux-menu-cat-icon" aria-hidden="true">${ICONS[key] || ICONS.main}</span>`;
  }

  function optimizeImg(url) {
    if (!url || typeof optimizeCloudinaryUrl !== 'function') return url;
    return optimizeCloudinaryUrl(url, 900, 600, 'auto', 'auto');
  }

  function cardHtml(cat, index) {
    const meta = catMeta(cat);
    const img = esc(optimizeImg(meta.image));
    const title = esc((cat.name || '').toUpperCase());
    return `
      <button type="button" class="lux-menu-cat-card is-visible" data-menu-index="${index}" aria-label="View ${esc(cat.name)} menu">
        <div class="lux-menu-cat-card-media">
          <img src="${img}" alt="${esc(cat.name)}" loading="lazy" decoding="async">
          <div class="lux-menu-cat-card-shade" aria-hidden="true"></div>
        </div>
        <div class="lux-menu-cat-card-body">
          ${iconHtml(meta.icon)}
          <h4 class="lux-menu-cat-name">${title}</h4>
          <p class="lux-menu-cat-sub">${esc(meta.subtitle)}</p>
          <span class="lux-menu-cat-cta">View Menu <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
        </div>
      </button>`;
  }

  function renderGrids() {
    const foodEl = document.getElementById('luxMenuFoodGrid');
    const drinksEl = document.getElementById('luxMenuDrinksGrid');
    if (!foodEl || !drinksEl) return;

    const food = [];
    const drinks = [];
    categories.forEach((cat, i) => {
      const enriched = { ...cat, _index: i };
      if (catMeta(cat).group === 'drinks') drinks.push(enriched);
      else food.push(enriched);
    });

    foodEl.innerHTML = food.length
      ? food.map((c) => cardHtml(c, c._index)).join('')
      : '<p class="lux-menu-loading">No food categories yet.</p>';
    drinksEl.innerHTML = drinks.length
      ? drinks.map((c) => cardHtml(c, c._index)).join('')
      : '<p class="lux-menu-loading">No drinks categories yet.</p>';

    foodEl.querySelectorAll('[data-menu-index]').forEach((btn) => {
      btn.addEventListener('click', () => openModal(parseInt(btn.dataset.menuIndex, 10)));
    });
    drinksEl.querySelectorAll('[data-menu-index]').forEach((btn) => {
      btn.addEventListener('click', () => openModal(parseInt(btn.dataset.menuIndex, 10)));
    });

    if (typeof initScrollReveal === 'function') {
      window.dispatchEvent(new CustomEvent('servicesPageRendered'));
    }
  }

  function modalItemsHtml(cat) {
    const items = cat.items || [];
    if (!items.length) return '<p class="lux-menu-modal-sub">Menu items coming soon.</p>';
    return `<div class="lux-menu-items">${items.map((item) => `
      <div class="lux-menu-item">
        <span class="lux-menu-item-name">${esc(item.name)}</span>
        <span class="lux-menu-item-price price-display">${showPrices ? esc(item.price) : ''}</span>
      </div>
    `).join('')}</div>`;
  }

  function openModal(index) {
    const modal = document.getElementById('luxMenuModal');
    const body = document.getElementById('luxMenuModalBody');
    if (!modal || !body || !categories[index]) return;

    activeIndex = index;
    const cat = categories[index];
    const meta = catMeta(cat);
    const img = esc(optimizeImg(meta.image));

    body.innerHTML = `
      <div class="lux-menu-modal-media">
        <img src="${img}" alt="${esc(cat.name)}" loading="lazy">
      </div>
      <div class="lux-menu-modal-content">
        <div class="lux-menu-modal-head">
          ${iconHtml(meta.icon)}
          <div>
            <h2 class="lux-menu-modal-title" id="luxMenuModalTitle">${esc((cat.name || '').toUpperCase())}</h2>
            <p class="lux-menu-modal-sub">${esc(meta.subtitle)}</p>
          </div>
        </div>
        ${modalItemsHtml(cat)}
        <div class="lux-menu-modal-foot">
          <button type="button" class="lux-menu-modal-close-btn" data-menu-close>Close Menu</button>
        </div>
      </div>`;

    body.querySelectorAll('[data-menu-close]').forEach((el) => {
      el.addEventListener('click', closeModal);
    });

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const modal = document.getElementById('luxMenuModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function stepModal(dir) {
    if (!categories.length) return;
    let next = activeIndex + dir;
    if (next < 0) next = categories.length - 1;
    if (next >= categories.length) next = 0;
    openModal(next);
  }

  function bindModalChrome() {
    const modal = document.getElementById('luxMenuModal');
    if (!modal) return;
    modal.querySelectorAll('[data-menu-close]').forEach((el) => {
      el.addEventListener('click', closeModal);
    });
    document.getElementById('luxMenuModalPrev')?.addEventListener('click', () => stepModal(-1));
    document.getElementById('luxMenuModalNext')?.addEventListener('click', () => stepModal(1));
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') stepModal(-1);
      if (e.key === 'ArrowRight') stepModal(1);
    });
  }

  const FALLBACK_NAMES = {
    breakfast: 'Breakfast',
    'main course': 'Main Courses',
    'burgers & pizza': 'Burgers & Pizzas',
    bbq: 'BBQ',
    'salads and juices': 'Salads & Juices',
    'other dishes': 'Other Dishes',
    'soft drinks': 'Soft Drinks',
    vodka: 'Vodka',
    liquor: 'Liquor',
    beer: 'Beer',
    gin: 'Gin',
    wine: 'Wine',
    whiskey: 'Whiskey',
    'other drinks': 'Other Drinks',
  };

  function buildFallbackCategories() {
    return Object.entries(MENU_DEFAULTS).map(([key, def], idx) => ({
      id: idx + 1,
      name: FALLBACK_NAMES[key] || key,
      subtitle: def.subtitle,
      image_url: def.image,
      icon_key: def.icon,
      order: idx,
      items: [],
    }));
  }

  async function fetchMenu() {
    let data = null;
    if (typeof fetchAPI === 'function') {
      data = await fetchAPI('/restaurant-menu', false);
    } else if (typeof API !== 'undefined' && API.getRestaurantMenu) {
      data = await API.getRestaurantMenu();
    }
    if (Array.isArray(data) && data.length > 0) {
      return data.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    console.warn('Menu API unavailable — using built-in category catalog');
    return buildFallbackCategories();
  }

  async function loadAndRender() {
    const foodEl = document.getElementById('luxMenuFoodGrid');
    const drinksEl = document.getElementById('luxMenuDrinksGrid');
    try {
      if (foodEl) foodEl.innerHTML = '<p class="lux-menu-loading">Loading menu…</p>';
      if (drinksEl) drinksEl.innerHTML = '';
      categories = await fetchMenu();
      renderGrids();
    } catch (e) {
      console.error('Menu showcase load error:', e);
      categories = buildFallbackCategories();
      renderGrids();
      if (foodEl && !foodEl.querySelector('.lux-menu-cat-card')) {
        foodEl.innerHTML = '<p class="lux-menu-loading">Unable to load menu. Please refresh the page.</p>';
      }
    }
  }

  function chargesListHtml(charges) {
    const rows = charges.map((c) => `
        <div class="lux-svc-charge-row">
            <div class="lux-svc-charge-col lux-svc-charge-col--name">
                <span class="lux-svc-charge-name">${esc(c.title)}</span>
                <span class="lux-svc-charge-note">${esc(c.subtitle)}</span>
            </div>
            <span class="lux-svc-charge-col lux-svc-charge-col--price price-display">${showPrices ? esc(c.price) : ''}</span>
        </div>
    `).join('');
    return `<div class="lux-svc-charges-list">${rows}</div>`;
  }

  function renderOtherCharges() {
    const panel = document.querySelector('.lux-svc-charges-panel[data-svc="charges"]');
    if (!panel) return;
    panel.innerHTML = chargesListHtml(OTHER_CHARGES);
  }

  function applyPriceVisibility() {
    showPrices = (window.siteSettings?.show_prices || '').toLowerCase() === 'true';
    if (!showPrices) document.body.classList.add('prices-hidden');
    else document.body.classList.remove('prices-hidden');
    renderOtherCharges();
  }

  function init() {
    if (!document.body.classList.contains('lux-menu-page')) return;

    applyPriceVisibility();
    bindModalChrome();
    renderOtherCharges();
    loadAndRender();

    window.addEventListener('siteSettingsReady', () => {
      applyPriceVisibility();
      loadAndRender();
    });

    pollTimer = setInterval(loadAndRender, 45000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') loadAndRender();
    });
  }

  function startWhenReady() {
    if (typeof fetchAPI === 'function' || (typeof API !== 'undefined' && API.getRestaurantMenu)) {
      init();
      return;
    }
    setTimeout(startWhenReady, 50);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWhenReady);
  } else {
    startWhenReady();
  }

  window.LuxMenuShowcase = { refresh: loadAndRender };
})();

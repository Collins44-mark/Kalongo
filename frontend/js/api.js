/**
 * API Client for Kalongo Farm - Fetches data from backend
 * Optimized for fast loading with error handling
 */
// Auto-detect API URL (works for both localhost and production)
const API_BASE_URL = (() => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5001/api';
    }
    // For production, use Render backend URL
    return 'https://kalongo.onrender.com/api';
})();
const API_TIMEOUT = 15000; // 15 seconds (allows backend cold start on Render)

// Image preloading cache
const imageCache = new Map();

// Helper function to optimize Cloudinary URLs
const optimizeCloudinaryUrl = (url, width = null, height = null, quality = 'auto', format = 'auto') => {
    if (!url || !url.includes('cloudinary.com')) return url;
    
    // If already optimized, return as is
    if (url.includes('/upload/w_') || url.includes('/upload/c_')) return url;
    
    // Add Cloudinary transformations for optimization
    if (url.includes('/upload/')) {
        let transformations = [];
        if (width) transformations.push(`w_${width}`);
        if (height) transformations.push(`h_${height}`);
        transformations.push(`q_${quality}`);
        transformations.push(`f_${format}`);
        transformations.push('c_limit'); // Limit to maintain aspect ratio
        
        return url.replace('/upload/', `/upload/${transformations.join(',')}/`);
    }
    return url;
};

/** Transparent PNG logo for dark navbar (no white box) */
const getTransparentLogoUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    if (url.includes('e_background_removal')) return url.replace(/\.(jpg|jpeg|webp)$/i, '.png');
    return url.replace('/upload/', '/upload/e_background_removal,f_png,q_auto/').replace(/\.(jpg|jpeg|webp)$/i, '.png');
};

/** Premium facilities catalog (order + copy); merged with API images */
const FACILITY_CATALOG = [
    { key: 'pool', name: 'Swimming Pool', description: 'Relax and cool off in our refreshing swimming pool surrounded by nature.' },
    { key: 'farm', name: 'Natural Farm', description: 'Experience authentic farm life with our natural farming practices and organic produce.' },
    { key: 'animals', name: 'Domestic Animals', description: 'Interact with our friendly domestic animals including cows, goats, chickens, and more.' },
    { key: 'food', name: 'Farm-Fresh Food', description: 'Enjoy delicious meals made from fresh, locally sourced ingredients from our farm.' },
    { key: 'trails', name: 'Nature Trails', description: 'Explore our beautiful surroundings through guided nature walks and trails.' },
    { key: 'activities', name: 'Activities', description: 'Participate in various farm activities, animal feeding, and educational programs.' },
];

const normalizeFacilityName = (name) => (name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const mergeFacilitiesList = (apiList) => {
    const apiByName = {};
    (apiList || []).forEach((f) => {
        apiByName[normalizeFacilityName(f.name)] = f;
    });
    return FACILITY_CATALOG.map((def) => {
        const api = apiByName[normalizeFacilityName(def.name)];
        const image_url = api?.image_url || def.image_url || '';
        return {
            name: def.name,
            description: api?.description || def.description,
            image_url,
            iconKey: def.key,
        };
    });
};

const facilityLuxIconSvg = (key) => {
    const icons = {
        pool: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/><path d="M2 16c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/><circle cx="18" cy="6" r="2"/></svg>',
        farm: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c-4 4-6 8-6 12a6 6 0 0 0 12 0c0-4-2-8-6-12z"/><path d="M12 10v8"/></svg>',
        animals: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="2"/><circle cx="16" cy="8" r="2"/><path d="M5 14c1.5 3 4 4 7 4s5.5-1 7-4"/><path d="M9 12h6"/></svg>',
        food: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11h16v2H4z"/><path d="M8 7v10M16 7v10"/><path d="M6 4h12v3H6z"/></svg>',
        trails: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20L10 8l4 4 6-12"/></svg>',
        activities: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h6M6 14l3-7h6l3 7"/></svg>',
    };
    return icons[key] || icons.farm;
};

const ecoFeatureIcon = (text) => {
    const t = (text || '').toLowerCase();
    let icon = '◆';
    if (t.includes('wifi') || t.includes('wi-fi') || t.includes('internet')) icon = '⌁';
    else if (t.includes('bath') || t.includes('shower')) icon = '◇';
    else if (t.includes('bed') || t.includes('sleep')) icon = '☾';
    else if (t.includes('view') || t.includes('garden') || t.includes('farm')) icon = '❋';
    else if (t.includes('food') || t.includes('dining') || t.includes('kitchen')) icon = '◎';
    else if (t.includes('air') || t.includes('ac')) icon = '◈';
    return icon;
};

/** Cloudinary video → poster frame JPG */
const cloudinaryVideoPoster = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    if (url.includes('/video/upload/')) {
        return url
            .replace('/video/upload/', '/video/upload/so_0,w_800,h_500,c_fill/')
            .replace(/\.(mp4|webm|mov|m4v)$/i, '.jpg');
    }
    return url;
};

const preloadImage = (url, optimize = true) => {
    const optimizedUrl = optimize ? optimizeCloudinaryUrl(url, 1200, null, 'auto', 'auto') : url;
    
    if (imageCache.has(optimizedUrl)) {
        return Promise.resolve(imageCache.get(optimizedUrl));
    }
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            imageCache.set(optimizedUrl, img);
            resolve(img);
        };
        img.onerror = reject;
        img.src = optimizedUrl;
    });
};

// API response cache (short-lived for performance)
const apiCache = new Map();
const CACHE_TTL = 60000; // 60 seconds (increased for better performance)

async function fetchAPI(endpoint, useCache = true) {
    // Check cache first
    if (useCache && apiCache.has(endpoint)) {
        const cached = apiCache.get(endpoint);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            console.log(`📦 Using cached data for ${endpoint}`);
            return cached.data;
        }
        apiCache.delete(endpoint);
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
        
        const url = `${API_BASE_URL}${endpoint}`;
        console.log(`📡 Fetching: ${url}`);
        
            const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'max-age=60' // Allow browser caching for 60 seconds
            },
            mode: 'cors',
            cache: 'default' // Use browser cache
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Cache the response
        if (useCache) {
            apiCache.set(endpoint, {
                data,
                timestamp: Date.now()
            });
        }
        
        console.log(`✅ Loaded ${endpoint}: ${Array.isArray(data) ? data.length + ' items' : 'data received'}`);
        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error(`❌ API Timeout (${endpoint}): Request took too long`);
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            console.error(`❌ API Connection Error (${endpoint}): Backend server may not be running at ${API_BASE_URL}`);
            console.error(`   Make sure backend is running: python3 run_backend.py`);
        } else {
            console.error(`❌ API Error (${endpoint}):`, error.message);
        }
        return null;
    }
}

// API functions
const API = {
    getHeroSlides: () => fetchAPI('/hero-slides'),
    getRooms: () => fetchAPI('/rooms'),
    getFacilities: () => fetchAPI('/facilities'),
    getActivities: () => fetchAPI('/activities'),
    getPricing: () => fetchAPI('/pricing'),
    getFood: () => fetchAPI('/food'),
    getRestaurantMenu: () => fetchAPI('/restaurant-menu'),
    getVideos: () => fetchAPI('/videos'),
    getReviews: () => fetchAPI('/reviews'),
    getSettings: () => fetchAPI('/settings'),
    // Combined endpoint for faster homepage loading
    getHomepageData: () => fetchAPI('/homepage-data'),
};

/** Our Services page — premium card markup */
const SVC_ACC_PRIORITY = ['A-Cabin', 'Cottage', 'Family'];
const SVC_ACT_PRIORITY = ['Quad Bike', 'Sports Bike', 'Bonfire'];

const svcIconBed = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10v8M3 10h4v8M7 10V7a2 2 0 012-2h6a2 2 0 012 2v3M17 10v8M21 10v8M21 10h-4"/></svg>';
const svcIconHome = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5L12 4l8 7.5M6 10.5V20h12V10.5"/></svg>';
const svcIconUsers = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M12 12a4 4 0 100-8 4 4 0 000 8zM23 20v-1a3 3 0 00-2-2.8M16 4.2a3 3 0 010 5.6"/></svg>';
const svcIconBike = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h6M12 5l3 6M9 11l3-6 3 6"/></svg>';
const svcIconSport = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-9 4 4 4-4"/></svg>';
const svcIconFire = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c1 3 4 5 4 9a4 4 0 01-8 0c0-2 1.5-3.5 2-5.5C9 8 8 10 6 12a6 6 0 0012 0c0-3-2-5-3-7z"/></svg>';
const svcIconClock = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const svcIconFood = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C9 8 6 9 6 14a6 6 0 1012 0c0-5-3-6-6-11z"/><path d="M9 17h6"/></svg>';
const svcIconDefault = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2 4h4l-3 3 1 5-4-2-4 2 1-5-3-3h4z"/></svg>';

const SVC_ACC_DESC = {
    'A-Cabin': 'A cozy cabin surrounded by nature — ideal for couples and solo travelers.',
    'Cottage': 'A spacious cottage with serene farm views and premium comfort.',
    'Family': 'Generous space for families with breakfast and farm hospitality included.',
    'Kikota': 'Traditional kikota lodging with an authentic eco-lodge experience.',
    'Tents': 'Glamping-style tents for an immersive outdoor stay under the stars.',
};

const SVC_ACT_DESC = {
    'Quad Bike': 'Explore the farm trails on a thrilling quad bike adventure.',
    'Sports Bike': 'Cycle through scenic paths at your own pace.',
    'Bonfire': 'Unwind with an evening bonfire under the open sky.',
    'Farm Tour': 'Guided tour of our sustainable farm and ecosystems.',
};

function svcAccIcon(name) {
    const n = (name || '').toLowerCase();
    if (n.includes('family')) return svcIconUsers;
    if (n.includes('cottage') || n.includes('kikota')) return svcIconHome;
    return svcIconBed;
}

function svcActIcon(name) {
    const n = (name || '').toLowerCase();
    if (n.includes('quad')) return svcIconBike;
    if (n.includes('sport') || n.includes('mountain')) return svcIconSport;
    if (n.includes('bonfire') || n.includes('fire')) return svcIconFire;
    if (n.includes('farm') || n.includes('tour')) return svcIconHome;
    return svcIconBike;
}

function svcChargeIcon(name) {
    const n = (name || '').toLowerCase();
    if (n.includes('laundry')) return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v16H6zM8 8h8M10 12h4"/></svg>';
    if (n.includes('room')) return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16v12H4zM8 8V6a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>';
    if (n.includes('bike') || n.includes('quad')) return svcIconBike;
    if (n.includes('photo') || n.includes('wedding')) return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h4l2-2h4l2 2h4v12H4zM12 11a3 3 0 100 6 3 3 0 000-6z"/></svg>';
    return svcIconDefault;
}

function svcEscape(text) {
    return String(text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function svcAccDescription(name) {
    return SVC_ACC_DESC[name] || 'Comfortable accommodation with breakfast included at Kalongo Farm.';
}

function svcActDescription(name) {
    return SVC_ACT_DESC[name] || 'An unforgettable farm experience tailored for our guests.';
}

function svcFoodIcon(categoryName, itemName) {
    const c = (categoryName || '').toLowerCase();
    const n = (itemName || '').toLowerCase();
    if (c.includes('drink') || c.includes('beer') || c.includes('wine') || c.includes('vodka') || n.includes('soda') || n.includes('juice')) {
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h8v3l-2 14H10L8 6V3z"/></svg>';
    }
    if (c.includes('breakfast') || n.includes('egg') || n.includes('bread')) {
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="14" r="4"/><path d="M8 6h8M10 4h4"/></svg>';
    }
    return svcIconFood;
}

function svcAccommodationCardHtml(name, items, showPrices) {
    const pricesHtml = showPrices && items.length
        ? `<div class="lux-svc-prices">${items.map((item) => `
            <div class="lux-svc-price-row">
              <span>${svcEscape(item.price_label || '')}</span>
              <strong class="price-display">${svcEscape(item.price_value || '')}</strong>
            </div>`).join('')}</div>`
        : '';
    return `
        <article class="lux-svc-card lux-svc-glass">
            <div class="lux-svc-card-icon">${svcAccIcon(name)}</div>
            <h3 class="lux-svc-card-title">${svcEscape(name)}</h3>
            <p class="lux-svc-card-desc">${svcEscape(svcAccDescription(name))}</p>
            <ul class="lux-svc-features">
                <li><span class="lux-svc-check" aria-hidden="true">✓</span> Comfortable bed</li>
                <li><span class="lux-svc-check" aria-hidden="true">✓</span> Breakfast included</li>
            </ul>
            ${pricesHtml}
        </article>`;
}

function svcActivityCardHtml(item, showPrices) {
    const duration = item.price_label || '';
    const features = [
        duration ? `<li><span class="lux-svc-check" aria-hidden="true">◎</span> ${svcEscape(duration)}</li>` : '',
        '<li><span class="lux-svc-check" aria-hidden="true">✓</span> Farm experience included</li>',
    ].filter(Boolean).join('');
    const priceHtml = showPrices && item.price_value
        ? `<div class="lux-svc-prices"><div class="lux-svc-price-row"><span>From</span><strong class="price-display">${svcEscape(item.price_value)}</strong></div></div>`
        : '';
    return `
        <article class="lux-svc-card lux-svc-glass">
            <div class="lux-svc-card-icon">${svcActIcon(item.name)}</div>
            <h3 class="lux-svc-card-title">${svcEscape(item.name)}</h3>
            <p class="lux-svc-card-desc">${svcEscape(svcActDescription(item.name))}</p>
            <ul class="lux-svc-features">${features}</ul>
            ${priceHtml}
        </article>`;
}

function svcFilterByPriority(entries, priority) {
    const ordered = [];
    priority.forEach((key) => {
        const match = entries.find(([name]) => name.toLowerCase() === key.toLowerCase());
        if (match) ordered.push(match);
    });
    entries.forEach((entry) => {
        if (!ordered.some(([n]) => n === entry[0])) ordered.push(entry);
    });
    return ordered;
}

// Render functions
const Render = {
    heroSlides: (slides) => {
        console.log('🎨 Rendering hero slides (modern swipe)...', slides?.length || 0);
        const slider = document.querySelector('.hero-slider');
        if (!slider || !slides || slides.length === 0) {
            console.warn('❌ Hero slides: No slider element or no slides data');
            return;
        }
        
        // Clear existing content
        slider.innerHTML = '';
        
        // Render slides as flex items for swipe
        slides.forEach((slide, idx) => {
            const slideDiv = document.createElement('div');
            slideDiv.className = 'hero-slide';
            slideDiv.setAttribute('data-slide-index', idx);
            
            if (slide.image_url) {
                const optimizedUrl = optimizeCloudinaryUrl(slide.image_url, 1920, 1080, 'auto', 'auto');
                slideDiv.style.backgroundImage = `url('${optimizedUrl}')`;
                slideDiv.style.backgroundSize = 'cover';
                slideDiv.style.backgroundPosition = 'center';
                slideDiv.style.backgroundRepeat = 'no-repeat';
            }
            
            slider.appendChild(slideDiv);
        });
        
        console.log(`✅ Created ${slides.length} hero slide elements`);
        
        // Update hero content from first slide
        if (slides[0]) {
            if (slides[0].title) {
                const lineWhite = document.querySelector('.eco-hero-line:not(.eco-hero-line--green)');
                const lineGreen = document.querySelector('.eco-hero-line--green');
                const t = slides[0].title.replace(/^welcome\s+to\s+/i, '').trim();
                if (lineWhite && lineGreen && /kalongo/i.test(t)) {
                    const parts = t.split(/\s+farm/i);
                    lineWhite.textContent = (parts[0] || 'KALONGO').trim().toUpperCase();
                    lineGreen.textContent = 'FARM';
                }
            }
            if (slides[0].subtitle) {
                const subtitleEl = document.querySelector('.hero-subtitle');
                if (subtitleEl) subtitleEl.textContent = slides[0].subtitle;
            }
        }
        
        // Store slides data globally for content updates
        window.heroSlidesData = slides;
        
        // Dispatch event to initialize swipe slider
        setTimeout(() => {
            const event = new CustomEvent('heroSlidesRendered');
            window.dispatchEvent(event);
            console.log('📢 Dispatched heroSlidesRendered event');
        }, 100);
    },
    
    /** Build HTML for one luxury accommodation card (swipe gallery + detail modal) */
    roomCardHtml: (room) => {
        const validImages = (room.images || []).filter(img => img.image_url && img.image_url.trim());
        const imagesHtml = validImages.length > 0 ? validImages.map((img, idx) => {
            const optimizedUrl = optimizeCloudinaryUrl(img.image_url, 800, 600, 'auto', 'auto');
            return `<div class="room-slide" data-slide-index="${idx}">
                <img src="${optimizedUrl}" alt="${(img.caption || room.name).replace(/"/g, '&quot;')}" class="room-slide-image" loading="${idx === 0 ? 'eager' : 'lazy'}">
            </div>`;
        }).join('') : `<div class="room-slide eco-room-slide--empty"><p>No image available</p></div>`;
        const defaultAmenities = ['Comfortable beds', 'Private bathroom', 'Farm view', 'Free WiFi'];
        const amenityList = (room.features && room.features.length) ? room.features.slice(0, 4) : defaultAmenities;
        const featuresHtml = amenityList.map(f =>
            `<li><span class="lux-amenity-icon" aria-hidden="true">${ecoFeatureIcon(f)}</span><span>${f}</span></li>`
        ).join('');
        const priceMap = {
            'a-cabin': { amount: 180000, label: '/ night' },
            cottage: { amount: 180000, label: '/ night' },
            kikota: { amount: 400000, label: ' / stay' },
            'family-house': { amount: 250000, label: '/ night' },
        };
        const priceEntry = priceMap[room.slug];
        const priceHtml = priceEntry
            ? `<strong>From TZS ${Number(priceEntry.amount).toLocaleString('en-US')}</strong> ${priceEntry.label}`
            : '<strong>Contact for rates</strong>';
        return `<article class="room-card lux-room-card" data-room-slug="${room.slug || ''}" tabindex="0" role="button" aria-label="View ${room.name} details">
            <div class="lux-room-media">
                <div class="room-slider-container" data-room="${room.slug}">
                    <div class="room-slider" data-room="${room.slug}">${imagesHtml}</div>
                </div>
                <div class="lux-room-shade" aria-hidden="true"></div>
                <span class="lux-room-badge">LUXURY STAY</span>
            </div>
            <div class="lux-room-body">
                <h3 class="lux-room-title">${room.name}</h3>
                ${room.capacity ? `<p class="lux-room-capacity">${room.capacity}</p>` : ''}
                <ul class="lux-room-amenities">${featuresHtml}</ul>
                <div class="lux-room-footer">
                    <p class="lux-room-price">${priceHtml}</p>
                    <button type="button" class="lux-room-view-btn" aria-label="View ${room.name} details">View Details</button>
                </div>
            </div>
        </article>`;
    },

    /** Render rooms into a specific container (for Rooms and Family Houses sections) */
    roomsInto: (container, rooms) => {
        if (!container || !rooms || rooms.length === 0) return;
        window.roomsCatalog = rooms;
        container.innerHTML = rooms.map(room => Render.roomCardHtml(room)).join('');
    },

    rooms: (rooms) => {
        console.log('🎨 Rendering rooms...', rooms?.length || 0);
        let container = document.querySelector('.rooms-grid') || document.querySelector('#rooms .rooms-grid') || document.querySelector('[id="rooms"] .rooms-grid');
        if (!container) {
            console.error('❌ Rooms: No container found (.rooms-grid)');
            return;
        }
        if (!rooms || rooms.length === 0) {
            console.warn('⚠️ Rooms: No rooms data');
            return;
        }
        Render.roomsInto(container, rooms);
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('roomsRendered', { detail: { rooms } }));
            if (typeof initializeRoomSlider === 'function') {
                rooms.forEach(room => { if (room.slug) initializeRoomSlider(room.slug); });
            }
        }, 150);
        console.log(`✅ Rendered ${rooms.length} rooms`);
    },
    
    facilityCardHtml: (fac) => {
        const imgUrl = fac.image_url ? optimizeCloudinaryUrl(fac.image_url, 640, 620, 'auto', 'auto') : '';
        const safeName = (fac.name || '').replace(/"/g, '&quot;');
        const safeDesc = (fac.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const iconSvg = facilityLuxIconSvg(fac.iconKey);
        const mediaInner = imgUrl
            ? `<img class="lux-facility-img" src="${imgUrl}" alt="${safeName}" loading="lazy">`
            : '<div class="lux-facility-img-placeholder" aria-hidden="true"></div>';
        return `<article class="facility-item lux-facility-card">
            <div class="lux-facility-media${imgUrl ? '' : ' lux-facility-media--empty'}">
                ${mediaInner}
                <div class="lux-facility-img-overlay" aria-hidden="true"></div>
                <div class="lux-facility-icon-badge" aria-hidden="true">${iconSvg}</div>
            </div>
            <div class="lux-facility-body">
                <h3 class="lux-facility-title">${fac.name}</h3>
                <p class="lux-facility-desc">${safeDesc}</p>
            </div>
        </article>`;
    },

    facilities: (facilities) => {
        const container = document.querySelector('.facilities-grid') || document.querySelector('#facilities .facilities-grid');
        if (!container) {
            console.warn('Facilities: No container found');
            return;
        }
        const merged = mergeFacilitiesList(facilities || []);
        container.innerHTML = merged.map((fac) => Render.facilityCardHtml(fac)).join('');
        console.log(`✅ Rendered ${merged.length} facilities`);
    },
    
    activities: (activities) => {
        console.log('🎨 Rendering activities...', activities?.length || 0);
        if (!activities || activities.length === 0) {
            console.warn('⚠️ Activities: No activities data');
            return;
        }
        
        // Try list container first (for activities page)
        let container = document.querySelector('.activities-list-container');
        console.log('🔍 Activities list container found:', !!container);
        if (container) {
            container.innerHTML = activities.map(act => {
                if (!act.name) return ''; // Skip activities without names
                const optimizedImageUrl = act.image_url ? optimizeCloudinaryUrl(act.image_url, 800, 600, 'auto', 'auto') : null;
                return `
                <div class="activities-group eco-activity-block">
                    <div class="eco-activity-layout">
                        ${optimizedImageUrl ? `
                            <div class="eco-activity-media">
                                <img src="${optimizedImageUrl}" alt="${act.name}" loading="lazy" onerror="this.parentElement.classList.add('eco-activity-media--hidden');">
                                <div class="eco-activity-shade" aria-hidden="true"></div>
                            </div>
                        ` : ''}
                        <div class="eco-activity-text">
                            <h3 class="activities-group-title">${act.name}</h3>
                            ${act.description ? `<p class="eco-activity-desc">${act.description}</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
            }).filter(html => html).join('');
            console.log(`✅ Rendered ${activities.length} activities in list container`);
            return;
        }
        
        // Try grid container (for packages page)
        container = document.querySelector('.activities-grid-modern');
        console.log('🔍 Activities grid container found:', !!container);
        if (container) {
            container.innerHTML = activities.map(act => {
                if (!act.name) return '';
                const optimizedImageUrl = act.image_url ? optimizeCloudinaryUrl(act.image_url, 400, 300, 'auto', 'auto') : null;
                return `
                <div class="activity-card-modern">
                    ${optimizedImageUrl ? `<img src="${optimizedImageUrl}" alt="${act.name}" style="width:100%;height:200px;object-fit:cover;border-radius:10px;margin-bottom:1rem;" loading="lazy" onerror="this.style.display='none';">` : ''}
                    <h3 class="activity-name-modern">${act.name}</h3>
                    ${act.description ? `<p class="activity-duration-modern">${act.description}</p>` : ''}
                </div>
            `;
            }).filter(html => html).join('');
            console.log(`✅ Rendered ${activities.length} activities in grid container`);
        } else {
            console.error('❌ Activities: No container found (.activities-list-container or .activities-grid-modern)');
        }
    },
    
    pricing: (pricing, showPrices = true) => {
        console.log('🎨 Rendering pricing...', pricing?.length || 0, 'showPrices:', showPrices);
        if (!pricing || pricing.length === 0) {
            console.warn('⚠️ Pricing: No pricing data');
            return;
        }
        pricing.forEach(category => {
            console.log(`  📦 Processing category: ${category.name} (${category.category_type}) with ${category.items?.length || 0} items`);
            if (category.category_type === 'accommodation') {
                let container = document.querySelector('.lux-svc-premium-grid[data-svc="accommodation"]')
                    || document.querySelector('.accommodation-grid-modern');
                if (!container) {
                    container = document.querySelector('.packages-section-modern .accommodation-grid-modern');
                }
                console.log('  🔍 Accommodation container found:', !!container);
                if (container) {
                    const grouped = {};
                    category.items.forEach(item => {
                        if (!grouped[item.name]) grouped[item.name] = [];
                        grouped[item.name].push(item);
                    });
                    const entries = svcFilterByPriority(Object.entries(grouped), SVC_ACC_PRIORITY);
                    const onServicesPage = document.body.classList.contains('lux-services-page');
                    const displayEntries = entries;

                    container.innerHTML = displayEntries.map(([name, items]) => {
                        if (onServicesPage) return svcAccommodationCardHtml(name, items, showPrices);
                        const hasFeatured = items.some(i => i.featured);
                        return `
                            <div class="accommodation-card-modern ${hasFeatured ? 'featured-accommodation-modern' : ''}">
                                ${hasFeatured ? '<div class="featured-badge-modern">Popular</div>' : ''}
                                <div class="accommodation-header-modern">
                                    <h3 class="accommodation-name-modern">${name}</h3>
                                </div>
                                <div class="accommodation-pricing-modern">
                                    ${items.map(item => `
                                        <div class="price-item-modern">
                                            <span class="price-label-modern">${item.price_label || ''}</span>
                                            <span class="price-value-modern price-display">${item.price_value}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>`;
                    }).join('');
                    console.log(`  ✅ Rendered ${displayEntries.length} accommodation items`);
                } else {
                    console.error('  ❌ Accommodation container not found!');
                }
            } else if (category.category_type === 'activity') {
                let container = document.querySelector('.lux-svc-premium-grid[data-svc="activities"]')
                    || document.querySelector('.activities-grid-modern');
                if (!container) {
                    container = document.querySelector('.packages-section-modern .activities-grid-modern');
                }
                if (!container) {
                    // Try to find by section title
                    const sections = Array.from(document.querySelectorAll('.packages-section-modern'));
                    const activitySection = sections.find(s => {
                        const title = s.querySelector('.section-title-modern');
                        return title && title.textContent.includes('Activities');
                    });
                    if (activitySection) {
                        container = activitySection.querySelector('.activities-grid-modern');
                        if (!container) {
                            // Create container if it doesn't exist
                            container = document.createElement('div');
                            container.className = 'activities-grid-modern';
                            const desc = activitySection.querySelector('.section-description-modern');
                            if (desc && desc.nextSibling) {
                                activitySection.insertBefore(container, desc.nextSibling);
                            } else {
                                activitySection.appendChild(container);
                            }
                        }
                    }
                }
                console.log('  🔍 Activities container found:', !!container);
                if (container && category.items && category.items.length > 0) {
                    const onServicesPage = document.body.classList.contains('lux-services-page');
                    let items = [...category.items];
                    if (onServicesPage) {
                        const priority = items.filter((i) =>
                            SVC_ACT_PRIORITY.some((p) => p.toLowerCase() === (i.name || '').toLowerCase())
                        );
                        const rest = items.filter((i) =>
                            !SVC_ACT_PRIORITY.some((p) => p.toLowerCase() === (i.name || '').toLowerCase())
                        );
                        items = [...priority, ...rest];
                    }
                    console.log(`  📝 Rendering ${items.length} activity items`);
                    container.innerHTML = items.map(item => {
                        if (onServicesPage) return svcActivityCardHtml(item, showPrices);
                        const isFree = (item.price_value || '').toLowerCase().includes('free');
                        return `
                            <div class="activity-card-modern ${isFree ? 'free-activity-modern' : ''}">
                                <h3 class="activity-name-modern">${item.name}</h3>
                                <p class="activity-duration-modern">${item.price_label || ''}</p>
                                <div class="activity-price-modern price-display">${item.price_value || ''}</div>
                            </div>
                        `;
                    }).join('');
                    console.log(`  ✅ Rendered ${items.length} activity items`);
                } else {
                    console.error('  ❌ Activities container not found or no items!', {
                        container: !!container,
                        items: category.items?.length || 0
                    });
                }
            } else if (category.category_type === 'food') {
                const container = document.querySelector('.food-grid-modern');
                console.log('  🔍 Food container found:', !!container);
                if (container) {
                    container.innerHTML = category.items.map(item => `
                        <div class="food-card-modern ${item.featured ? 'featured-food-modern' : ''}">
                            ${item.featured ? '<div class="featured-badge-modern">Best Value</div>' : ''}
                            <h3 class="food-name-modern">${item.name}</h3>
                            ${item.description ? `<p class="food-description-modern">${item.description}</p>` : ''}
                            <div class="food-price-modern price-display">${item.price_value || item.price_label}</div>
                        </div>
                    `).join('');
                    console.log(`  ✅ Rendered ${category.items.length} food items`);
                } else {
                    console.error('  ❌ Food container not found!');
                }
            }
        });
        
        console.log(`✅ Rendered pricing for ${pricing.length} categories`);
    },
    
    food: (food) => {
        console.log('🎨 Rendering food...', food?.length || 0);
        let container = document.querySelector('.food-grid-modern');
        if (!container) {
            container = document.querySelector('.packages-section-modern .food-grid-modern');
        }
        console.log('🔍 Food container found:', !!container);
        if (!container) {
            console.error('❌ Food: No container found (.food-grid-modern)');
            return;
        }
        if (!food || food.length === 0) {
            console.warn('⚠️ Food: No food data');
            return;
        }
        
        console.log('  📝 Rendering', food.length, 'food items');
        
        container.innerHTML = food.map(item => `
            <div class="food-card-modern ${item.featured ? 'featured-food-modern' : ''}">
                ${item.featured ? '<div class="featured-badge-modern">Best Value</div>' : ''}
                <h3 class="food-name-modern">${item.name}</h3>
                ${item.description ? `<p class="food-description-modern">${item.description}</p>` : ''}
                <div class="food-price-modern price-display">${item.price}</div>
            </div>
        `).join('');
        
        console.log(`✅ Rendered ${food.length} food items`);
    },
    
    reviewSlideHtml: (review, idx) => {
        const metaDefaults = [
            { name: 'Michael T.', location: 'Dar es Salaam, Tanzania', date: 'April 15, 2024' },
            { name: 'Sarah M.', location: 'Arusha, Tanzania', date: 'March 8, 2024' },
            { name: 'Grace T.', location: 'Mbeya, Tanzania', date: 'February 22, 2024' },
            { name: 'John K.', location: 'Dodoma, Tanzania', date: 'January 10, 2024' },
        ];
        const meta = metaDefaults[idx % metaDefaults.length];
        const rating = Math.min(5, Math.max(1, review.rating || 5));
        const starsHtml = Array.from({ length: 5 }, (_, i) =>
            `<span class="lux-review-star" aria-hidden="true">${i < rating ? '★' : '☆'}</span>`
        ).join('');
        const quote = (review.quote || 'An unforgettable stay surrounded by nature, comfort, and warm hospitality. Kalongo Farm exceeded every expectation.').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const customerName = (review.customer_name || meta.name).replace(/</g, '&lt;');
        const location = meta.location;
        const dateStr = meta.date;
        const photoUrl = review.image_url ? optimizeCloudinaryUrl(review.image_url, 720, 520, 'auto', 'auto') : '';
        const avatarUrl = review.image_url ? optimizeCloudinaryUrl(review.image_url, 112, 112, 'auto', 'auto') : '';
        const safeName = customerName.replace(/"/g, '&quot;');
        const visualHtml = photoUrl
            ? `<div class="lux-review-visual"><img class="lux-review-photo" src="${photoUrl}" alt="${safeName}" loading="${idx === 0 ? 'eager' : 'lazy'}"></div>`
            : `<div class="lux-review-visual"><div class="lux-review-photo lux-review-photo--empty" aria-hidden="true"></div></div>`;
        const avatarHtml = avatarUrl
            ? `<img class="lux-review-avatar" src="${avatarUrl}" alt="" loading="lazy">`
            : `<span class="lux-review-avatar lux-review-avatar--placeholder" aria-hidden="true"></span>`;

        return `<div class="review-slide lux-review-slide" data-review-index="${idx}">
            <div class="lux-review-card">
                ${visualHtml}
                <div class="lux-review-panel">
                    <div class="lux-review-stars" aria-label="Rating: ${rating} out of 5 stars">${starsHtml}</div>
                    <div class="lux-review-quote-wrap">
                        <span class="lux-review-q-mark lux-review-q-open" aria-hidden="true">"</span>
                        <p class="lux-review-quote">${quote}</p>
                        <span class="lux-review-q-mark lux-review-q-close" aria-hidden="true">"</span>
                    </div>
                    <div class="lux-review-author-divider" aria-hidden="true">❋</div>
                    <div class="lux-review-author">
                        ${avatarHtml}
                        <div>
                            <h4 class="lux-review-name">${customerName}</h4>
                            <p class="lux-review-location">${location}</p>
                            <p class="lux-review-date">${dateStr}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    reviews: (reviews) => {
        console.log('🎨 Rendering reviews (luxury slider)...', reviews?.length || 0);
        const slider = document.querySelector('#reviewsSlider, .reviews-slider');
        if (!slider) {
            console.error('❌ Reviews: No slider element found');
            return;
        }
        if (!reviews || reviews.length === 0) {
            console.warn('⚠️ Reviews: No reviews data');
            return;
        }

        slider.innerHTML = reviews.map((review, idx) => Render.reviewSlideHtml(review, idx)).join('');
        console.log(`✅ Created ${reviews.length} luxury review slides`);

        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('reviewsRendered', { detail: { reviews } }));
        }, 100);
    },
    
    restaurantMenu: (menu) => {
        if (!menu || menu.length === 0) {
            console.warn('Restaurant menu: No menu data');
            return;
        }
        
        const menuContainer = document.querySelector('.lux-svc-menu-wrap, .menu-container');
        if (!menuContainer) {
            // Try finding by section header
            const headers = Array.from(document.querySelectorAll('.section-title-modern'));
            const menuHeader = headers.find(h => h.textContent.includes('Restaurant Menu'));
            if (menuHeader) {
                const menuSection = menuHeader.closest('.packages-section-modern');
                if (menuSection) {
                    // Create container if it doesn't exist
                    const existingContainer = menuSection.querySelector('.menu-container');
                    if (!existingContainer) {
                        const newContainer = document.createElement('div');
                        newContainer.className = 'menu-container';
                        const desc = menuSection.querySelector('.section-description-modern');
                        if (desc && desc.nextSibling) {
                            menuSection.insertBefore(newContainer, desc.nextSibling);
                        } else {
                            menuSection.appendChild(newContainer);
                        }
                        newContainer.innerHTML = '';
                    }
                }
            } else {
                console.warn('Restaurant menu: No menu section found');
                return;
            }
        }
        
        const container = document.querySelector('.lux-svc-menu-wrap, .menu-container');
        if (!container) {
            console.warn('Restaurant menu: No container found');
            return;
        }
        
        const onServicesPage = document.body.classList.contains('lux-services-page');
        container.innerHTML = menu.map(category => {
            if (onServicesPage) {
                return `
            <div class="lux-svc-menu-category lux-svc-glass">
                <h3 class="lux-svc-menu-cat-title">${svcEscape(category.name)}</h3>
                <div class="lux-svc-menu-cat-rule" aria-hidden="true"></div>
                <div class="lux-svc-menu-grid">
                    ${(category.items || []).map(item => `
                        <article class="lux-svc-food-card lux-svc-glass">
                            <span class="lux-svc-food-icon">${svcFoodIcon(category.name, item.name)}</span>
                            <span class="lux-svc-food-name">${svcEscape(item.name)}</span>
                            <span class="lux-svc-food-price price-display">${svcEscape(item.price)}</span>
                        </article>
                    `).join('')}
                </div>
            </div>`;
            }
            return `
            <div class="menu-category-modern">
                <h3 class="menu-category-title-modern">${category.name}</h3>
                <div class="menu-grid-modern">
                    ${category.items.map(item => `
                        <div class="menu-item-modern">
                            <span class="menu-item-name-modern">${item.name}</span>
                            <span class="menu-item-price-modern price-display">${item.price}</span>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }).join('');
        
        console.log(`✅ Rendered ${menu.length} restaurant menu categories`);
    },
    
    videos: (videos) => {
        console.log('🎨 Rendering videos...', videos?.length || 0);
        // Find the Videos section container specifically
        let container = null;
        const sections = document.querySelectorAll('.packages-section-modern');
        sections.forEach(section => {
            const title = section.querySelector('.section-title-modern');
            if (title && title.textContent.includes('Videos')) {
                container = section.querySelector('.gallery-grid-modern');
            }
        });
        
        // Fallback to first gallery-grid-modern if not found
        if (!container) {
            container = document.querySelector('.gallery-grid-modern');
        }
        
        console.log('🔍 Gallery container found:', !!container);
        if (!container) {
            console.error('❌ Videos: No gallery container found (.gallery-grid-modern)');
            return;
        }
        if (!videos || videos.length === 0) {
            console.warn('⚠️ Videos: No videos data');
            container.innerHTML = '<p style="text-align:center;color:#999;padding:2rem;">No videos available at this time.</p>';
            return;
        }
        
        // Filter videos for our-kalongo section
        const kalongoVideos = videos.filter(v => v.section === 'our-kalongo' || !v.section);
        console.log('  📹 Filtered videos for our-kalongo:', kalongoVideos.length);
        
        if (kalongoVideos.length === 0) {
            console.warn('⚠️ No videos match our-kalongo section');
            container.innerHTML = '<p style="text-align:center;color:#999;padding:2rem;">No videos available at this time.</p>';
            return;
        }
        
        container.innerHTML = kalongoVideos.map(v => {
            const optimizedUrl = optimizeCloudinaryUrl(v.url, 800, 600, 'auto', 'auto');
            const poster = cloudinaryVideoPoster(optimizedUrl);
            return `
            <div class="gallery-item-modern video-item-modern eco-video-card" data-video-url="${optimizedUrl}" role="button" tabindex="0" aria-label="Play video${v.caption ? ': ' + v.caption : ''}">
                <div class="eco-video-thumb" style="background-image:url('${poster}')"></div>
                <span class="eco-play-btn" aria-hidden="true">▶</span>
                <div class="eco-video-overlay">
                    ${v.caption ? `<p class="eco-video-caption">${v.caption}</p>` : ''}
                </div>
            </div>
        `;
        }).join('');
    },

    kalongoVideoCardHtml: (video, featured = false) => {
        const url = video.url || '';
        const caption = (video.caption || 'Kalongo Farm').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const poster = cloudinaryVideoPoster(url);
        const safeUrl = url.replace(/"/g, '&quot;');
        const cls = featured ? 'lux-kalongo-video-featured eco-video-card' : 'lux-kalongo-video-card eco-video-card';
        return `
            <article class="${cls}" data-video-url="${safeUrl}" role="button" tabindex="0" aria-label="Play video: ${caption}">
                <div class="lux-kalongo-video-media" style="background-image:url('${poster}')"></div>
                <div class="lux-kalongo-video-shade" aria-hidden="true"></div>
                <span class="lux-kalongo-play" aria-hidden="true">▶</span>
                <p class="lux-kalongo-video-caption">${caption}</p>
            </article>`;
    },

    kalongoPage: (videos) => {
        if (!document.body.classList.contains('lux-kalongo-page')) return;

        const container = document.getElementById('luxKalongoVideos');
        if (!container) return;

        const list = (videos || []).filter((v) => v.section === 'our-kalongo' || !v.section);
        if (!list.length) {
            container.innerHTML = '<p class="lux-kalongo-videos-empty">No videos available at this time.</p>';
            window.dispatchEvent(new CustomEvent('kalongoRendered', { detail: { videos: list } }));
            return;
        }

        const [first, ...rest] = list;
        const featuredHtml = Render.kalongoVideoCardHtml(first, true);
        const gridHtml = rest.length
            ? `<div class="lux-kalongo-video-grid">${rest.map((v) => Render.kalongoVideoCardHtml(v, false)).join('')}</div>`
            : '';

        container.innerHTML = featuredHtml + gridHtml;
        console.log(`✅ Rendered ${list.length} Kalongo videos`);
        window.dispatchEvent(new CustomEvent('kalongoRendered', { detail: { videos: list } }));
    },
    
    
    settings: (settings) => {
        console.log('🎨 Rendering settings...', settings);
        
        // Update logo
        const logos = document.querySelectorAll('#logo, .logo');
        console.log('🔍 Found logo elements:', logos.length);
        if (logos.length > 0 && settings.logo_url) {
            const logoSrc = getTransparentLogoUrl(settings.logo_url);
            logos.forEach(logo => {
                logo.src = logoSrc;
                logo.classList.add('logo--transparent');
                logo.onload = () => console.log('✅ Logo loaded:', settings.logo_url);
                logo.onerror = () => console.error('❌ Failed to load logo:', settings.logo_url);
            });
            console.log('✅ Updated logo to:', settings.logo_url);
        } else {
            console.warn('⚠️ No logo elements found or no logo_url in settings');
        }
        
        // Update about text
        const aboutText = document.querySelector('.about-description-modern p');
        if (aboutText && settings.about_text) {
            aboutText.textContent = settings.about_text;
            console.log('✅ Updated about text');
        }
        
        // Update footer contact info
        if (settings.phone) {
            const footerItems = document.querySelectorAll('footer li');
            footerItems.forEach(li => {
                if (li.textContent.includes('Phone:')) {
                    li.textContent = `Phone: ${settings.phone}`;
                }
            });
            console.log('✅ Updated footer contact info');
        }
        // Update footer mail link href
        const mailLink = document.querySelector('.mail-footer-link');
        if (mailLink && settings.email) {
            mailLink.href = `mailto:${settings.email}`;
        }
        // Update "Visit Us" link with admin map coordinates
        const visitLinks = document.querySelectorAll('.btn-visit-footer');
        const coords = (settings.map_coordinates || '-9.1379842,33.5286078').trim().replace(/\s+/g, '');
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(coords)}`;
        visitLinks.forEach(a => {
            a.href = mapsUrl;
        });
        
        // Store for other uses
        window.siteSettings = settings;
        console.log('✅ Settings rendering complete');
    },
};

// Check if backend is available
async function checkBackendHealth() {
    try {
        // Build health URL - handle both localhost and production
        let healthUrl;
        if (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1')) {
            healthUrl = 'http://localhost:5001/health';
        } else {
            // Use the same base URL as API (production backend)
            healthUrl = API_BASE_URL.replace('/api', '/health');
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // Increased timeout
        const response = await fetch(healthUrl, { 
            signal: controller.signal,
            mode: 'cors',
            cache: 'no-cache'
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend health check:', data);
            return true;
        }
        return false;
    } catch (error) {
        console.warn('⚠️ Backend health check failed:', error.message);
        return false;
    }
}

// Initialize data loading - optimized
// Use both DOMContentLoaded and window.onload to ensure DOM is ready
async function initializeDataLoading() {
    console.log('🚀 Initializing frontend data loading...');
    console.log(`📍 API Base URL: ${API_BASE_URL}`);
    console.log('📍 Current URL:', window.location.href);
    console.log('📍 Document ready state:', document.readyState);
    
    // Check backend availability (non-blocking - don't block page load)
    checkBackendHealth().then(available => {
        if (!available) {
            console.warn('⚠️ Backend health check failed - but continuing to load content');
            console.warn('   If content doesn\'t load, start backend: python3 run_backend.py');
            // Try to fetch data anyway - might be a temporary network issue
        } else {
            console.log('✅ Backend server is running and healthy');
        }
    }).catch(err => {
        console.warn('⚠️ Health check error (non-critical):', err.message);
    });
    
    // Load settings first (cached, fast)
    console.log('📥 Fetching settings...');
    const settings = await API.getSettings();
    if (settings) {
        console.log('📊 Settings received:', Object.keys(settings));
        Render.settings(settings);
        console.log('✅ Settings loaded and rendered');
    } else {
        console.error('❌ Failed to load settings');
    }
    
    // Load page-specific data
    const path = window.location.pathname;
    console.log(`📄 Current page: ${path}`);
    
    if (path === '/' || path.endsWith('/') || path.includes('index.html')) {
        console.log('🏠 Loading homepage data...');
        try {
            let heroSlidesData = [], roomsData = [], facilitiesData = [], reviewsData = [];
            let homepageData = null;
            try {
                homepageData = await API.getHomepageData();
            } catch (e) {
                console.warn('⚠️ Homepage combined endpoint failed:', e.message);
            }
            if (homepageData && (homepageData.rooms?.length || homepageData.reviews?.length || homepageData.hero_slides?.length)) {
                heroSlidesData = homepageData.hero_slides || [];
                roomsData = homepageData.rooms || [];
                facilitiesData = homepageData.facilities || [];
                reviewsData = homepageData.reviews || [];
                const homepageSettings = homepageData.settings || {};
                console.log('📊 Homepage data loaded (combined):', {
                    heroSlides: heroSlidesData.length,
                    rooms: roomsData.length,
                    facilities: facilitiesData.length,
                    reviews: reviewsData.length
                });
                if (homepageSettings && Object.keys(homepageSettings).length > 0) {
                    Render.settings(homepageSettings);
                }
            }
            if (!roomsData?.length || !reviewsData?.length) {
                console.warn('⚠️ Fetching rooms/reviews individually as fallback...');
                const [rooms, reviews] = await Promise.all([
                    roomsData?.length ? Promise.resolve(roomsData) : API.getRooms().catch(() => []),
                    reviewsData?.length ? Promise.resolve(reviewsData) : API.getReviews().catch(() => []),
                ]);
                if (!roomsData?.length) roomsData = Array.isArray(rooms) ? rooms : [];
                if (!reviewsData?.length) reviewsData = Array.isArray(reviews) ? reviews : [];
                if (!heroSlidesData?.length) {
                    try { heroSlidesData = await API.getHeroSlides(); } catch (_) {}
                }
                if (!facilitiesData?.length) {
                    try { facilitiesData = await API.getFacilities(); } catch (_) {}
                }
            }
            
            // Render all data immediately (parallel rendering for speed)
            const renderData = () => {
                // Render all sections in parallel for faster display
                const renderPromises = [];
                
                if (heroSlidesData && heroSlidesData.length > 0) {
                    console.log('📊 Hero slides data received, calling Render.heroSlides()...');
                    renderPromises.push(Promise.resolve(Render.heroSlides(heroSlidesData)));
                } else {
                    console.warn('⚠️ No hero slides to display');
                }
                
                if (roomsData && roomsData.length > 0) {
                    console.log('🏠 Calling Render.rooms()...');
                    const roomsContainer = document.querySelector('.rooms-grid');
                    if (roomsContainer) {
                        renderPromises.push(Promise.resolve(Render.rooms(roomsData)));
                    } else {
                        setTimeout(() => {
                            const retryContainer = document.querySelector('.rooms-grid');
                            if (retryContainer) Render.rooms(roomsData);
                        }, 200);
                    }
                } else {
                    console.warn('⚠️ No rooms to display');
                }
                
                if (document.querySelector('.facilities-grid') || document.querySelector('#facilities .facilities-grid')) {
                    console.log('🏊 Calling Render.facilities()...');
                    renderPromises.push(Promise.resolve(Render.facilities(facilitiesData || [])));
                }
                
                if (reviewsData && reviewsData.length > 0) {
                    console.log('⭐ Calling Render.reviews()...');
                    renderPromises.push(Promise.resolve(Render.reviews(reviewsData)));
                } else {
                    console.warn('⚠️ No reviews to display');
                }
                
                // Wait for all rendering to complete
                Promise.all(renderPromises).then(() => {
                    console.log('✅ All homepage content rendered');
                });
            };
            
            // Render immediately for faster display
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', renderData);
            } else {
                renderData();
            }
        } catch (error) {
            console.error('❌ Error loading homepage data:', error);
        }
    }
    
    if (path.includes('packages.html')) {
        console.log('📦 Loading packages page data...');
        document.querySelectorAll('.nav-link[href*="packages"]').forEach((link) => {
            link.classList.add('is-active');
        });
        try {
            const [pricing, menu] = await Promise.all([
                API.getPricing(),
                API.getRestaurantMenu(),
            ]);
            const showPrices = (window.siteSettings?.show_prices || '').toLowerCase() === 'true';
            console.log('📊 Packages data loaded:', {
                pricing: pricing?.length || 0,
                menu: menu?.length || 0,
                showPrices
            });

            const renderPackages = () => {
                if (pricing && pricing.length > 0) {
                    Render.pricing(pricing, showPrices);
                } else {
                    console.warn('⚠️ No pricing data to display');
                }
                if (menu && menu.length > 0) {
                    Render.restaurantMenu(menu);
                } else {
                    console.warn('⚠️ No restaurant menu to display');
                }
                if (!showPrices) {
                    document.body.classList.add('prices-hidden');
                } else {
                    document.body.classList.remove('prices-hidden');
                }
            };

            if (document.readyState === 'complete') {
                setTimeout(renderPackages, 50);
            } else {
                setTimeout(renderPackages, 100);
                window.addEventListener('load', () => setTimeout(renderPackages, 50));
            }
        } catch (error) {
            console.error('❌ Error loading packages data:', error);
        }
    }
    
    if (path.includes('our-kalongo.html')) {
        console.log('🎥 Loading Our Kalongo media...');
        document.querySelectorAll('.nav-link[href*="our-kalongo"]').forEach((link) => {
            link.classList.add('is-active');
        });
        try {
            const videos = await API.getVideos();
            console.log('📊 Videos loaded:', videos?.length || 0);
            const apply = () => Render.kalongoPage(videos || []);
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => setTimeout(apply, 50));
            } else {
                setTimeout(apply, 50);
            }
        } catch (error) {
            console.error('❌ Error loading Our Kalongo videos:', error);
        }
    }
    
    if (path.includes('activities.html')) {
        console.log('🏃 Loading activities...');
        try {
            const activities = await API.getActivities();
            console.log('📊 Activities received:', activities?.length || 0);
            if (activities && activities.length > 0) {
                // Wait for DOM to be ready
                const renderActivities = () => {
                    const container = document.querySelector('.activities-list-container');
                    if (container) {
                        console.log('🏃 Calling Render.activities()...');
                        Render.activities(activities);
                    } else {
                        console.warn('⚠️ Activities container not ready, retrying...');
                        setTimeout(renderActivities, 200);
                    }
                };
                
                if (document.readyState === 'complete') {
                    setTimeout(renderActivities, 100);
                } else {
                    window.addEventListener('load', () => setTimeout(renderActivities, 100));
                    setTimeout(renderActivities, 200);
                }
            } else {
                console.warn('⚠️ No activities to display');
                const container = document.querySelector('.activities-list-container');
                if (container) {
                    container.innerHTML = '<p style="text-align:center;color:#999;padding:2rem;">No activities available at this time. Please check back later.</p>';
                }
            }
        } catch (error) {
            console.error('❌ Error loading activities:', error);
            const container = document.querySelector('.activities-list-container');
            if (container) {
                container.innerHTML = '<p style="text-align:center;color:#d32f2f;padding:2rem;">Error loading activities. Please refresh the page.</p>';
            }
        }
    }
    
    console.log('✅ Frontend initialization complete');
    
    // Trigger hero slider initialization after slides are rendered
    if (path === '/' || path.endsWith('/') || path.includes('index.html')) {
        setTimeout(() => {
            // Dispatch custom event to notify script.js that slides are ready
            const event = new CustomEvent('heroSlidesRendered');
            window.dispatchEvent(event);
            console.log('📢 Dispatched heroSlidesRendered event');
        }, 100);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDataLoading);
} else {
    // DOM already loaded
    initializeDataLoading();
}

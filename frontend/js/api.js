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
const API_TIMEOUT = 3000; // 3 seconds timeout (optimized for speed)

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
    getRoomCategories: () => fetchAPI('/room-categories'),
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

// Render functions
const Render = {
    heroSlides: (slides) => {
        console.log('🎨 Rendering hero slides...', slides?.length || 0);
        const slider = document.querySelector('.hero-slider');
        const indicators = document.querySelector('.hero-slider-indicators');
        if (!slider || !slides || slides.length === 0) {
            console.warn('❌ Hero slides: No slider element or no slides data');
            return;
        }
        
        // Clear existing content
        slider.innerHTML = '';
        if (indicators) indicators.innerHTML = '';
        
        // Preload ALL images immediately in parallel for instant display
        console.log('📥 Preloading all hero images...');
        const imagePromises = slides.map((slide, idx) => {
            if (slide.image_url) {
                return preloadImage(slide.image_url).then(() => {
                    console.log(`✅ Preloaded hero image ${idx + 1}/${slides.length}`);
                    return true;
                }).catch(() => {
                    console.warn(`⚠️ Failed to preload hero image ${idx + 1}:`, slide.image_url);
                    return false;
                });
            }
            return Promise.resolve(false);
        });
        
        // Render slides immediately (don't wait for preload)
        slides.forEach((slide, idx) => {
            const slideDiv = document.createElement('div');
            slideDiv.className = `hero-slide ${idx === 0 ? 'active' : ''}`;
            slideDiv.setAttribute('data-slide-index', idx);
            
            if (slide.image_url) {
                // Optimize Cloudinary URL
                const optimizedUrl = optimizeCloudinaryUrl(slide.image_url, 1920, 1080, 'auto', 'auto');
                
                // Add loading placeholder
                const placeholder = document.createElement('div');
                placeholder.className = 'hero-slide-placeholder';
                placeholder.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1;
                `;
                placeholder.innerHTML = `
                    <div class="spinner" style="border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite;"></div>
                `;
                slideDiv.appendChild(placeholder);
                
                // Use img element for better loading control
                const img = document.createElement('img');
                img.src = optimizedUrl;
                img.alt = slide.title || `Hero slide ${idx + 1}`;
                img.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;opacity:0;transition:opacity 0.5s;';
                img.loading = idx === 0 ? 'eager' : 'lazy';
                img.onload = () => {
                    img.style.opacity = '1';
                    placeholder.style.display = 'none';
                    console.log(`✅ Hero image ${idx + 1} loaded`);
                };
                img.onerror = () => {
                    placeholder.style.display = 'none';
                    console.error(`❌ Failed to load hero image ${idx + 1}:`, optimizedUrl);
                };
                slideDiv.appendChild(img);
                
                // Also set as background for CSS compatibility
                slideDiv.style.backgroundImage = `url('${optimizedUrl}')`;
                slideDiv.style.backgroundSize = 'cover';
                slideDiv.style.backgroundPosition = 'center';
                slideDiv.style.backgroundRepeat = 'no-repeat';
            }
            
            slideDiv.style.cssText += `
                width: 100%;
                height: 100%;
                min-height: 500px;
                position: absolute;
                top: 0;
                left: 0;
                opacity: ${idx === 0 ? '1' : '0'};
                transition: opacity 0.8s ease-in-out;
                z-index: ${idx === 0 ? '2' : '1'};
                display: block;
            `;
            
            slider.appendChild(slideDiv);
            
            if (indicators) {
                const indicator = document.createElement('span');
                indicator.className = `hero-indicator ${idx === 0 ? 'active' : ''}`;
                indicator.setAttribute('data-slide', idx);
                indicator.style.cursor = 'pointer';
                indicator.setAttribute('aria-label', `Go to slide ${idx + 1}`);
                indicators.appendChild(indicator);
            }
        });
        
        console.log(`✅ Created ${slides.length} hero slide elements`);
        
        // Update hero content from first slide
        if (slides[0]) {
            if (slides[0].title) {
                const titleEl = document.querySelector('.hero-title');
                if (titleEl) titleEl.textContent = slides[0].title;
            }
            if (slides[0].subtitle) {
                const subtitleEl = document.querySelector('.hero-subtitle');
                if (subtitleEl) subtitleEl.textContent = slides[0].subtitle;
            }
        }
        
        // Store slides data globally for content updates
        window.heroSlidesData = slides;
        
        // Wait for images to preload, then dispatch event
        Promise.allSettled(imagePromises).then(() => {
            console.log('✅ All hero images preloaded, initializing slider...');
            // Dispatch event after images are ready
            setTimeout(() => {
                const event = new CustomEvent('heroSlidesRendered');
                window.dispatchEvent(event);
                console.log('📢 Dispatched heroSlidesRendered event');
            }, 50);
        });
        
        // Also dispatch immediately for faster initialization
        setTimeout(() => {
            if (!window.heroSliderInitialized) {
                const event = new CustomEvent('heroSlidesRendered');
                window.dispatchEvent(event);
            }
        }, 100);
    },
    
    /** Build HTML for one room card (slideshow, features) - shared by rooms and roomCategories */
    roomCardHtml: (room) => {
        const validImages = (room.images || []).filter(img => img.image_url && img.image_url.trim());
        const imagesHtml = validImages.length > 0 ? validImages.map((img, idx) => {
            const optimizedUrl = optimizeCloudinaryUrl(img.image_url, 800, 600, 'auto', 'auto');
            return `<div class="room-slide ${idx === 0 ? 'active' : ''}" data-slide-index="${idx}">
                <img src="${optimizedUrl}" alt="${(img.caption || room.name).replace(/"/g, '&quot;')}" class="room-slide-image" loading="${idx === 0 ? 'eager' : 'lazy'}">
            </div>`;
        }).join('') : `<div class="room-slide active" style="background:#f0f0f0;display:flex;align-items:center;justify-content:center;"><p style="color:#999;text-align:center;">No image available</p></div>`;
        const indicatorsHtml = validImages.length > 1 ? validImages.map((_, idx) =>
            `<span class="room-indicator ${idx === 0 ? 'active' : ''}" data-slide="${idx}"></span>`
        ).join('') : '';
        const featuresHtml = (room.features || []).map(f => `<li>✓ ${f}</li>`).join('');
        return `<div class="room-card">
            <div class="room-slider-container">
                <div class="room-slider" data-room="${room.slug}">${imagesHtml}</div>
                <button class="room-slider-btn room-prev-btn" data-room="${room.slug}">‹</button>
                <button class="room-slider-btn room-next-btn" data-room="${room.slug}">›</button>
                <div class="room-slider-indicators" data-room="${room.slug}">${indicatorsHtml}</div>
            </div>
            <div class="room-content">
                <h3 class="room-name">${room.name}</h3>
                ${room.capacity ? `<p class="room-capacity">Guest Capacity: ${room.capacity}</p>` : ''}
                ${room.description ? `<p class="room-description">${room.description}</p>` : ''}
                ${featuresHtml ? `<ul class="room-features">${featuresHtml}</ul>` : ''}
            </div>
        </div>`;
    },

    /** Render rooms into a specific container (for Rooms and Family Houses sections) */
    roomsInto: (container, rooms) => {
        if (!container || !rooms || rooms.length === 0) return;
        container.innerHTML = rooms.map(room => Render.roomCardHtml(room)).join('');
    },

    /** Render room categories: each category goes into its section by data-category-slug */
    roomCategories: (categories) => {
        if (!categories || categories.length === 0) return;
        const allRooms = [];
        categories.forEach(cat => {
            const section = document.querySelector(`[data-category-slug="${cat.slug}"]`);
            const grid = section ? section.querySelector('.rooms-grid') : null;
            if (section && grid) {
                if (cat.rooms && cat.rooms.length > 0) {
                    Render.roomsInto(grid, cat.rooms);
                    allRooms.push(...cat.rooms);
                    section.style.display = '';
                } else {
                    grid.innerHTML = '';
                    section.style.display = 'none';
                }
            }
        });
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('roomsRendered', { detail: { rooms: allRooms } }));
            if (typeof initializeRoomSlider === 'function') {
                allRooms.forEach(room => { if (room.slug) initializeRoomSlider(room.slug); });
            }
        }, 150);
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
    
    facilities: (facilities) => {
        const container = document.querySelector('.facilities-grid');
        if (!container) {
            console.warn('Facilities: No container found');
            return;
        }
        if (!facilities || facilities.length === 0) {
            console.warn('Facilities: No facilities data');
            return;
        }
        
        container.innerHTML = facilities.map(fac => `
            <div class="facility-item">
                ${fac.image_url ? `<div class="facility-image" style="background-image: url('${fac.image_url}'); background-size: cover; background-position: center;" loading="lazy"></div>` : ''}
                <h3>${fac.name}</h3>
                ${fac.description ? `<p>${fac.description}</p>` : ''}
            </div>
        `).join('');
        
        console.log(`✅ Rendered ${facilities.length} facilities`);
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
                <div class="activities-group" style="margin-bottom: 2rem; padding: 1.5rem; background: #fff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 class="activities-group-title" style="color: var(--primary-color); margin-bottom: 0.5rem;">${act.name}</h3>
                    ${act.description ? `<p style="color: var(--text-light); margin-top: 0.5rem; line-height: 1.6;">${act.description}</p>` : ''}
                    ${optimizedImageUrl ? `
                        <div style="margin-top: 1rem;">
                            <img src="${optimizedImageUrl}" 
                                 alt="${act.name}" 
                                 style="width:100%;max-width:500px;height:300px;object-fit:cover;border-radius:10px;display:block;margin:1rem auto;"
                                 loading="lazy"
                                 onerror="this.style.display='none';">
                        </div>
                    ` : ''}
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
    
    pricing: (pricing) => {
        console.log('🎨 Rendering pricing...', pricing?.length || 0);
        if (!pricing || pricing.length === 0) {
            console.warn('⚠️ Pricing: No pricing data');
            return;
        }
        
        pricing.forEach(category => {
            console.log(`  📦 Processing category: ${category.name} (${category.category_type}) with ${category.items?.length || 0} items`);
            if (category.category_type === 'accommodation') {
                let container = document.querySelector('.accommodation-grid-modern');
                if (!container) {
                    container = document.querySelector('.packages-section-modern .accommodation-grid-modern');
                }
                console.log('  🔍 Accommodation container found:', !!container);
                if (container) {
                    // Group items by name to handle multiple prices per accommodation
                    const grouped = {};
                    category.items.forEach(item => {
                        if (!grouped[item.name]) {
                            grouped[item.name] = [];
                        }
                        grouped[item.name].push(item);
                    });
                    
                    container.innerHTML = Object.entries(grouped).map(([name, items]) => {
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
                                            <span class="price-value-modern">${item.price_value}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }).join('');
                    console.log(`  ✅ Rendered ${Object.keys(grouped).length} accommodation items`);
                } else {
                    console.error('  ❌ Accommodation container not found!');
                }
            } else if (category.category_type === 'activity') {
                let container = document.querySelector('.activities-grid-modern');
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
                    console.log(`  📝 Rendering ${category.items.length} activity items`);
                    container.innerHTML = category.items.map(item => {
                        const isFree = (item.price_value || '').toLowerCase().includes('free');
                        return `
                            <div class="activity-card-modern ${isFree ? 'free-activity-modern' : ''}">
                                <h3 class="activity-name-modern">${item.name}</h3>
                                <p class="activity-duration-modern">${item.price_label || ''}</p>
                                <div class="activity-price-modern">${item.price_value || ''}</div>
                            </div>
                        `;
                    }).join('');
                    console.log(`  ✅ Rendered ${category.items.length} activity items`);
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
                            <div class="food-price-modern">${item.price_value || item.price_label}</div>
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
                <div class="food-price-modern">${item.price}</div>
            </div>
        `).join('');
        
        console.log(`✅ Rendered ${food.length} food items`);
    },
    
    reviews: (reviews) => {
        console.log('🎨 Rendering reviews...', reviews?.length || 0);
        const slider = document.querySelector('#reviewsSlider, .reviews-slider');
        const indicators = document.querySelector('#sliderIndicators, .slider-indicators');
        console.log('🔍 Reviews slider found:', !!slider);
        console.log('🔍 Reviews indicators found:', !!indicators);
        if (!slider) {
            console.error('❌ Reviews: No slider element found (#reviewsSlider or .reviews-slider)');
            return;
        }
        if (!reviews || reviews.length === 0) {
            console.warn('⚠️ Reviews: No reviews data');
            return;
        }
        
        // Preload all review images immediately
        console.log('📥 Preloading all review images...');
        const imagePromises = reviews.map((review, idx) => {
            if (review.image_url) {
                return preloadImage(review.image_url).then(() => {
                    console.log(`✅ Preloaded review image ${idx + 1}/${reviews.length}`);
                    return true;
                }).catch(() => {
                    console.warn(`⚠️ Failed to preload review image ${idx + 1}:`, review.image_url);
                    return false;
                });
            }
            return Promise.resolve(false);
        });
        
        // Render reviews immediately with proper structure
        slider.innerHTML = reviews.map((review, idx) => {
            // Optimize image URL
            const optimizedImageUrl = review.image_url ? optimizeCloudinaryUrl(review.image_url, 400, 400, 'auto', 'auto') : null;
            
            // Extract review data with fallbacks
            const rating = review.rating || 5;
            const stars = '★'.repeat(Math.min(rating, 5)) + '☆'.repeat(Math.max(0, 5 - rating));
            const quote = review.quote || 'Great experience at Kalongo Farm!';
            const customerName = review.customer_name || 'Happy Guest';
            
            return `
            <div class="review-slide ${idx === 0 ? 'active' : ''}" data-review-index="${idx}">
                <div class="review-content">
                    ${optimizedImageUrl ? `
                        <div class="review-image-container">
                            <div class="image-placeholder" style="display: flex; align-items: center; justify-content: center; background: #f0f0f0; border-radius: 15px; width: 100%; height: 100%; min-height: 300px;">
                                <div class="spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #4CAF50; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
                            </div>
                            <img src="${optimizedImageUrl}" 
                                 alt="${customerName}'s Review" 
                                 class="review-image" 
                                 loading="${idx === 0 ? 'eager' : 'lazy'}"
                                 style="display: block; width: 100%; height: 100%; object-fit: cover;"
                                 onload="console.log('✅ Review image ${idx + 1} loaded from Cloudinary:', '${optimizedImageUrl}'); if(this.previousElementSibling) this.previousElementSibling.style.display='none';"
                                 onerror="console.error('❌ Failed to load review image ${idx + 1} from Cloudinary:', '${optimizedImageUrl}'); if(this.previousElementSibling) this.previousElementSibling.style.display='none'; this.style.display='none';">
                        </div>
                    ` : ''}
                    <div class="review-text">
                        <div class="review-stars" aria-label="Rating: ${rating} out of 5 stars">${stars}</div>
                        <p class="review-quote">"${quote}"</p>
                        <h4 class="review-name">${customerName}</h4>
                    </div>
                </div>
            </div>
            `;
        }).join('');
        
        if (indicators) {
            indicators.innerHTML = reviews.map((_, idx) =>
                `<span class="indicator ${idx === 0 ? 'active' : ''}" data-slide="${idx}" aria-label="Go to review ${idx + 1}"></span>`
            ).join('');
        }
        
        console.log(`✅ Created ${reviews.length} review slide elements`);
        
        // Wait for images to preload, then dispatch event
        Promise.allSettled(imagePromises).then(() => {
            console.log('✅ All review images preloaded, initializing slider...');
            // Dispatch event after images are ready
            setTimeout(() => {
                const event = new CustomEvent('reviewsRendered', { detail: { reviews } });
                window.dispatchEvent(event);
                console.log('📢 Dispatched reviewsRendered event');
            }, 50);
        });
        
        // Also dispatch immediately for faster initialization
        setTimeout(() => {
            if (!window.reviewSliderInitialized) {
                const event = new CustomEvent('reviewsRendered', { detail: { reviews } });
                window.dispatchEvent(event);
            }
        }, 100);
    },
    
    restaurantMenu: (menu) => {
        if (!menu || menu.length === 0) {
            console.warn('Restaurant menu: No menu data');
            return;
        }
        
        // Find restaurant menu container
        const menuContainer = document.querySelector('.menu-container');
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
        
        const container = document.querySelector('.menu-container');
        if (!container) {
            console.warn('Restaurant menu: No container found');
            return;
        }
        
        // Clear and render all categories
        container.innerHTML = menu.map(category => `
            <div class="menu-category-modern">
                <h3 class="menu-category-title-modern">${category.name}</h3>
                <div class="menu-grid-modern">
                    ${category.items.map(item => `
                        <div class="menu-item-modern">
                            <span class="menu-item-name-modern">${item.name}</span>
                            <span class="menu-item-price-modern">${item.price}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        
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
            return `
            <div class="gallery-item-modern video-item-modern">
                <video class="gallery-media-modern" controls preload="metadata" loading="lazy">
                    <source src="${optimizedUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                ${v.caption ? `
                    <div class="gallery-overlay-modern">
                        <p class="gallery-caption-modern">${v.caption}</p>
                    </div>
                ` : ''}
            </div>
        `;
        }).join('');
    },
    
    
    settings: (settings) => {
        console.log('🎨 Rendering settings...', settings);
        
        // Update logo
        const logos = document.querySelectorAll('#logo, .logo');
        console.log('🔍 Found logo elements:', logos.length);
        if (logos.length > 0 && settings.logo_url) {
            logos.forEach(logo => {
                logo.src = settings.logo_url;
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
                if (li.textContent.includes('Email:')) {
                    li.textContent = `Email: ${settings.email || ''}`;
                }
            });
            console.log('✅ Updated footer contact info');
        }
        
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
            // Use combined endpoint for faster loading
            const homepageData = await API.getHomepageData();
            
            // Declare variables in outer scope
            let heroSlidesData, roomsData, facilitiesData, reviewsData;
            
            if (homepageData) {
                heroSlidesData = homepageData.hero_slides || [];
                roomsData = homepageData.rooms || [];
                const roomCategoriesData = homepageData.room_categories || [];
                facilitiesData = homepageData.facilities || [];
                reviewsData = homepageData.reviews || [];
                const homepageSettings = homepageData.settings || {};
                console.log('📊 Homepage data loaded (combined endpoint):', {
                    heroSlides: heroSlidesData.length,
                    rooms: roomsData.length,
                    room_categories: roomCategoriesData.length,
                    facilities: facilitiesData.length,
                    reviews: reviewsData.length,
                    settings: Object.keys(homepageSettings).length
                });
                
                // Render settings from combined endpoint
                if (homepageSettings && Object.keys(homepageSettings).length > 0) {
                    Render.settings(homepageSettings);
                }
            } else {
                // Fallback to individual endpoints if combined fails
                console.warn('⚠️ Combined endpoint failed, using individual endpoints...');
                const [heroSlides, rooms, facilities, reviews] = await Promise.all([
                    API.getHeroSlides(),
                    API.getRooms(),
                    API.getFacilities(),
                    API.getReviews(),
                ]);
                console.log('📊 Homepage data loaded (individual endpoints):', {
                    heroSlides: heroSlides?.length || 0,
                    rooms: rooms?.length || 0,
                    facilities: facilities?.length || 0,
                    reviews: reviews?.length || 0
                });
                
                heroSlidesData = heroSlides;
                roomsData = rooms;
                facilitiesData = facilities;
                reviewsData = reviews;
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
                
                if (roomCategoriesData && roomCategoriesData.length > 0) {
                    console.log('🏠 Calling Render.roomCategories()...');
                    renderPromises.push(Promise.resolve(Render.roomCategories(roomCategoriesData)));
                } else if (roomsData && roomsData.length > 0) {
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
                    console.warn('⚠️ No rooms or room categories to display');
                }
                
                if (facilitiesData && facilitiesData.length > 0) {
                    console.log('🏊 Calling Render.facilities()...');
                    renderPromises.push(Promise.resolve(Render.facilities(facilitiesData)));
                } else {
                    console.warn('⚠️ No facilities to display');
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
        try {
            const [pricing, food, menu] = await Promise.all([
                API.getPricing(),
                API.getFood(),
                API.getRestaurantMenu(),
            ]);
            console.log('📊 Packages data loaded:', {
                pricing: pricing?.length || 0,
                food: food?.length || 0,
                menu: menu?.length || 0
            });
            
            // Render with retry logic to ensure DOM is ready
            const renderPackages = () => {
                if (pricing && pricing.length > 0) {
                    console.log('📦 Calling Render.pricing()...');
                    Render.pricing(pricing);
                } else {
                    console.warn('⚠️ No pricing data to display');
                }
                
                if (food && food.length > 0) {
                    console.log('🍽️ Calling Render.food()...');
                    Render.food(food);
                } else {
                    console.warn('⚠️ No food items to display');
                }
                
                if (menu && menu.length > 0) {
                    console.log('🍴 Calling Render.restaurantMenu()...');
                    Render.restaurantMenu(menu);
                } else {
                    console.warn('⚠️ No restaurant menu to display');
                }
            };
            
            // Try immediately, then retry if needed
            if (document.readyState === 'complete') {
                setTimeout(renderPackages, 50);
            } else {
                setTimeout(renderPackages, 100);
                window.addEventListener('load', () => setTimeout(renderPackages, 50));
            }
        } catch (error) {
            console.error('❌ Error loading packages data:', error);
        }
        
        // Also render activities pricing if available
        if (pricing) {
            const actCategory = pricing.find(c => c.category_type === 'activity');
            if (actCategory) {
                const container = document.querySelector('.activities-grid-modern');
                if (container) {
                    container.innerHTML = actCategory.items.map(item => {
                        const isFree = item.price_value.toLowerCase().includes('free');
                        return `
                            <div class="activity-card-modern ${isFree ? 'free-activity-modern' : ''}">
                                <h3 class="activity-name-modern">${item.name}</h3>
                                <p class="activity-duration-modern">${item.price_label || ''}</p>
                                <div class="activity-price-modern">${item.price_value}</div>
                            </div>
                        `;
                    }).join('');
                }
            }
        }
    }
    
    if (path.includes('our-kalongo.html')) {
        console.log('🎥 Loading videos...');
        try {
            const videos = await API.getVideos();
            console.log('📊 Videos loaded:', videos?.length || 0);
            setTimeout(() => {
                // Always try to render videos (even if empty, to show message)
                console.log('🎥 Calling Render.videos()...');
                Render.videos(videos || []);
            }, 200);
        } catch (error) {
            console.error('❌ Error loading videos:', error);
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

// Mobile Menu Toggle with Modern UI
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');

// Create overlay element if it doesn't exist
let menuOverlay = document.querySelector('.nav-menu-overlay');
if (!menuOverlay && navMenu) {
    menuOverlay = document.createElement('div');
    menuOverlay.className = 'nav-menu-overlay';
    document.body.appendChild(menuOverlay);
}

function toggleMobileMenu() {
    if (navMenu && mobileMenuToggle) {
        navMenu.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
        if (menuOverlay) {
            menuOverlay.classList.toggle('active');
        }
        
        // Prevent body scroll when menu is open - modern way
        if (navMenu.classList.contains('active')) {
            // Get current scroll position
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
            // Store scroll position for restoration
            document.body.dataset.scrollY = scrollY;
        } else {
            // Restore scroll position
            const scrollY = document.body.dataset.scrollY || 0;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
            window.scrollTo(0, parseInt(scrollY || 0));
            delete document.body.dataset.scrollY;
        }
    }
}

function closeMobileMenu() {
    if (navMenu && mobileMenuToggle) {
        navMenu.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
        if (menuOverlay) {
            menuOverlay.classList.remove('active');
        }
        // Restore scroll position
        const scrollY = document.body.dataset.scrollY || 0;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, parseInt(scrollY || 0));
        delete document.body.dataset.scrollY;
    }
}

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
}

if (menuOverlay) {
    menuOverlay.addEventListener('click', closeMobileMenu);
}

// Close mobile menu when clicking on a link and handle navigation
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            setTimeout(closeMobileMenu, 200);
        }
        
        // Handle rooms navigation - ensure it goes to the rooms section
        const href = link.getAttribute('href');
        // Handle hash links for sections
        if (href && (href.includes('#rooms') || href === '/#rooms' || href === '#rooms')) {
            // If we're on a different page, navigate first
            if (window.location.pathname !== '/' && !window.location.pathname.endsWith('/') && !window.location.pathname.includes('index.html')) {
                window.location.href = '/#rooms';
                e.preventDefault();
                return;
            }
            // If we're on home page, scroll to rooms section
            setTimeout(() => {
                const roomsSection = document.getElementById('rooms');
                if (roomsSection) {
                    roomsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
        }
        
        if (href && (href.includes('#facilities') || href === '/#facilities' || href === '#facilities')) {
            if (window.location.pathname !== '/' && !window.location.pathname.endsWith('/') && !window.location.pathname.includes('index.html')) {
                window.location.href = '/#facilities';
                e.preventDefault();
                return;
            }
            setTimeout(() => {
                const facilitiesSection = document.getElementById('facilities');
                if (facilitiesSection) {
                    facilitiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
        }
    });
});

// Close menu on window resize if desktop
window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navMenu && navMenu.classList.contains('active')) {
        closeMobileMenu();
    }
});

// ===== Modern Swipe Slider System =====
// Reusable swipe/drag slider with auto-advance

function createSwipeSlider(sliderContainer, options = {}) {
    const {
        slideSelector = '.slide',
        autoAdvanceMs = 5000,
        transitionMs = 500,
        onSlideChange = null,
    } = options;
    
    if (!sliderContainer) return null;
    
    const slider = sliderContainer.querySelector('[class*="slider"]:not([class*="container"])') || sliderContainer;
    const slides = slider.querySelectorAll(slideSelector);
    if (slides.length === 0) return null;
    
    let currentIndex = 0;
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let autoAdvanceInterval = null;
    
    function updateSlider(animate = true) {
        if (!animate) slider.classList.add('dragging');
        slider.style.transform = `translateX(-${currentIndex * 100}%)`;
        if (!animate) {
            requestAnimationFrame(() => slider.classList.remove('dragging'));
        }
        if (onSlideChange) onSlideChange(currentIndex);
    }
    
    function goTo(index) {
        currentIndex = Math.max(0, Math.min(index, slides.length - 1));
        updateSlider();
    }
    
    function next() {
        currentIndex = (currentIndex + 1) % slides.length;
        updateSlider();
    }
    
    function prev() {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateSlider();
    }
    
    function startAutoAdvance() {
        stopAutoAdvance();
        if (slides.length > 1) {
            autoAdvanceInterval = setInterval(next, autoAdvanceMs);
        }
    }
    
    function stopAutoAdvance() {
        if (autoAdvanceInterval) {
            clearInterval(autoAdvanceInterval);
            autoAdvanceInterval = null;
        }
    }
    
    // Touch/mouse drag handlers
    function handleDragStart(e) {
        isDragging = true;
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        currentX = startX;
        slider.classList.add('dragging');
        stopAutoAdvance();
    }
    
    function handleDragMove(e) {
        if (!isDragging) return;
        currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        const diff = currentX - startX;
        const percent = (diff / sliderContainer.offsetWidth) * 100;
        slider.style.transform = `translateX(calc(-${currentIndex * 100}% + ${percent}%))`;
    }
    
    function handleDragEnd() {
        if (!isDragging) return;
        isDragging = false;
        slider.classList.remove('dragging');
        const diff = currentX - startX;
        const threshold = sliderContainer.offsetWidth * 0.15; // 15% swipe triggers change
        if (diff < -threshold) {
            next(); // Swipe left = next slide (loops)
        } else if (diff > threshold) {
            prev(); // Swipe right = prev slide (loops)
        } else {
            updateSlider(); // Snap back
        }
        startAutoAdvance();
    }
    
    // Bind events
    sliderContainer.addEventListener('mousedown', handleDragStart);
    sliderContainer.addEventListener('mousemove', handleDragMove);
    sliderContainer.addEventListener('mouseup', handleDragEnd);
    sliderContainer.addEventListener('mouseleave', handleDragEnd);
    sliderContainer.addEventListener('touchstart', handleDragStart, { passive: true });
    sliderContainer.addEventListener('touchmove', handleDragMove, { passive: true });
    sliderContainer.addEventListener('touchend', handleDragEnd);
    
    // Initialize
    updateSlider(false);
    startAutoAdvance();
    
    return { goTo, next, prev, startAutoAdvance, stopAutoAdvance, getCurrentIndex: () => currentIndex };
}

// Hero Slider - Modern Swipe
let heroSwipeSlider = null;

function initHeroSlider() {
    const heroSection = document.querySelector('.hero');
    const heroSlider = document.querySelector('.hero-slider');
    if (!heroSection || !heroSlider) return;
    
    const slides = heroSlider.querySelectorAll('.hero-slide');
    console.log('🔍 Hero slider initialization:', { slides: slides.length });
    
    if (slides.length === 0) {
        console.warn('⚠️ No hero slides found');
        return;
    }
    
    // Use swipe slider for hero
    heroSwipeSlider = createSwipeSlider(heroSection, {
        slideSelector: '.hero-slide',
        autoAdvanceMs: 6000,
        onSlideChange: (idx) => {
            const slideData = window.heroSlidesData?.[idx];
            if (slideData) {
                const titleEl = document.querySelector('.hero-title');
                const subtitleEl = document.querySelector('.hero-subtitle');
                if (slideData.title && titleEl) titleEl.textContent = slideData.title;
                if (slideData.subtitle && subtitleEl) subtitleEl.textContent = slideData.subtitle;
            }
        }
    });
    console.log('✅ Hero swipe slider initialized with', slides.length, 'slides');
}

// Legacy hero functions (kept for compatibility)
function showHeroSlide(index) { if (heroSwipeSlider) heroSwipeSlider.goTo(index); }
function nextHeroSlide() { if (heroSwipeSlider) heroSwipeSlider.next(); }
function startHeroSlider() { if (heroSwipeSlider) heroSwipeSlider.startAutoAdvance(); }

// Listen for hero slides being rendered by api.js
let heroSliderInitialized = false;
window.addEventListener('heroSlidesRendered', () => {
    if (heroSliderInitialized) {
        console.log('⚠️ Hero slider already initialized, skipping...');
        return;
    }
    console.log('📢 Received heroSlidesRendered event, initializing slider...');
    setTimeout(() => {
        initHeroSlider();
        heroSliderInitialized = true;
        window.heroSliderInitialized = true;
    }, 50);
});

// Listen for rooms being rendered
window.addEventListener('roomsRendered', (event) => {
    console.log('📢 Received roomsRendered event, initializing room sliders...');
    setTimeout(() => {
        const rooms = event.detail?.rooms || [];
        console.log(`🏠 Initializing ${rooms.length} room sliders...`);
        rooms.forEach(room => {
            if (room.slug) {
                initializeRoomSlider(room.slug);
            }
        });
    }, 200);
});

// Listen for reviews being rendered
let reviewSliderInitialized = false;
window.addEventListener('reviewsRendered', () => {
    if (reviewSliderInitialized) {
        console.log('⚠️ Review slider already initialized, skipping...');
        return;
    }
    console.log('📢 Received reviewsRendered event, initializing review slider...');
    setTimeout(() => {
        initReviewSlider();
        reviewSliderInitialized = true;
        window.reviewSliderInitialized = true;
    }, 100);
});

// Room Sliders - Modern Swipe
let roomSwipeSliders = {};

function initializeRoomSlider(roomName) {
    const sliderContainer = document.querySelector(`.room-slider-container[data-room="${roomName}"]`) 
        || document.querySelector(`.room-slider[data-room="${roomName}"]`)?.parentElement;
    
    if (!sliderContainer) {
        console.warn(`⚠️ Room slider container not found for: ${roomName}`);
        return;
    }
    
    const slider = sliderContainer.querySelector('.room-slider');
    if (!slider) return;
    
    const slides = slider.querySelectorAll('.room-slide');
    if (slides.length === 0) {
        console.warn(`⚠️ No slides found for room: ${roomName}`);
        return;
    }
    
    // Add data-room to container for styling
    sliderContainer.setAttribute('data-room', roomName);
    
    console.log(`✅ Initializing room swipe slider for ${roomName} with ${slides.length} slides`);
    
    roomSwipeSliders[roomName] = createSwipeSlider(sliderContainer, {
        slideSelector: '.room-slide',
        autoAdvanceMs: 4000
    });
}

// Initialize all room sliders on DOMContentLoaded (fallback)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const allRoomSliders = document.querySelectorAll('.room-slider');
        allRoomSliders.forEach(slider => {
            const roomName = slider.getAttribute('data-room');
            if (roomName && !roomSwipeSliders[roomName]) {
                initializeRoomSlider(roomName);
            }
        });
    }, 1000);
});

// Reviews Slider - Modern Swipe
let reviewSwipeSlider = null;

function initReviewSlider() {
    const sliderContainer = document.querySelector('.reviews-slider-container');
    if (!sliderContainer) {
        console.warn('⚠️ Reviews slider container not found');
        return;
    }
    
    const slider = sliderContainer.querySelector('.reviews-slider');
    if (!slider) return;
    
    const slides = slider.querySelectorAll('.review-slide');
    console.log('🔍 Review slider initialization:', { slides: slides.length });
    
    if (slides.length === 0) {
        console.warn('⚠️ No review slides found');
        return;
    }
    
    reviewSwipeSlider = createSwipeSlider(sliderContainer, {
        slideSelector: '.review-slide',
        autoAdvanceMs: 5000
    });
    console.log('✅ Review swipe slider initialized with', slides.length, 'slides');
}

// Legacy review functions (kept for compatibility)
function showReviewSlide(index) { if (reviewSwipeSlider) reviewSwipeSlider.goTo(index); }
function nextReviewSlide() { if (reviewSwipeSlider) reviewSwipeSlider.next(); }
function prevReviewSlide() { if (reviewSwipeSlider) reviewSwipeSlider.prev(); }
function startReviewSlider() { if (reviewSwipeSlider) reviewSwipeSlider.startAutoAdvance(); }

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Auto-fill from chatbot if applicable
    if (window.location.pathname.includes('booking.html')) {
        autoFillFromChatbot();
    }
    // Reviews slider initialization is handled by reviewsRendered event
});

// Set minimum date for check-in and check-out inputs
const today = new Date().toISOString().split('T')[0];
const checkInInput = document.getElementById('checkIn');
const checkOutInput = document.getElementById('checkOut');

if (checkInInput) {
    checkInInput.setAttribute('min', today);
    checkInInput.addEventListener('change', () => {
        if (checkOutInput && checkInInput.value) {
            const checkInDate = new Date(checkInInput.value);
            checkInDate.setDate(checkInDate.getDate() + 1);
            checkOutInput.setAttribute('min', checkInDate.toISOString().split('T')[0]);
        }
    });
}

// Booking Form WhatsApp Submission
// Hotel WhatsApp Number
const HOTEL_WHATSAPP_NUMBER = '+255 653 626 410';

// WhatsApp Modal Function
function showWhatsAppModal(whatsappURL) {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'whatsapp-modal-overlay';
    modalOverlay.innerHTML = `
        <div class="whatsapp-modal">
            <div class="whatsapp-modal-header">
                <h3>📱 Redirecting to WhatsApp</h3>
                <button class="whatsapp-modal-close" onclick="closeWhatsAppModal()">&times;</button>
            </div>
            <div class="whatsapp-modal-body">
                <div class="whatsapp-icon-large">💬</div>
                <p class="whatsapp-modal-message">
                    Your booking details have been prepared! We're redirecting you to WhatsApp to send your booking request to KALONGO FARM.
                </p>
                <p class="whatsapp-modal-note">
                    Please review the message and send it to confirm your booking.
                </p>
                <div class="whatsapp-modal-actions">
                    <a href="${whatsappURL}" target="_blank" class="btn-primary whatsapp-modal-btn" onclick="closeWhatsAppModal()">
                        Open WhatsApp
                    </a>
                    <button class="btn-secondary whatsapp-modal-btn" onclick="copyWhatsAppLink('${whatsappURL}')">
                        Copy Link
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    document.body.style.overflow = 'hidden';
    
    // Auto-redirect after 2 seconds
    setTimeout(() => {
        const whatsappWindow = window.open(whatsappURL, '_blank');
        if (!whatsappWindow || whatsappWindow.closed || typeof whatsappWindow.closed === 'undefined') {
            // Popup blocked, user can click button
        } else {
            closeWhatsAppModal();
        }
    }, 2000);
}

function closeWhatsAppModal() {
    const modal = document.querySelector('.whatsapp-modal-overlay');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    }
}

function copyWhatsAppLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        btn.style.background = 'var(--primary-color)';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    }).catch(() => {
        alert('Please copy this link manually:\n\n' + url);
    });
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('whatsapp-modal-overlay')) {
        closeWhatsAppModal();
    }
});

// Auto-fill form from chatbot
function autoFillFromChatbot() {
    if (localStorage.getItem('fromChatbot') === 'true') {
        // Get booking data
        const bookingData = JSON.parse(localStorage.getItem('chatbotBookingData') || '{}');
        const packageData = JSON.parse(localStorage.getItem('chatbotPackageData') || '{}');
        
        // Fill guests
        if (bookingData.guests) {
            const guestsInput = document.getElementById('guests');
            if (guestsInput) guestsInput.value = bookingData.guests;
        } else if (packageData.groupSize) {
            const guestsInput = document.getElementById('guests');
            if (guestsInput) guestsInput.value = packageData.groupSize;
        }
        
        // Fill room type
        if (bookingData.roomType) {
            const roomTypeSelect = document.getElementById('roomType');
            if (roomTypeSelect) {
                const options = Array.from(roomTypeSelect.options);
                const matchingOption = options.find(opt => opt.text.includes(bookingData.roomType));
                if (matchingOption) roomTypeSelect.value = matchingOption.value;
            }
        }
        
        // Fill package
        if (packageData.package) {
            const packageSelect = document.getElementById('package');
            if (packageSelect) {
                const options = Array.from(packageSelect.options);
                const matchingOption = options.find(opt => opt.text.includes(packageData.package));
                if (matchingOption) packageSelect.value = matchingOption.value;
            }
        }
        
        // Add message about chatbot recommendation
        const messageTextarea = document.getElementById('message');
        if (messageTextarea) {
            let message = 'Booking from chatbot recommendation.\n';
            if (bookingData.roomType) {
                message += `Recommended room: ${bookingData.roomType}\n`;
            }
            if (packageData.package) {
                message += `Recommended package: ${packageData.package}\n`;
            }
            if (bookingData.stayPeriod) {
                message += `Stay period: ${bookingData.stayPeriod}\n`;
            }
            messageTextarea.value = message;
        }
        
        // Clear localStorage after auto-fill
        localStorage.removeItem('fromChatbot');
        localStorage.removeItem('chatbotBookingData');
        localStorage.removeItem('chatbotPackageData');
        
        // Scroll to form
        const form = document.getElementById('bookingForm');
        if (form) {
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

const bookingForm = document.getElementById('bookingForm');

if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form values
        const guestsEl = document.getElementById('guests');
        const totalGuests = Math.max(0, parseInt(guestsEl?.value || 0, 10)) || 0;
        const costRoomType = document.getElementById('costRoomType')?.textContent || '—';
        const costNights = document.getElementById('costNights')?.textContent || '0';
        const costPerNight = document.getElementById('costPerNight')?.textContent || '—';
        const costTotal = document.getElementById('costTotal')?.textContent || '—';
        const currencySelect = document.getElementById('currencySelect');
        const currencyLabel = currencySelect ? currencySelect.options[currencySelect.selectedIndex]?.text : 'TZS';
        
        const formData = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            roomType: document.getElementById('roomType').value,
            checkIn: document.getElementById('checkIn').value,
            checkOut: document.getElementById('checkOut').value,
            totalGuests,
            eventCategory: document.getElementById('eventCategory') ? document.getElementById('eventCategory').value || 'None' : 'None',
            eventDate: document.getElementById('eventDate') ? document.getElementById('eventDate').value || 'None' : 'None',
            message: document.getElementById('message').value || 'None',
            costRoomType,
            costNights,
            costPerNight,
            costTotal,
            currencyLabel
        };

        // Create booking message - well formatted with price summary
        const bookingMessage = `NEW BOOKING REQUEST - KALONGO FARM


GUEST DETAILS

Full Name: ${formData.fullName}
Email Address: ${formData.email}
Phone Number: ${formData.phone}


BOOKING DETAILS

Room Type: ${formData.roomType}
Check-in Date: ${formData.checkIn}
Check-out Date: ${formData.checkOut}
Number of Guests: ${formData.totalGuests}


COST SUMMARY

Room Type: ${formData.costRoomType}
Nights: ${formData.costNights}
Price per Night: ${formData.costPerNight}
Total Amount: ${formData.costTotal} (${formData.currencyLabel})


EVENT INFORMATION

Event Category: ${formData.eventCategory}
Event Date: ${formData.eventDate}


ADDITIONAL MESSAGE

${formData.message}


This booking was submitted through the KALONGO FARM website`;

        // Encode message for URL
        const encodedMessage = encodeURIComponent(bookingMessage);
        
        // Create WhatsApp URL with hotel number (keep + sign, only remove spaces)
        const whatsappNumber = HOTEL_WHATSAPP_NUMBER.replace(/\s+/g, '');
        const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        
        console.log('📱 Opening WhatsApp with URL:', whatsappURL);
        console.log('📱 WhatsApp Number:', whatsappNumber);
        console.log('📱 Message length:', bookingMessage.length);
        
        // Directly open WhatsApp without any messages
        try {
            window.open(whatsappURL, '_blank');
            // Silently reset form after a brief delay
            setTimeout(() => {
                bookingForm.reset();
            }, 500);
        } catch (error) {
            // Silent fallback - just navigate directly
            window.location.href = whatsappURL;
        }
        
        // Silently reset form after brief delay
        setTimeout(() => {
            bookingForm.reset();
        }, 500);
    });
}

// Clean URLs - remove index.html from URL
function cleanURL() {
    if (window.location.pathname.includes('index.html')) {
        const cleanPath = window.location.pathname.replace(/index\.html$/, '') || '/';
        const hash = window.location.hash;
        const search = window.location.search;
        const cleanURL = cleanPath + hash + search;
        window.history.replaceState({}, '', cleanURL);
    }
}

// Run on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanURL);
} else {
    cleanURL();
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        const target = document.querySelector(href);
        if (target) {
            const headerOffset = 100;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            
            // Clean URL after scroll
            setTimeout(() => {
                window.history.replaceState({}, '', href);
            }, 100);
        }
    });
});

// Add scroll effect to header
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.15)';
    } else {
        header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    }
});

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.room-card, .package-card, .facility-item');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

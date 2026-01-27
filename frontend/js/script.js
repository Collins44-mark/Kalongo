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
        if (href && (href.includes('#rooms') || href === 'index.html#rooms')) {
            // If we're on a different page, navigate first
            if (window.location.pathname !== '/index.html' && window.location.pathname !== '/' && !window.location.pathname.endsWith('index.html')) {
                window.location.href = 'index.html#rooms';
                e.preventDefault();
                return;
            }
            // If we're on index.html, scroll to rooms section
            setTimeout(() => {
                const roomsSection = document.getElementById('rooms');
                if (roomsSection) {
                    roomsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

// Hero Slider Functionality
let currentHeroSlide = 0;
let heroSlides = [];
let heroIndicators = [];
let totalHeroSlides = 0;
let heroSlideInterval;

// Function to initialize hero slider (called after slides are loaded)
function initHeroSlider() {
    heroSlides = document.querySelectorAll('.hero-slide');
    heroIndicators = document.querySelectorAll('.hero-indicator');
    totalHeroSlides = heroSlides.length;
    
    console.log('🔍 Hero slider initialization:', {
        slides: heroSlides.length,
        indicators: heroIndicators.length,
        totalHeroSlides
    });
    
    if (totalHeroSlides > 0) {
        // Ensure first slide is active
        showHeroSlide(0);
        console.log('✅ Hero slider initialized with', totalHeroSlides, 'slides');
        
        // Set up indicator click handlers
        heroIndicators.forEach((indicator, index) => {
            // Remove existing listeners to avoid duplicates
            const newIndicator = indicator.cloneNode(true);
            indicator.parentNode.replaceChild(newIndicator, indicator);
            
            newIndicator.addEventListener('click', () => {
                if (heroSlideInterval) {
                    clearInterval(heroSlideInterval);
                }
                showHeroSlide(index);
                startHeroSlider();
            });
        });
        
        // Update heroIndicators array
        heroIndicators = document.querySelectorAll('.hero-indicator');
        
        startHeroSlider();
    } else {
        console.warn('⚠️ No hero slides found for slider');
    }
}

function showHeroSlide(index) {
    // Refresh slides and indicators in case DOM changed
    heroSlides = document.querySelectorAll('.hero-slide');
    heroIndicators = document.querySelectorAll('.hero-indicator');
    totalHeroSlides = heroSlides.length;
    
    if (!heroSlides || heroSlides.length === 0) {
        console.warn('No hero slides available');
        return;
    }
    
    // Ensure index is valid
    if (index < 0) index = totalHeroSlides - 1;
    if (index >= totalHeroSlides) index = 0;
    
    console.log(`🎬 Showing hero slide ${index + 1} of ${totalHeroSlides}`);
    
    // Remove active class from all slides and set opacity
    heroSlides.forEach((slide, idx) => {
        slide.classList.remove('active');
        if (idx === index) {
            slide.style.opacity = '1';
            slide.style.zIndex = '2';
            slide.classList.add('active');
        } else {
            slide.style.opacity = '0';
            slide.style.zIndex = '1';
        }
    });
    
    // Remove active class from all indicators
    heroIndicators.forEach(indicator => indicator.classList.remove('active'));
    
    // Add active class to current indicator
    if (heroIndicators[index]) {
        heroIndicators[index].classList.add('active');
    }
    
    currentHeroSlide = index;
    
    // Update hero content if available
    const slideData = window.heroSlidesData?.[index];
    if (slideData) {
        const titleEl = document.querySelector('.hero-title');
        const subtitleEl = document.querySelector('.hero-subtitle');
        if (slideData.title && titleEl) titleEl.textContent = slideData.title;
        if (slideData.subtitle && subtitleEl) subtitleEl.textContent = slideData.subtitle;
    }
}

function nextHeroSlide() {
    const next = (currentHeroSlide + 1) % totalHeroSlides;
    showHeroSlide(next);
}

function startHeroSlider() {
    if (totalHeroSlides > 0) {
        // Clear any existing interval
        if (heroSlideInterval) {
            clearInterval(heroSlideInterval);
        }
        // Start auto-advance every 5 seconds
        heroSlideInterval = setInterval(() => {
            nextHeroSlide();
        }, 5000);
        console.log(`✅ Hero slider started (${totalHeroSlides} slides, 5s interval)`);
    }
}

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
        
        // Set up navigation buttons
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (reviewSlideInterval) {
                    clearInterval(reviewSlideInterval);
                }
                prevReviewSlide();
                startReviewSlider();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (reviewSlideInterval) {
                    clearInterval(reviewSlideInterval);
                }
                nextReviewSlide();
                startReviewSlider();
            });
        }
        
        // Set up indicator click handlers
        reviewIndicators = document.querySelectorAll('.indicator, .slider-indicators .indicator, #sliderIndicators .indicator');
        reviewIndicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                if (reviewSlideInterval) {
                    clearInterval(reviewSlideInterval);
                }
                showReviewSlide(index);
                startReviewSlider();
            });
        });
    }, 100);
});

// Room Sliders Functionality - Each room has independent slider
let currentRoomSlides = {};
let roomSlideIntervals = {};

function initializeRoomSlider(roomName) {
    const slider = document.querySelector(`.room-slider[data-room="${roomName}"]`);
    if (!slider) {
        console.warn(`⚠️ Room slider not found for: ${roomName}`);
        return;
    }
    
    const slides = slider.querySelectorAll('.room-slide');
    const indicators = document.querySelectorAll(`.room-slider-indicators[data-room="${roomName}"] .room-indicator`);
    const prevBtn = document.querySelector(`.room-prev-btn[data-room="${roomName}"]`);
    const nextBtn = document.querySelector(`.room-next-btn[data-room="${roomName}"]`);
    
    if (slides.length === 0) {
        console.warn(`⚠️ No slides found for room: ${roomName}`);
        return;
    }
    
    console.log(`✅ Initializing room slider for ${roomName} with ${slides.length} slides`);
    
    currentRoomSlides[roomName] = 0;
    
    // Function to show specific slide for this room only
    function showRoomSlide(room, index) {
        const roomSlider = document.querySelector(`.room-slider[data-room="${room}"]`);
        if (!roomSlider) return;
        
        const roomSlides = roomSlider.querySelectorAll('.room-slide');
        const roomIndicators = document.querySelectorAll(`.room-slider-indicators[data-room="${room}"] .room-indicator`);
        
        if (roomSlides.length === 0) return;
        
        // Ensure index is valid
        if (index < 0) index = roomSlides.length - 1;
        if (index >= roomSlides.length) index = 0;
        
        // Remove active from all slides and indicators for this room
        roomSlides.forEach(slide => slide.classList.remove('active'));
        roomIndicators.forEach(indicator => indicator.classList.remove('active'));
        
        // Activate the selected slide and indicator
        if (roomSlides[index]) {
            roomSlides[index].classList.add('active');
        }
        if (roomIndicators[index]) {
            roomIndicators[index].classList.add('active');
        }
        
        currentRoomSlides[room] = index;
        console.log(`🎬 Room ${room}: Showing slide ${index + 1} of ${roomSlides.length}`);
    }
    
    // Function to go to next slide for this room only
    function nextRoomSlide(room) {
        const roomSlider = document.querySelector(`.room-slider[data-room="${room}"]`);
        if (!roomSlider) return;
        const slides = roomSlider.querySelectorAll('.room-slide');
        if (slides.length === 0) return;
        const current = currentRoomSlides[room] || 0;
        const next = (current + 1) % slides.length;
        showRoomSlide(room, next);
    }
    
    // Function to go to previous slide for this room only
    function prevRoomSlide(room) {
        const roomSlider = document.querySelector(`.room-slider[data-room="${room}"]`);
        if (!roomSlider) return;
        const slides = roomSlider.querySelectorAll('.room-slide');
        if (slides.length === 0) return;
        const current = currentRoomSlides[room] || 0;
        const prev = (current - 1 + slides.length) % slides.length;
        showRoomSlide(room, prev);
    }
    
    // Start auto-advance for this specific room
    function startRoomSlider(room) {
        // Clear any existing interval for this room
        if (roomSlideIntervals[room]) {
            clearInterval(roomSlideIntervals[room]);
        }
        
        // Only auto-advance if there's more than one slide
        const roomSlider = document.querySelector(`.room-slider[data-room="${room}"]`);
        if (roomSlider) {
            const slides = roomSlider.querySelectorAll('.room-slide');
            if (slides.length > 1) {
                roomSlideIntervals[room] = setInterval(() => {
                    nextRoomSlide(room);
                }, 4000);
                console.log(`✅ Auto-advance started for room: ${room}`);
            }
        }
    }
    
    // Button handlers - only for this specific room
    if (prevBtn) {
        // Remove existing listeners
        const newPrevBtn = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        
        newPrevBtn.addEventListener('click', () => {
            prevRoomSlide(roomName);
            // Restart auto-advance
            if (roomSlideIntervals[roomName]) {
                clearInterval(roomSlideIntervals[roomName]);
            }
            startRoomSlider(roomName);
        });
    }
    
    if (nextBtn) {
        // Remove existing listeners
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        
        newNextBtn.addEventListener('click', () => {
            nextRoomSlide(roomName);
            // Restart auto-advance
            if (roomSlideIntervals[roomName]) {
                clearInterval(roomSlideIntervals[roomName]);
            }
            startRoomSlider(roomName);
        });
    }
    
    // Indicator handlers - only for this specific room
    indicators.forEach((indicator, index) => {
        // Remove existing listeners
        const newIndicator = indicator.cloneNode(true);
        indicator.parentNode.replaceChild(newIndicator, indicator);
        
        newIndicator.addEventListener('click', () => {
            showRoomSlide(roomName, index);
            // Restart auto-advance
            if (roomSlideIntervals[roomName]) {
                clearInterval(roomSlideIntervals[roomName]);
            }
            startRoomSlider(roomName);
        });
    });
    
    // Initialize first slide and start auto-advance
    showRoomSlide(roomName, 0);
    startRoomSlider(roomName);
}

// Initialize all room sliders and start synchronized animation
document.addEventListener('DOMContentLoaded', () => {
    // Initialize hero slider
    if (totalHeroSlides > 0) {
        showHeroSlide(0);
        startHeroSlider();
        
        // Hero indicator handlers
        heroIndicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                clearInterval(heroSlideInterval);
                showHeroSlide(index);
                startHeroSlider();
            });
        });
    }
    
    // Initialize room sliders if they exist (fallback - main initialization happens via event)
    setTimeout(() => {
        const allRoomSliders = document.querySelectorAll('.room-slider');
        allRoomSliders.forEach(slider => {
            const roomName = slider.getAttribute('data-room');
            if (roomName && !currentRoomSlides[roomName]) {
                initializeRoomSlider(roomName);
            }
        });
    }, 1000);
});

// Reviews Slider Functionality
let currentReviewSlide = 0;
let reviewSlides = [];
let reviewIndicators = [];
let totalReviewSlides = 0;
let reviewSlideInterval;

function initReviewSlider() {
    reviewSlides = document.querySelectorAll('.review-slide');
    reviewIndicators = document.querySelectorAll('.indicator, .slider-indicators .indicator, #sliderIndicators .indicator');
    totalReviewSlides = reviewSlides.length;
    
    console.log('🔍 Review slider initialization:', {
        slides: reviewSlides.length,
        indicators: reviewIndicators.length,
        totalReviewSlides
    });
    
    if (totalReviewSlides > 0) {
        // Ensure first slide is active
        showReviewSlide(0);
        console.log('✅ Review slider initialized with', totalReviewSlides, 'slides');
        startReviewSlider();
    } else {
        console.warn('⚠️ No review slides found for slider');
    }
}

function showReviewSlide(index) {
    // Refresh slides and indicators in case DOM changed
    reviewSlides = document.querySelectorAll('.review-slide');
    reviewIndicators = document.querySelectorAll('.indicator, .slider-indicators .indicator, #sliderIndicators .indicator');
    totalReviewSlides = reviewSlides.length;
    
    if (!reviewSlides || reviewSlides.length === 0) {
        console.warn('No review slides available');
        return;
    }
    
    // Ensure index is valid
    if (index < 0) index = totalReviewSlides - 1;
    if (index >= totalReviewSlides) index = 0;
    
    console.log(`🎬 Showing review slide ${index + 1} of ${totalReviewSlides}`);
    
    // Determine slide direction for smooth horizontal animation
    const currentActiveIndex = Array.from(reviewSlides).findIndex(slide => slide.classList.contains('active'));
    const direction = index > currentActiveIndex ? 'next' : 'prev';
    
    // Remove all classes from slides
    reviewSlides.forEach(slide => {
        slide.classList.remove('active', 'prev', 'next');
    });
    
    // Add direction classes for smooth animation
    if (currentActiveIndex >= 0 && currentActiveIndex !== index) {
        reviewSlides[currentActiveIndex].classList.add(direction === 'next' ? 'prev' : 'next');
    }
    
    // Show new slide with proper direction
    if (reviewSlides[index]) {
        reviewSlides[index].classList.add('active');
        // Small delay to ensure smooth transition
        setTimeout(() => {
            reviewSlides[index].style.opacity = '1';
            reviewSlides[index].style.transform = 'translateX(0)';
        }, 10);
    }
    
    // Update indicators
    reviewIndicators.forEach(indicator => indicator.classList.remove('active'));
    if (reviewIndicators[index]) {
        reviewIndicators[index].classList.add('active');
    }
    
    currentReviewSlide = index;
}

function nextReviewSlide() {
    const next = (currentReviewSlide + 1) % totalReviewSlides;
    showReviewSlide(next);
}

function prevReviewSlide() {
    const prev = (currentReviewSlide - 1 + totalReviewSlides) % totalReviewSlides;
    showReviewSlide(prev);
}

function startReviewSlider() {
    // Refresh slides count
    reviewSlides = document.querySelectorAll('.review-slide');
    totalReviewSlides = reviewSlides.length;
    
    if (totalReviewSlides > 0) {
        if (reviewSlideInterval) {
            clearInterval(reviewSlideInterval);
        }
        // Only auto-advance if there's more than one review
        if (totalReviewSlides > 1) {
            reviewSlideInterval = setInterval(() => {
                nextReviewSlide();
            }, 5000);
            console.log(`✅ Review slider started (${totalReviewSlides} slides, 5s interval)`);
        } else {
            console.log(`✅ Review slider: Only 1 review, no auto-advance needed`);
        }
    }
}

function nextSlide() {
    const next = (currentSlide + 1) % totalSlides;
    showSlide(next);
}

function prevSlide() {
    const prev = (currentSlide - 1 + totalSlides) % totalSlides;
    showSlide(prev);
}

function startSlider() {
    // Auto-advance slider every 5 seconds
    slideInterval = setInterval(nextSlide, 5000);
}

function stopSlider() {
    clearInterval(slideInterval);
}

// Initialize slider when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Auto-fill from chatbot if applicable
    if (window.location.pathname.includes('booking.html')) {
        autoFillFromChatbot();
    }
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const sliderContainer = document.querySelector('.reviews-slider-container');
    
    if (prevBtn && nextBtn && slides.length > 0) {
        // Button click handlers
        prevBtn.addEventListener('click', () => {
            stopSlider();
            prevSlide();
            startSlider();
        });
        
        nextBtn.addEventListener('click', () => {
            stopSlider();
            nextSlide();
            startSlider();
        });
        
        // Indicator click handlers
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                stopSlider();
                showSlide(index);
                startSlider();
            });
        });
        
        // Pause slider on hover
        if (sliderContainer) {
            sliderContainer.addEventListener('mouseenter', stopSlider);
            sliderContainer.addEventListener('mouseleave', startSlider);
        }
        
        // Start auto-slide
        startSlider();
        
        // Initialize first slide
        showSlide(0);
    }
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
        const formData = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            roomType: document.getElementById('roomType').value,
            checkIn: document.getElementById('checkIn').value,
            checkOut: document.getElementById('checkOut').value,
            guests: document.getElementById('guests').value,
            package: document.getElementById('package').value || 'None',
            eventCategory: document.getElementById('eventCategory') ? document.getElementById('eventCategory').value || 'None' : 'None',
            eventDate: document.getElementById('eventDate') ? document.getElementById('eventDate').value || 'None' : 'None',
            message: document.getElementById('message').value || 'None'
        };

        // Create booking message - well formatted and classic
        const bookingMessage = `NEW BOOKING REQUEST - KALONGO FARM


GUEST DETAILS

Full Name: ${formData.fullName}
Email Address: ${formData.email}
Phone Number: ${formData.phone}


BOOKING DETAILS

Room Type: ${formData.roomType}
Check-in Date: ${formData.checkIn}
Check-out Date: ${formData.checkOut}
Number of Guests: ${formData.guests}
Package: ${formData.package}


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

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 100;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
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

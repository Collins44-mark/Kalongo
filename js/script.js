// Mobile Menu Toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking on a link
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// Hero Slider Functionality
let currentHeroSlide = 0;
const heroSlides = document.querySelectorAll('.hero-slide');
const heroIndicators = document.querySelectorAll('.hero-indicator');
const totalHeroSlides = heroSlides.length;
let heroSlideInterval;

function showHeroSlide(index) {
    heroSlides.forEach(slide => slide.classList.remove('active'));
    heroIndicators.forEach(indicator => indicator.classList.remove('active'));
    
    if (heroSlides[index]) {
        heroSlides[index].classList.add('active');
    }
    if (heroIndicators[index]) {
        heroIndicators[index].classList.add('active');
    }
    
    currentHeroSlide = index;
}

function nextHeroSlide() {
    const next = (currentHeroSlide + 1) % totalHeroSlides;
    showHeroSlide(next);
}

function startHeroSlider() {
    if (totalHeroSlides > 0) {
        heroSlideInterval = setInterval(nextHeroSlide, 5000);
    }
}

// Room Sliders Functionality (Synchronized)
let currentRoomSlides = {};
let roomSlideIntervals = {};

function initializeRoomSlider(roomName) {
    const slider = document.querySelector(`.room-slider[data-room="${roomName}"]`);
    if (!slider) return;
    
    const slides = slider.querySelectorAll('.room-slide');
    const indicators = document.querySelectorAll(`.room-slider-indicators[data-room="${roomName}"] .room-indicator`);
    const prevBtn = document.querySelector(`.room-prev-btn[data-room="${roomName}"]`);
    const nextBtn = document.querySelector(`.room-next-btn[data-room="${roomName}"]`);
    
    if (slides.length === 0) return;
    
    currentRoomSlides[roomName] = 0;
    
    function showRoomSlide(room, index) {
        const roomSlider = document.querySelector(`.room-slider[data-room="${room}"]`);
        if (!roomSlider) return;
        
        const roomSlides = roomSlider.querySelectorAll('.room-slide');
        const roomIndicators = document.querySelectorAll(`.room-slider-indicators[data-room="${room}"] .room-indicator`);
        
        roomSlides.forEach(slide => slide.classList.remove('active'));
        roomIndicators.forEach(indicator => indicator.classList.remove('active'));
        
        if (roomSlides[index]) {
            roomSlides[index].classList.add('active');
        }
        if (roomIndicators[index]) {
            roomIndicators[index].classList.add('active');
        }
        
        currentRoomSlides[room] = index;
    }
    
    function nextRoomSlide(room) {
        const roomSlider = document.querySelector(`.room-slider[data-room="${room}"]`);
        if (!roomSlider) return;
        const slides = roomSlider.querySelectorAll('.room-slide');
        const next = (currentRoomSlides[room] + 1) % slides.length;
        showRoomSlide(room, next);
    }
    
    function prevRoomSlide(room) {
        const roomSlider = document.querySelector(`.room-slider[data-room="${room}"]`);
        if (!roomSlider) return;
        const slides = roomSlider.querySelectorAll('.room-slide');
        const prev = (currentRoomSlides[room] - 1 + slides.length) % slides.length;
        showRoomSlide(room, prev);
    }
    
    // Synchronized auto-advance for all room sliders
    function startSynchronizedRoomSliders() {
        const allRooms = ['a-cabin', 'cottage', 'kikota'];
        if (roomSlideIntervals['synchronized']) {
            clearInterval(roomSlideIntervals['synchronized']);
        }
        roomSlideIntervals['synchronized'] = setInterval(() => {
            allRooms.forEach(room => {
                nextRoomSlide(room);
            });
        }, 4000);
    }
    
    // Button handlers
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const allRooms = ['a-cabin', 'cottage', 'kikota'];
            allRooms.forEach(room => {
                prevRoomSlide(room);
            });
            if (roomSlideIntervals['synchronized']) {
                clearInterval(roomSlideIntervals['synchronized']);
            }
            startSynchronizedRoomSliders();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const allRooms = ['a-cabin', 'cottage', 'kikota'];
            allRooms.forEach(room => {
                nextRoomSlide(room);
            });
            if (roomSlideIntervals['synchronized']) {
                clearInterval(roomSlideIntervals['synchronized']);
            }
            startSynchronizedRoomSliders();
        });
    }
    
    // Indicator handlers
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            const allRooms = ['a-cabin', 'cottage', 'kikota'];
            allRooms.forEach(room => {
                showRoomSlide(room, index);
            });
            if (roomSlideIntervals['synchronized']) {
                clearInterval(roomSlideIntervals['synchronized']);
            }
            startSynchronizedRoomSliders();
        });
    });
    
    // Initialize first slide
    showRoomSlide(roomName, 0);
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
    
    // Initialize room sliders
    const roomNames = ['a-cabin', 'cottage', 'kikota'];
    roomNames.forEach(roomName => {
        initializeRoomSlider(roomName);
    });
    
    // Start synchronized room sliders
    if (roomNames.length > 0) {
        setTimeout(() => {
            const allRooms = ['a-cabin', 'cottage', 'kikota'];
            function startSynchronizedRoomSliders() {
                if (roomSlideIntervals['synchronized']) {
                    clearInterval(roomSlideIntervals['synchronized']);
                }
                roomSlideIntervals['synchronized'] = setInterval(() => {
                    allRooms.forEach(room => {
                        const roomSlider = document.querySelector(`.room-slider[data-room="${room}"]`);
                        if (!roomSlider) return;
                        const slides = roomSlider.querySelectorAll('.room-slide');
                        const next = (currentRoomSlides[room] + 1) % slides.length;
                        const roomSlides = roomSlider.querySelectorAll('.room-slide');
                        const roomIndicators = document.querySelectorAll(`.room-slider-indicators[data-room="${room}"] .room-indicator`);
                        roomSlides.forEach(slide => slide.classList.remove('active'));
                        roomIndicators.forEach(indicator => indicator.classList.remove('active'));
                        if (roomSlides[next]) {
                            roomSlides[next].classList.add('active');
                        }
                        if (roomIndicators[next]) {
                            roomIndicators[next].classList.add('active');
                        }
                        currentRoomSlides[room] = next;
                    });
                }, 4000);
            }
            startSynchronizedRoomSliders();
        }, 1000);
    }
});

// Reviews Slider Functionality
let currentSlide = 0;
const slides = document.querySelectorAll('.review-slide');
const indicators = document.querySelectorAll('.indicator');
const totalSlides = slides.length;
let slideInterval;

function showSlide(index) {
    // Hide all slides
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));
    
    // Show current slide
    if (slides[index]) {
        slides[index].classList.add('active');
    }
    if (indicators[index]) {
        indicators[index].classList.add('active');
    }
    
    currentSlide = index;
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
const HOTEL_WHATSAPP_NUMBER = '+255 785 139 150';

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
        
        // Create WhatsApp URL with hotel number (remove spaces and + sign for URL)
        const whatsappNumber = HOTEL_WHATSAPP_NUMBER.replace(/\s+/g, '').replace('+', '');
        const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        
        // Open WhatsApp in new tab/window
        window.open(whatsappURL, '_blank');
        
        // Show success message
        alert('Booking form submitted! Opening WhatsApp to send your booking details to KALONGO FARM...\n\nPlease review and send the message to confirm your booking.');
        
        // Reset form after successful submission
        bookingForm.reset();
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

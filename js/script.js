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
const HOTEL_WHATSAPP_NUMBER = '+255785139150';

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
            message: document.getElementById('message').value || 'None'
        };

        // Create booking message
        const bookingMessage = `*NEW BOOKING REQUEST - KALONGO FARM* 

 *Guest Details:*
Name: ${formData.fullName}
Email: ${formData.email}
Phone: ${formData.phone}

 *Booking Details:*
Room Type: ${formData.roomType}
Check-in: ${formData.checkIn}
Check-out: ${formData.checkOut}
Number of Guests: ${formData.guests}
Package: ${formData.package}

 *Additional Message:*
${formData.message}

---
_This booking was submitted through the KALONGO FARM website_`;

        // Encode message for URL
        const encodedMessage = encodeURIComponent(bookingMessage);
        
        // Create WhatsApp URL with hotel number
        const whatsappURL = `https://wa.me/${HOTEL_WHATSAPP_NUMBER}?text=${encodedMessage}`;
        
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

// ===== KALONGO FARM Smart Booking Assistant =====
// Frontend-only chatbot with booking recommendations

// Hotel Data - Update prices and information here
const HOTEL_DATA = {
    rooms: {
        'a-cabin': {
            name: 'A-Cabin',
            capacity: '2 Adults or Small Family (2-3 people)',
            dailyRate: 80000,
            weekendRate: 100000,
            holidayRate: 120000,
            description: 'Cozy cabin accommodations perfect for couples or small families.',
            features: ['Private bathroom', 'Farm view', 'Air conditioning', 'Sitting area']
        },
        'cottage': {
            name: 'Cottage',
            capacity: 'Family (4-6 people)',
            dailyRate: 150000,
            weekendRate: 180000,
            holidayRate: 220000,
            description: 'Spacious cottages ideal for families.',
            features: ['Multiple bedrooms', 'Living area', 'Private veranda', 'Kitchenette']
        },
        'kikota': {
            name: 'Kikota',
            capacity: '2-4 Adults',
            dailyRate: 120000,
            weekendRate: 150000,
            holidayRate: 180000,
            description: 'Traditional yet modern accommodations.',
            features: ['Unique design', 'Garden access', 'Cultural experience', 'All modern amenities']
        }
    },
    packages: {
        'day-visit': {
            name: 'Day Visit Package',
            price: 50000,
            description: 'Perfect for day visitors',
            includes: ['Farm tour', 'Animal interaction', 'Lunch included', 'Swimming pool access']
        },
        'weekend-getaway': {
            name: 'Weekend Getaway',
            price: 200000,
            description: '2 nights accommodation for couples or small groups',
            includes: ['2 nights accommodation', 'All meals', 'Farm activities', 'Guided tours', 'Pool access']
        },
        'family-retreat': {
            name: 'Family Retreat',
            price: 350000,
            description: '3 nights accommodation for families with children',
            includes: ['3 nights accommodation', 'Family-friendly activities', 'Kids farm programs', 'All meals', 'Animal feeding sessions']
        },
        'romantic-escape': {
            name: 'Romantic Escape',
            price: 280000,
            description: '2 nights for couples, romantic getaways',
            includes: ['2 nights in cabin/cottage', 'Romantic dinner setup', 'Sunset farm tour', 'Breakfast in room', 'Poolside relaxation']
        }
    },
    info: {
        checkIn: '2:00 PM',
        checkOut: '11:00 AM',
        location: 'KIWIRA TUKUYU',
        phone: '+255 785 139 150',
        email: 'info@kalongofarm.com',
        whatsapp: '+255 785 139 150'
    },
    facilities: ['Swimming Pool', 'Natural Farm', 'Domestic Animals', 'Farm-Fresh Food', 'Nature Trails', 'Activities'],
    activities: {
        kids: ['Animal Feeding', 'Educational Farm Tour', 'Playing Field'],
        family: ['Family Farm Tour', 'Swimming Pool Fun', 'Nature Walks'],
        adults: ['Farm Workshops', 'Relaxation Areas', 'Evening Bonfire'],
        internal: ['Indoor Games', 'Cooking Classes', 'Craft Workshops']
    }
};

// FAQ Data
const FAQ_DATA = {
    'room types': {
        response: `We offer three types of accommodations:
🏠 **A-Cabin**: Perfect for 2 adults or small families (2-3 people)
🏠 **Cottage**: Ideal for families (4-6 people)
🏠 **Kikota**: Great for 2-4 adults

Would you like to know more about a specific room type?`,
        keywords: ['room', 'accommodation', 'stay', 'lodging', 'cabin', 'cottage', 'kikota']
    },
    'prices': {
        response: `Here are our rates:

**Daily Rates (per night):**
• A-Cabin: TZS ${HOTEL_DATA.rooms['a-cabin'].dailyRate.toLocaleString()}
• Cottage: TZS ${HOTEL_DATA.rooms['cottage'].dailyRate.toLocaleString()}
• Kikota: TZS ${HOTEL_DATA.rooms['kikota'].dailyRate.toLocaleString()}

**Weekend Rates (per night):**
• A-Cabin: TZS ${HOTEL_DATA.rooms['a-cabin'].weekendRate.toLocaleString()}
• Cottage: TZS ${HOTEL_DATA.rooms['cottage'].weekendRate.toLocaleString()}
• Kikota: TZS ${HOTEL_DATA.rooms['kikota'].weekendRate.toLocaleString()}

**Holiday Rates (per night):**
• A-Cabin: TZS ${HOTEL_DATA.rooms['a-cabin'].holidayRate.toLocaleString()}
• Cottage: TZS ${HOTEL_DATA.rooms['cottage'].holidayRate.toLocaleString()}
• Kikota: TZS ${HOTEL_DATA.rooms['kikota'].holidayRate.toLocaleString()}

Would you like to see our packages?`,
        keywords: ['price', 'cost', 'rate', 'fee', 'how much', 'pricing', 'tariff']
    },
    'check in': {
        response: `Our check-in time is **${HOTEL_DATA.info.checkIn}** and check-out time is **${HOTEL_DATA.info.checkOut}**.

Early check-in or late check-out may be available upon request. Would you like to book now?`,
        keywords: ['check in', 'check-in', 'checkout', 'check-out', 'arrival', 'departure', 'time']
    },
    'location': {
        response: `<span class="location-icon-text">📍</span> **KALONGO FARM**
**Location:** ${HOTEL_DATA.info.location}

📞 **Phone:** ${HOTEL_DATA.info.phone}
📧 **Email:** ${HOTEL_DATA.info.email}

Need directions or more information?`,
        keywords: ['location', 'address', 'where', 'directions', 'find', 'contact']
    },
    'facilities': {
        response: `We offer amazing facilities:
🏊 Swimming Pool
🌾 Natural Farm
🐄 Domestic Animals
🍽️ Farm-Fresh Food
🌳 Nature Trails
🎯 Various Activities

Would you like to know more about our activities?`,
        keywords: ['facility', 'facilities', 'amenities', 'features', 'what do you have', 'services']
    },
    'activities': {
        response: `We have activities for everyone!

👶 **For Kids**: Animal Feeding, Educational Farm Tour, Playing Field
👨‍👩‍👧‍👦 **For Families**: Family Farm Tour, Swimming Pool Fun, Nature Walks
👔 **For Adults**: Farm Workshops, Relaxation Areas, Evening Bonfire
🏠 **Internal**: Indoor Games, Cooking Classes, Craft Workshops

What activities interest you?`,
        keywords: ['activity', 'activities', 'things to do', 'entertainment', 'fun', 'programs']
    }
};

// Chatbot State
let chatState = {
    isOpen: false,
    conversationMode: 'normal', // 'normal', 'booking', 'package'
    bookingData: {
        guests: null,
        stayType: null,
        budget: null,
        stayPeriod: null,
        preference: null
    },
    packageData: {
        groupSize: null,
        groupType: null,
        duration: null,
        interests: null
    },
    currentQuestion: null,
    unrecognizedCount: 0
};

// Initialize chatbot
function initChatbot() {
    createChatbotHTML();
    setupEventListeners();
    addGreetingMessage();
}

// Create chatbot HTML structure
function createChatbotHTML() {
    const chatbotHTML = `
        <div class="chatbot-container" id="chatbotContainer">
            <div class="chatbot-header">
                <div class="chatbot-header-content">
                    <div class="chatbot-avatar">
                        <img src="images/logo.png" alt="KALONGO FARM Logo" class="chatbot-logo">
                    </div>
                    <div class="chatbot-header-text">
                        <h3>KALONGO FARM Assistant</h3>
                        <p class="chatbot-status">Online</p>
                    </div>
                </div>
                <button class="chatbot-close-btn" id="chatbotCloseBtn">×</button>
            </div>
            <div class="chatbot-messages" id="chatbotMessages">
                <!-- Messages will be added here -->
            </div>
            <div class="chatbot-input-container">
                <input type="text" id="chatbotInput" class="chatbot-input" placeholder="Type your message..." />
                <button class="chatbot-send-btn" id="chatbotSendBtn">Send</button>
            </div>
            <div class="chatbot-quick-actions" id="chatbotQuickActions">
                <button class="quick-action-btn" data-action="book">📅 Book a Stay</button>
                <button class="quick-action-btn" data-action="package">📦 Plan Package</button>
                <button class="quick-action-btn" data-action="prices">💰 View Prices</button>
                <button class="quick-action-btn" data-action="rooms">🏠 Room Types</button>
                <button class="quick-action-btn" data-action="reset">🔄 Reset</button>
            </div>
        </div>
        <button class="chatbot-toggle-btn" id="chatbotToggleBtn">
            <span class="chatbot-icon">💬</span>
            <span class="chatbot-badge" id="chatbotBadge" style="display: none;">1</span>
        </button>
    `;
    
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);
}

// Setup event listeners
function setupEventListeners() {
    const toggleBtn = document.getElementById('chatbotToggleBtn');
    const closeBtn = document.getElementById('chatbotCloseBtn');
    const sendBtn = document.getElementById('chatbotSendBtn');
    const input = document.getElementById('chatbotInput');
    const quickActions = document.querySelectorAll('.quick-action-btn');
    
    toggleBtn.addEventListener('click', toggleChatbot);
    closeBtn.addEventListener('click', toggleChatbot);
    sendBtn.addEventListener('click', handleSendMessage);
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });
    
    quickActions.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.getAttribute('data-action');
            handleQuickAction(action);
        });
    });
}

// Toggle chatbot
function toggleChatbot() {
    const container = document.getElementById('chatbotContainer');
    const toggleBtn = document.getElementById('chatbotToggleBtn');
    
    chatState.isOpen = !chatState.isOpen;
    
    if (chatState.isOpen) {
        container.classList.add('active');
        toggleBtn.classList.add('active');
        document.getElementById('chatbotInput').focus();
    } else {
        container.classList.remove('active');
        toggleBtn.classList.remove('active');
    }
}

// Add greeting message
function addGreetingMessage() {
    const greetingOptions = [
        'Greetings! Welcome to **KALONGO FARM**!',
        'Hello! Welcome to **KALONGO FARM**!',
        'Welcome to **KALONGO FARM**!'
    ];
    
    const randomGreeting = greetingOptions[Math.floor(Math.random() * greetingOptions.length)];
    
    const greeting = `${randomGreeting}

I'm here to help you plan your perfect stay with us. I can assist you with:

✓ **Room Information** - Learn about our A-Cabin, Cottage, and Kikota accommodations
✓ **Pricing** - Get rates for daily, weekend, and holiday stays
✓ **Package Planning** - I'll help you find the perfect package based on your needs
✓ **Facilities & Activities** - Discover what we offer at the farm
✓ **Booking Assistance** - Get personalized recommendations and book your stay
✓ **General Information** - Check-in times, location, contact details

Feel free to ask me anything, or you can type a number (1-6) to get started. How can I help you today?`;
    
    addBotMessage(greeting);
}

// Handle send message
function handleSendMessage() {
    const input = document.getElementById('chatbotInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addUserMessage(message);
    input.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Process message after delay
    setTimeout(() => {
        hideTypingIndicator();
        processMessage(message);
    }, 1000 + Math.random() * 500); // Random delay for natural feel
}

// Handle quick actions
function handleQuickAction(action) {
    if (action === 'reset') {
        resetConversation();
        return;
    }
    
    const input = document.getElementById('chatbotInput');
    input.value = '';
    
    if (action === 'book') {
        startBookingFlow();
    } else if (action === 'prices') {
        processMessage('prices');
    } else if (action === 'rooms') {
        processMessage('room types');
    } else if (action === 'package') {
        startPackageFlow();
    }
}

// Process user message
function processMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check conversation mode
    if (chatState.conversationMode === 'booking') {
        handleBookingResponse(message);
        return;
    }
    
    if (chatState.conversationMode === 'package') {
        handlePackageResponse(message);
        return;
    }
    
    // Check for greetings first - expanded recognition
    const greetingKeywords = [
        'hi', 'hello', 'hey', 'greetings', 'hi there', 'hello there', 'hey there',
        'good morning', 'good afternoon', 'good evening', 'good night',
        'morning', 'afternoon', 'evening', 'night',
        'howdy', 'sup', 'what\'s up', 'wassup', 'whats up',
        'greet', 'greeting', 'salutations', 'hiya',
        'hey', 'hii', 'helloo', 'heyy'
    ];
    
    if (greetingKeywords.some(keyword => lowerMessage.includes(keyword))) {
        const greetingResponses = [
            `Greetings! It's wonderful to hear from you! I'm here to help you plan your perfect stay at KALONGO FARM.`,
            `Hello! Thank you for reaching out. I'd be happy to assist you with anything about KALONGO FARM.`,
            `Welcome! I'm glad you're here. Let me help you discover everything KALONGO FARM has to offer.`,
            `Greetings! Welcome to KALONGO FARM. How can I assist you today?`,
            `Hello! Welcome to KALONGO FARM. I'm here to help you with your stay planning.`
        ];
        
        const randomGreeting = greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
        
        const greetingResponse = `${randomGreeting}

I can help you with:

✓ **Room Information** - Learn about our accommodations (A-Cabin, Cottage, Kikota)
✓ **Pricing** - View our rates for daily, weekend, and holiday stays
✓ **Package Planning** - I'll help you plan the perfect stay package
✓ **Facilities & Activities** - Discover what we offer
✓ **Booking** - Get personalized recommendations and book your stay
✓ **Contact Details** - Get our location and contact information

What would you like to know about? You can type a number (1-6) or just tell me what you're looking for!`;
        addBotMessage(greetingResponse);
        return;
    }
    
    // Check for FAQ matches
    let matched = false;
    for (const [key, data] of Object.entries(FAQ_DATA)) {
        if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
            if (key === 'location') {
                showLocationMessage();
            } else {
                addBotMessage(data.response);
            }
            matched = true;
            break;
        }
    }
    
    // Check for booking intent
    if (!matched && (lowerMessage.includes('book') || lowerMessage.includes('reserve') || lowerMessage.includes('stay'))) {
        startBookingFlow();
        matched = true;
    }
    
    // Check for package planning intent
    if (!matched && (lowerMessage.includes('package') || lowerMessage.includes('plan') || lowerMessage.includes('planning'))) {
        startPackageFlow();
        matched = true;
    }
    
    // Check for number selection (1-6)
    if (!matched) {
        const numberMatch = lowerMessage.match(/^[1-6]$/);
        if (numberMatch) {
            handleOptionSelection(parseInt(lowerMessage));
            matched = true;
        }
    }
    
    // Check if question seems out of scope (multiple unrecognized attempts)
    if (!matched) {
        // Show polite out-of-scope message first, then options
        if (chatState.unrecognizedCount && chatState.unrecognizedCount >= 1) {
            showOutOfScopeMessage();
        } else {
            if (!chatState.unrecognizedCount) chatState.unrecognizedCount = 0;
            chatState.unrecognizedCount++;
            showDefaultOptions();
        }
    } else {
        // Reset counter if question is recognized
        chatState.unrecognizedCount = 0;
    }
}

// Handle option selection by number
function handleOptionSelection(number) {
    switch(number) {
        case 1:
            addBotMessage(FAQ_DATA['room types'].response);
            break;
        case 2:
            addBotMessage(FAQ_DATA['prices'].response);
            break;
        case 3:
            startBookingFlow();
            break;
        case 4:
            startPackageFlow();
            break;
        case 5:
            addBotMessage(FAQ_DATA['facilities'].response);
            break;
        case 6:
            showLocationMessage();
            break;
        default:
            showDefaultOptions();
    }
}

// Show location message with modern icon
function showLocationMessage() {
    const messagesContainer = document.getElementById('chatbotMessages');
    const locationHTML = `
        <div class="chatbot-message chatbot-bot-message">
            <div class="chatbot-avatar-small">
                <img src="images/logo.png" alt="KALONGO FARM" class="chatbot-logo-small">
            </div>
            <div class="chatbot-message-content">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                    <svg class="location-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                    </svg>
                    <strong style="color: var(--primary-color);">KALONGO FARM</strong>
                </div>
                <p><strong>Location:</strong> ${HOTEL_DATA.info.location}</p>
                <p><strong>📞 Phone:</strong> ${HOTEL_DATA.info.phone}</p>
                <p><strong>📧 Email:</strong> ${HOTEL_DATA.info.email}</p>
                <p style="margin-top: 10px; color: var(--text-light);">Need directions or more information?</p>
            </div>
        </div>
    `;
    
    messagesContainer.insertAdjacentHTML('beforeend', locationHTML);
    scrollToBottom();
}

// Show default options when query not recognized
function showDefaultOptions() {
    const defaultMessage = `I can help you with the following options:

**📋 Choose an option:**
1️⃣ **Room Types** - Learn about our accommodations
2️⃣ **Prices** - View our rates and packages
3️⃣ **Book a Stay** - Get a personalized room recommendation
4️⃣ **Plan a Package** - Help plan your perfect stay package
5️⃣ **Facilities & Activities** - Explore what we offer
6️⃣ **Contact Info** - Get our location and contact details

Please select a number (1-6) or type what you're looking for.

**If your question is not listed above**, please contact us directly for personalized assistance.`;
    
    addBotMessage(defaultMessage);
    
    // Show contact options after showing default
    setTimeout(() => {
        showContactOptions();
    }, 800);
}

// Show polite out-of-scope message
function showOutOfScopeMessage() {
    const outOfScopeMessages = [
        `I appreciate your question! While I'm designed to help with room bookings, pricing, facilities, and package planning, I'd love to connect you with our team who can provide more detailed information.`,
        `That's a great question! For more specific information beyond what I can help with, our friendly team would be happy to assist you personally.`,
        `Thank you for asking! I specialize in helping with bookings, pricing, and packages. For other questions, our team can provide you with detailed assistance.`,
        `I understand your question, and while I focus on helping with bookings and packages, our team has all the detailed information you need.`,
        `That's an interesting question! For matters beyond bookings and packages, our team would be the best to help you with that.`
    ];
    
    const randomMessage = outOfScopeMessages[Math.floor(Math.random() * outOfScopeMessages.length)];
    
    addBotMessage(randomMessage);
    
    setTimeout(() => {
        addBotMessage(`Please feel free to contact us directly - we're here to help with any questions you may have!`);
        showContactOptions();
    }, 1200);
}

// Show contact options
function showContactOptions() {
    const messagesContainer = document.getElementById('chatbotMessages');
    const contactHTML = `
        <div class="chatbot-message chatbot-bot-message">
            <div class="chatbot-message-content">
                <p style="margin-bottom: 12px;"><strong>📞 Contact Us for More Information:</strong></p>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <a href="tel:${HOTEL_DATA.info.phone}" class="contact-btn call-btn">
                        <svg class="contact-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor"/>
                        </svg>
                        Call Us
                    </a>
                    <a href="https://wa.me/${HOTEL_DATA.info.whatsapp.replace(/\s+/g, '').replace('+', '')}" target="_blank" class="contact-btn whatsapp-btn">
                        <svg class="contact-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="currentColor"/>
                        </svg>
                        WhatsApp
                    </a>
                </div>
            </div>
        </div>
    `;
    
    messagesContainer.insertAdjacentHTML('beforeend', contactHTML);
    scrollToBottom();
}

// Start booking flow
function startBookingFlow() {
    chatState.conversationMode = 'booking';
    chatState.bookingData = {
        guests: null,
        stayType: null,
        budget: null,
        stayPeriod: null,
        preference: null
    };
    
    addBotMessage("Great! I'll help you find the perfect accommodation. Let's start with a few questions.\n\n**How many guests will be staying?**\n(Enter a number, e.g., 2, 4, 6)");
    chatState.currentQuestion = 'guests';
}

// Handle booking response
function handleBookingResponse(message) {
    const question = chatState.currentQuestion;
    
    if (question === 'guests') {
        const guests = parseInt(message);
        if (isNaN(guests) || guests < 1) {
            addBotMessage("Please enter a valid number of guests (e.g., 2, 4, 6).");
            return;
        }
        chatState.bookingData.guests = guests;
        chatState.currentQuestion = 'stayType';
        
        addBotMessage(`Perfect! ${guests} ${guests === 1 ? 'guest' : 'guests'}.\n\n**What type of stay are you planning?**\n• Family trip\n• Couple/Romantic getaway\n• Group/Friends\n• Solo/Business`);
    }
    
    else if (question === 'stayType') {
        const lowerMessage = message.toLowerCase();
        let stayType = null;
        
        if (lowerMessage.includes('family')) {
            stayType = 'family';
        } else if (lowerMessage.includes('couple') || lowerMessage.includes('romantic')) {
            stayType = 'couple';
        } else if (lowerMessage.includes('group') || lowerMessage.includes('friends')) {
            stayType = 'group';
        } else if (lowerMessage.includes('solo') || lowerMessage.includes('business')) {
            stayType = 'solo';
        }
        
        if (!stayType) {
            addBotMessage("Please choose: Family trip, Couple/Romantic getaway, Group/Friends, or Solo/Business");
            return;
        }
        
        chatState.bookingData.stayType = stayType;
        chatState.currentQuestion = 'budget';
        
        addBotMessage(`Got it! ${stayType.charAt(0).toUpperCase() + stayType.slice(1)} trip.\n\n**What's your budget per night?**\n• Under TZS 100,000\n• TZS 100,000 - 150,000\n• TZS 150,000 - 200,000\n• Above TZS 200,000`);
    }
    
    else if (question === 'budget') {
        const lowerMessage = message.toLowerCase();
        let budget = null;
        
        if (lowerMessage.includes('under') || lowerMessage.includes('100')) {
            budget = 'under-100k';
        } else if (lowerMessage.includes('100') && lowerMessage.includes('150')) {
            budget = '100k-150k';
        } else if (lowerMessage.includes('150') && lowerMessage.includes('200')) {
            budget = '150k-200k';
        } else if (lowerMessage.includes('above') || lowerMessage.includes('over') || lowerMessage.includes('200')) {
            budget = 'above-200k';
        }
        
        if (!budget) {
            addBotMessage("Please choose a budget range:\n• Under TZS 100,000\n• TZS 100,000 - 150,000\n• TZS 150,000 - 200,000\n• Above TZS 200,000");
            return;
        }
        
        chatState.bookingData.budget = budget;
        chatState.currentQuestion = 'stayPeriod';
        
        addBotMessage(`Perfect!\n\n**When are you planning to stay?**\n• Weekday (Monday-Thursday)\n• Weekend (Friday-Sunday)\n• Holiday/Peak season`);
    }
    
    else if (question === 'stayPeriod') {
        const lowerMessage = message.toLowerCase();
        let stayPeriod = null;
        
        if (lowerMessage.includes('weekday') || lowerMessage.includes('monday') || lowerMessage.includes('tuesday') || lowerMessage.includes('wednesday') || lowerMessage.includes('thursday')) {
            stayPeriod = 'weekday';
        } else if (lowerMessage.includes('weekend') || lowerMessage.includes('friday') || lowerMessage.includes('saturday') || lowerMessage.includes('sunday')) {
            stayPeriod = 'weekend';
        } else if (lowerMessage.includes('holiday') || lowerMessage.includes('peak')) {
            stayPeriod = 'holiday';
        }
        
        if (!stayPeriod) {
            addBotMessage("Please choose: Weekday, Weekend, or Holiday/Peak season");
            return;
        }
        
        chatState.bookingData.stayPeriod = stayPeriod;
        generateRecommendation();
    }
}

// Generate recommendation
function generateRecommendation() {
    const { guests, stayType, budget, stayPeriod } = chatState.bookingData;
    
    // Recommendation logic
    let recommendation = null;
    let rate = 0;
    
    // Determine room based on guests and stay type
    if (guests <= 2 && stayType !== 'family') {
        // A-Cabin or Kikota for 2 or fewer
        if (budget === 'under-100k' || budget === '100k-150k') {
            recommendation = 'a-cabin';
        } else {
            recommendation = 'kikota';
        }
    } else if (guests <= 4 && stayType === 'family') {
        // Kikota or Cottage for small families
        if (budget === 'under-100k' || budget === '100k-150k') {
            recommendation = 'kikota';
        } else {
            recommendation = 'cottage';
        }
    } else {
        // Cottage for larger groups/families
        recommendation = 'cottage';
    }
    
    // Get rate based on stay period
    const room = HOTEL_DATA.rooms[recommendation];
    if (stayPeriod === 'weekday') {
        rate = room.dailyRate;
    } else if (stayPeriod === 'weekend') {
        rate = room.weekendRate;
    } else {
        rate = room.holidayRate;
    }
    
    // Generate recommendation message
    const recommendationMessage = `Perfect! Based on your preferences, I recommend:

🏠 **${room.name}**
👥 Capacity: ${room.capacity}
💰 ${stayPeriod.charAt(0).toUpperCase() + stayPeriod.slice(1)} Rate: TZS ${rate.toLocaleString()}/night
📝 ${room.description}

**Features:**
${room.features.map(f => `• ${f}`).join('\n')}

Would you like to book this accommodation?`;

    addBotMessage(recommendationMessage);
    
    // Store recommendation
    chatState.bookingData.recommendation = recommendation;
    chatState.bookingData.rate = rate;
    
    // Show booking button
    showBookingButton();
}

// Show booking button
function showBookingButton() {
    // Store booking data in localStorage for form auto-fill
    const bookingData = {
        guests: chatState.bookingData.guests,
        roomType: chatState.bookingData.recommendation ? HOTEL_DATA.rooms[chatState.bookingData.recommendation].name : null,
        stayType: chatState.bookingData.stayType,
        stayPeriod: chatState.bookingData.stayPeriod,
        rate: chatState.bookingData.rate
    };
    localStorage.setItem('chatbotBookingData', JSON.stringify(bookingData));
    
    const messagesContainer = document.getElementById('chatbotMessages');
    const buttonHTML = `
        <div class="chatbot-message chatbot-bot-message">
            <div class="chatbot-message-content">
                <p style="margin-bottom: 15px;">Ready to book? I'll take you to our booking page where you can complete your reservation!</p>
                <a href="booking.html" class="whatsapp-booking-btn" onclick="localStorage.setItem('fromChatbot', 'true');">
                    📅 Book Now
                </a>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        messagesContainer.insertAdjacentHTML('beforeend', buttonHTML);
        scrollToBottom();
    }, 500);
}

// Generate WhatsApp link
function generateWhatsAppLink() {
    const { guests, stayType, stayPeriod, recommendation, rate } = chatState.bookingData;
    const room = HOTEL_DATA.rooms[recommendation];
    
    const message = `*BOOKING REQUEST - KALONGO FARM*

*Guest Details:*
Number of Guests: ${guests}
Stay Type: ${stayType.charAt(0).toUpperCase() + stayType.slice(1)}

*Recommended Accommodation:*
Room Type: ${room.name}
Stay Period: ${stayPeriod.charAt(0).toUpperCase() + stayPeriod.slice(1)}
Rate: TZS ${rate.toLocaleString()}/night

*Room Details:*
Capacity: ${room.capacity}
${room.description}

I'm interested in booking this accommodation. Please confirm availability and provide booking details.

---
_This booking request was generated through the KALONGO FARM website chatbot_`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = HOTEL_DATA.info.whatsapp.replace(/\s+/g, '').replace('+', '');
    return `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
}

// Start package planning flow
function startPackageFlow() {
    chatState.conversationMode = 'package';
    chatState.packageData = {
        groupSize: null,
        groupType: null,
        duration: null,
        interests: null,
        budget: null
    };
    
    addBotMessage(`Great! I'd love to help you plan the perfect package for your stay at KALONGO FARM!

I'll ask you just a few simple questions to understand what you're looking for, and then I'll recommend the best package for you.

**First question: How many people will be staying?**
(Just type a number, like 2, 4, or 6)`);
    chatState.currentQuestion = 'groupSize';
}

// Handle package planning response
function handlePackageResponse(message) {
    const question = chatState.currentQuestion;
    
    if (question === 'groupSize') {
        const groupSize = parseInt(message);
        if (isNaN(groupSize) || groupSize < 1) {
            addBotMessage("Please enter a number, like 2, 4, or 6.");
            return;
        }
        chatState.packageData.groupSize = groupSize;
        chatState.currentQuestion = 'groupType';
        
        const groupTypeOptions = groupSize === 1 
            ? "• Solo traveler\n• Business trip"
            : groupSize === 2
            ? "• Couple/Romantic getaway\n• Friends traveling together"
            : groupSize <= 4
            ? "• Family with children\n• Couple with kids\n• Friends/Group"
            : "• Large family\n• Group of friends\n• Extended family";
        
        addBotMessage(`Great! ${groupSize} ${groupSize === 1 ? 'person' : 'people'}.

**What best describes your group?**
${groupTypeOptions}

(Just type your choice, like "family" or "couple")`);
    }
    
    else if (question === 'groupType') {
        const lowerMessage = message.toLowerCase();
        let groupType = null;
        
        if (lowerMessage.includes('family') || lowerMessage.includes('children')) {
            groupType = 'family';
        } else if (lowerMessage.includes('couple') || lowerMessage.includes('romantic')) {
            groupType = 'couple';
        } else if (lowerMessage.includes('friends') || lowerMessage.includes('group')) {
            groupType = 'friends';
        } else if (lowerMessage.includes('solo')) {
            groupType = 'solo';
        }
        
        if (!groupType) {
            addBotMessage("Please choose: Family with children, Couple/Romantic, Friends/Group, or Solo traveler");
            return;
        }
        
        chatState.packageData.groupType = groupType;
        chatState.currentQuestion = 'duration';
        
        addBotMessage(`Got it! ${groupType.charAt(0).toUpperCase() + groupType.slice(1)}.\n\n**How long do you want to stay?**\n• Day visit only\n• 1 night\n• 2 nights\n• 3 nights or more`);
    }
    
    else if (question === 'duration') {
        const lowerMessage = message.toLowerCase();
        let duration = null;
        
        if (lowerMessage.includes('day') && (lowerMessage.includes('visit') || lowerMessage.includes('only'))) {
            duration = 'day-visit';
        } else if (lowerMessage.includes('1') || lowerMessage.includes('one')) {
            duration = '1-night';
        } else if (lowerMessage.includes('2') || lowerMessage.includes('two')) {
            duration = '2-nights';
        } else if (lowerMessage.includes('3') || lowerMessage.includes('more')) {
            duration = '3-nights';
        }
        
        if (!duration) {
            addBotMessage("Please choose: Day visit only, 1 night, 2 nights, or 3 nights or more");
            return;
        }
        
        chatState.packageData.duration = duration;
        
        // Skip interests for day-visit, go straight to recommendation
        if (duration === 'day-visit') {
            generatePackageRecommendation();
        } else {
            chatState.currentQuestion = 'interests';
            addBotMessage(`Perfect!\n\n**What interests you most?** (You can choose one or more)\n• Farm activities & animal interaction\n• Swimming & relaxation\n• Nature walks & exploration\n• Farm-fresh food experiences\n• All of the above\n\n(Just type what interests you, like "farm activities" or "all")`);
        }
    }
    
    else if (question === 'interests') {
        chatState.packageData.interests = message;
        generatePackageRecommendation();
    }
    
    else if (question === 'budget') {
        chatState.packageData.budget = message;
        generatePackageRecommendation();
    }
}

// Generate package recommendation
function generatePackageRecommendation() {
    const { groupSize, groupType, duration, interests } = chatState.packageData;
    
    // Package recommendation logic
    let recommendedPackage = null;
    
    if (duration === 'day-visit') {
        recommendedPackage = 'day-visit';
    } else if (duration === '1-night') {
        if (groupType === 'couple' || groupType === 'solo') {
            recommendedPackage = 'weekend-getaway';
        } else {
            recommendedPackage = 'weekend-getaway';
        }
    } else if (duration === '2-nights') {
        if (groupType === 'couple' || groupType === 'romantic') {
            recommendedPackage = 'romantic-escape';
        } else {
            recommendedPackage = 'weekend-getaway';
        }
    } else {
        if (groupType === 'family') {
            recommendedPackage = 'family-retreat';
        } else {
            recommendedPackage = 'family-retreat';
        }
    }
    
    const packageData = HOTEL_DATA.packages[recommendedPackage];
    
    const packageMessage = `Perfect! Based on your preferences, I recommend:

📦 **${packageData.name}**
💰 Price: TZS ${packageData.price.toLocaleString()}
📝 ${packageData.description}

**Package Includes:**
${packageData.includes.map(item => `• ${item}`).join('\n')}

**Recommended for:**
• ${groupType.charAt(0).toUpperCase() + groupType.slice(1)} groups of ${groupSize} ${groupSize === 1 ? 'person' : 'people'}
• ${duration === 'day-visit' ? 'Day visit' : duration.includes('1') ? '1 night stay' : duration.includes('2') ? '2 nights stay' : 'Extended stay'}

Would you like to book this package?`;

    addBotMessage(packageMessage);
    
    // Store package recommendation
    chatState.packageData.recommendedPackage = recommendedPackage;
    
    // Show booking button
    showPackageBookingButton();
}

// Show package booking button
function showPackageBookingButton() {
    // Store package data in localStorage for form auto-fill
    const packageData = {
        package: chatState.packageData.recommendedPackage ? HOTEL_DATA.packages[chatState.packageData.recommendedPackage].name : null,
        groupSize: chatState.packageData.groupSize,
        groupType: chatState.packageData.groupType,
        duration: chatState.packageData.duration
    };
    localStorage.setItem('chatbotPackageData', JSON.stringify(packageData));
    
    const messagesContainer = document.getElementById('chatbotMessages');
    const buttonHTML = `
        <div class="chatbot-message chatbot-bot-message">
            <div class="chatbot-message-content">
                <p style="margin-bottom: 15px;">Perfect! Ready to book this package? I'll take you to our booking page where you can complete your reservation!</p>
                <a href="booking.html" class="whatsapp-booking-btn" onclick="localStorage.setItem('fromChatbot', 'true');">
                    📅 Book Now
                </a>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        messagesContainer.insertAdjacentHTML('beforeend', buttonHTML);
        scrollToBottom();
    }, 500);
}

// Reset conversation
function resetConversation() {
    chatState.conversationMode = 'normal';
    chatState.bookingData = {
        guests: null,
        stayType: null,
        budget: null,
        stayPeriod: null,
        preference: null
    };
    chatState.packageData = {
        groupSize: null,
        groupType: null,
        duration: null,
        interests: null
    };
    chatState.currentQuestion = null;
    chatState.unrecognizedCount = 0;
    
    const messagesContainer = document.getElementById('chatbotMessages');
    messagesContainer.innerHTML = '';
    
    addGreetingMessage();
}

// Add user message
function addUserMessage(message) {
    const messagesContainer = document.getElementById('chatbotMessages');
    const messageHTML = `
        <div class="chatbot-message chatbot-user-message">
            <div class="chatbot-message-content">${escapeHtml(message)}</div>
        </div>
    `;
    
    messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    scrollToBottom();
}

// Add bot message
function addBotMessage(message) {
    const messagesContainer = document.getElementById('chatbotMessages');
    const formattedMessage = formatMessage(message);
    
    const messageHTML = `
        <div class="chatbot-message chatbot-bot-message">
            <div class="chatbot-avatar-small">
                <img src="images/logo.png" alt="KALONGO FARM" class="chatbot-logo-small">
            </div>
            <div class="chatbot-message-content">${formattedMessage}</div>
        </div>
    `;
    
    messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    scrollToBottom();
}

// Show typing indicator
function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatbotMessages');
    const indicatorHTML = `
        <div class="chatbot-message chatbot-bot-message typing-indicator">
            <div class="chatbot-avatar-small">
                <img src="images/logo.png" alt="KALONGO FARM" class="chatbot-logo-small">
            </div>
            <div class="chatbot-message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    `;
    
    messagesContainer.insertAdjacentHTML('beforeend', indicatorHTML);
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    const indicators = document.querySelectorAll('.typing-indicator');
    indicators.forEach(indicator => indicator.remove());
}

// Format message (bold, line breaks)
function formatMessage(message) {
    let formatted = escapeHtml(message);
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Scroll to bottom
function scrollToBottom() {
    const messagesContainer = document.getElementById('chatbotMessages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
} else {
    initChatbot();
}

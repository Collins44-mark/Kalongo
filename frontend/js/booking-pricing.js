/**
 * Booking Page - Cost Summary with Nights Calculation & Multi-Currency
 * Auto-calculates nights from check-in/check-out, total cost by room type, and live exchange rates.
 */
(function() {
    'use strict';

    // Room prices per night in TZS (base currency) - from pricing.html
    const ROOM_PRICES_TZS = {
        'A-Cabin': 80000,
        'Cottage': 150000,
        'Kikota': 120000,
        'Family House': 150000,
        'Tent': 50000,  // Single tent per night (Double: 80,000)
        'None': 0
    };

    // Currency symbols and names
    const CURRENCY_INFO = {
        TZS: { symbol: 'TZS', name: 'Tanzanian Shilling' },
        USD: { symbol: '$', name: 'US Dollar' },
        EUR: { symbol: '€', name: 'Euro' },
        GBP: { symbol: '£', name: 'British Pound' },
        KES: { symbol: 'KSh', name: 'Kenyan Shilling' },
        ZAR: { symbol: 'R', name: 'South African Rand' }
    };

    // Fallback rates if API fails (approximate TZS per 1 unit of currency)
    const FALLBACK_RATES = {
        TZS: 1,
        USD: 2640,
        EUR: 2850,
        GBP: 3330,
        KES: 20,
        ZAR: 145
    };

    let exchangeRates = null;
    let lastFetchTime = 0;
    const CACHE_MS = 60 * 60 * 1000; // 1 hour cache

    function getElements() {
        return {
            roomType: document.getElementById('roomType'),
            checkIn: document.getElementById('checkIn'),
            checkOut: document.getElementById('checkOut'),
            currencySelect: document.getElementById('currencySelect'),
            costRoomType: document.getElementById('costRoomType'),
            costNights: document.getElementById('costNights'),
            costPerNight: document.getElementById('costPerNight'),
            costTotal: document.getElementById('costTotal')
        };
    }

    function calculateNights(checkInStr, checkOutStr) {
        if (!checkInStr || !checkOutStr) return 0;
        const checkIn = new Date(checkInStr);
        const checkOut = new Date(checkOutStr);
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) return 0;
        if (checkOut <= checkIn) return 0;
        const diffMs = checkOut - checkIn;
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    function formatAmount(amount, currency) {
        const info = CURRENCY_INFO[currency] || CURRENCY_INFO.TZS;
        const decimals = currency === 'TZS' || currency === 'KES' ? 0 : 2;
        const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
        const formatted = num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        if (info.symbol === 'TZS' || info.symbol === 'KSh' || info.symbol === 'R') {
            return `${info.symbol} ${formatted}`;
        }
        return `${info.symbol}${formatted}`;
    }

    async function fetchExchangeRates() {
        if (exchangeRates && Date.now() - lastFetchTime < CACHE_MS) {
            return exchangeRates;
        }
        try {
            const res = await fetch('https://open.er-api.com/v6/latest/TZS', { mode: 'cors' });
            const data = await res.json();
            if (data && data.result === 'success' && data.rates) {
                exchangeRates = data.rates;
                lastFetchTime = Date.now();
                return exchangeRates;
            }
        } catch (e) {
            console.warn('Exchange rate API unavailable, using fallback rates:', e.message);
        }
        exchangeRates = null;
        return null;
    }

    /** API returns: 1 TZS = rate (e.g. rates.USD = 0.000391) */
    function getTZSToTargetRate(currency) {
        if (currency === 'TZS') return 1;
        if (exchangeRates && typeof exchangeRates[currency] === 'number' && exchangeRates[currency] > 0) {
            return exchangeRates[currency];
        }
        return 1 / (FALLBACK_RATES[currency] || 2640);
    }

    function convertFromTZS(amountTZS, toCurrency) {
        if (toCurrency === 'TZS') return amountTZS;
        const rate = getTZSToTargetRate(toCurrency);
        return amountTZS * rate;
    }

    function updateCostSummary() {
        const els = getElements();
        if (!els.roomType || !els.checkIn || !els.checkOut || !els.currencySelect) return;

        const roomType = els.roomType.value;
        const checkIn = els.checkIn.value;
        const checkOut = els.checkOut.value;
        const currency = els.currencySelect.value;

        const nights = calculateNights(checkIn, checkOut);
        const pricePerNightTZS = ROOM_PRICES_TZS[roomType] ?? 0;
        const totalTZS = nights * pricePerNightTZS;

        els.costRoomType.textContent = roomType || '—';
        els.costNights.textContent = nights;

        if (roomType && roomType !== 'None') {
            const priceConverted = convertFromTZS(pricePerNightTZS, currency);
            const totalConverted = convertFromTZS(totalTZS, currency);
            els.costPerNight.textContent = formatAmount(priceConverted, currency);
            els.costTotal.textContent = formatAmount(totalConverted, currency);
        } else {
            els.costPerNight.textContent = '—';
            els.costTotal.textContent = '—';
        }
    }

    function setupListeners() {
        const els = getElements();
        ['roomType', 'checkIn', 'checkOut', 'currencySelect'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', updateCostSummary);
                el.addEventListener('input', updateCostSummary);
            }
        });
    }

    function init() {
        if (!document.getElementById('bookingCostSummary')) return;
        fetchExchangeRates().then(() => {
            setupListeners();
            updateCostSummary();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

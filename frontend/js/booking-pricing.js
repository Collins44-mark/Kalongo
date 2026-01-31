/**
 * Booking Page - Cost Summary with Nights, Guest-Based Pricing & Multi-Currency
 * Fetches prices from API, varies by room type + number of guests (occupancy).
 * Prices: A-Cabin/Cottage (single 150k, couple 180k), Family (couples 250k, 5 occupants 550k), Kikota 400k
 */
(function() {
    'use strict';

    // API base URL (matches api.js)
    const API_BASE = (() => {
        const h = window.location.hostname;
        return (h === 'localhost' || h === '127.0.0.1') ? 'http://localhost:5001/api' : 'https://kalongo.onrender.com/api';
    })();

    // Fallback prices if API fails (TZS per night) - matches admin/database
    const FALLBACK_PRICES = {
        'A-Cabin': { single: 150000, couple: 180000 },
        'Cottage': { single: 150000, couple: 180000 },
        'Family House': { couples: 250000, fiveOccupants: 550000 },
        'Kikota': { flat: 400000 },
        'Tent': { single: 50000, double: 80000 },
        'None': { flat: 0 }
    };

    // Parsed pricing from API: { roomKey: { occupancyKey: priceTZS } }
    let pricingFromAPI = null;

    // Currency symbols and names
    const CURRENCY_INFO = {
        TZS: { symbol: 'TZS', name: 'Tanzanian Shilling' },
        USD: { symbol: '$', name: 'US Dollar' },
        EUR: { symbol: '€', name: 'Euro' },
        GBP: { symbol: '£', name: 'British Pound' },
        KES: { symbol: 'KSh', name: 'Kenyan Shilling' },
        ZAR: { symbol: 'R', name: 'South African Rand' }
    };

    const FALLBACK_RATES = {
        TZS: 1, USD: 2640, EUR: 2850, GBP: 3330, KES: 20, ZAR: 145
    };

    let exchangeRates = null;
    let lastFetchTime = 0;
    const CACHE_MS = 60 * 60 * 1000;

    function parsePriceValue(str) {
        if (!str || typeof str !== 'string') return 0;
        const num = str.replace(/[^\d]/g, '');
        return parseInt(num, 10) || 0;
    }

    function parsePricingFromAPI(categories) {
        const map = {};
        if (!categories || !Array.isArray(categories)) return map;

        const acc = categories.find(c =>
            (c.category_type || '').toLowerCase() === 'accommodation' ||
            (c.name || '').toLowerCase().includes('accommodation')
        );
        if (!acc || !acc.items || !acc.items.length) return map;

        const roomMapping = { 'A-Cabin': 'A-Cabin', 'Cottage': 'Cottage', 'Family': 'Family House', 'Kikota': 'Kikota', 'Tents': 'Tent' };

        acc.items.forEach(item => {
            const name = (item.name || '').trim();
            const label = (item.price_label || '').toLowerCase();
            const price = parsePriceValue(item.price_value);
            const formKey = roomMapping[name] || name;

            if (!map[formKey]) map[formKey] = {};

            if (name === 'A-Cabin' || name === 'Cottage') {
                if (label.includes('single')) map[formKey].single = price;
                else if (label.includes('couple')) map[formKey].couple = price;
            } else if (name === 'Family') {
                if (label.includes('5') || label.includes('occupant')) map[formKey].fiveOccupants = price;
                else map[formKey].couples = price;
            } else if (name === 'Kikota') {
                map[formKey].flat = price;
            } else if (name === 'Tents') {
                if (label.includes('single')) map[formKey].single = price;
                else if (label.includes('double')) map[formKey].double = price;
            }
        });

        return map;
    }

    async function fetchPricing() {
        try {
            const res = await fetch(API_BASE + '/pricing', { mode: 'cors' });
            const data = await res.json();
            if (data && Array.isArray(data)) {
                pricingFromAPI = parsePricingFromAPI(data);
                return pricingFromAPI;
            }
        } catch (e) {
            console.warn('Booking pricing: API fetch failed, using fallback prices:', e.message);
        }
        pricingFromAPI = {};
        return null;
    }

    function getPriceForRoomAndGuests(roomType, totalGuests) {
        const prices = pricingFromAPI && Object.keys(pricingFromAPI).length
            ? (pricingFromAPI[roomType] || FALLBACK_PRICES[roomType])
            : FALLBACK_PRICES[roomType];

        if (!prices || roomType === 'None') return { price: 0, occupancyLabel: '—' };

        if (roomType === 'A-Cabin' || roomType === 'Cottage') {
            const g = Math.max(0, totalGuests);
            if (g <= 1) return { price: prices.single ?? 150000, occupancyLabel: 'Single occupancy' };
            return { price: prices.couple ?? 180000, occupancyLabel: 'Couple' };
        }

        if (roomType === 'Family House') {
            const g = Math.max(0, totalGuests);
            if (g >= 5) return { price: prices.fiveOccupants ?? 550000, occupancyLabel: '5 occupants' };
            return { price: prices.couples ?? 250000, occupancyLabel: 'Couples' };
        }

        if (roomType === 'Kikota') {
            return { price: prices.flat ?? 400000, occupancyLabel: 'Per night' };
        }

        if (roomType === 'Tent') {
            const g = Math.max(0, totalGuests);
            if (g <= 1) return { price: prices.single ?? 50000, occupancyLabel: 'Single' };
            return { price: prices.double ?? 80000, occupancyLabel: 'Double' };
        }

        return { price: 0, occupancyLabel: '—' };
    }

    function getElements() {
        return {
            roomType: document.getElementById('roomType'),
            checkIn: document.getElementById('checkIn'),
            checkOut: document.getElementById('checkOut'),
            adults: document.getElementById('adults'),
            children: document.getElementById('children'),
            currencySelect: document.getElementById('currencySelect'),
            costRoomType: document.getElementById('costRoomType'),
            costOccupancy: document.getElementById('costOccupancy'),
            costGuests: document.getElementById('costGuests'),
            costNights: document.getElementById('costNights'),
            costPerNight: document.getElementById('costPerNight'),
            costTotal: document.getElementById('costTotal')
        };
    }

    function getTotalGuests() {
        const adults = document.getElementById('adults');
        const children = document.getElementById('children');
        const a = Math.max(0, parseInt(adults?.value || 0, 10) || 0);
        const c = Math.max(0, parseInt(children?.value || 0, 10) || 0);
        return a + c;
    }

    function calculateNights(checkInStr, checkOutStr) {
        if (!checkInStr || !checkOutStr) return 0;
        const checkIn = new Date(checkInStr);
        const checkOut = new Date(checkOutStr);
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) return 0;
        if (checkOut <= checkIn) return 0;
        return Math.floor((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    }

    function formatAmount(amount, currency) {
        const info = CURRENCY_INFO[currency] || CURRENCY_INFO.TZS;
        const decimals = (currency === 'TZS' || currency === 'KES') ? 0 : 2;
        const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
        const formatted = num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        if (info.symbol === 'TZS' || info.symbol === 'KSh' || info.symbol === 'R') {
            return `${info.symbol} ${formatted}`;
        }
        return `${info.symbol}${formatted}`;
    }

    async function fetchExchangeRates() {
        if (exchangeRates && Date.now() - lastFetchTime < CACHE_MS) return exchangeRates;
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

    function getTZSToTargetRate(currency) {
        if (currency === 'TZS') return 1;
        if (exchangeRates && typeof exchangeRates[currency] === 'number' && exchangeRates[currency] > 0) {
            return exchangeRates[currency];
        }
        return 1 / (FALLBACK_RATES[currency] || 2640);
    }

    function convertFromTZS(amountTZS, toCurrency) {
        if (toCurrency === 'TZS') return amountTZS;
        return amountTZS * getTZSToTargetRate(toCurrency);
    }

    function updateCostSummary() {
        const els = getElements();
        if (!els.roomType || !els.checkIn || !els.checkOut || !els.currencySelect) return;

        const roomType = els.roomType.value;
        const checkIn = els.checkIn.value;
        const checkOut = els.checkOut.value;
        const currency = els.currencySelect.value;
        const totalGuests = getTotalGuests();
        const nights = calculateNights(checkIn, checkOut);

        const { price: pricePerNightTZS, occupancyLabel } = getPriceForRoomAndGuests(roomType, totalGuests);
        const totalTZS = nights * pricePerNightTZS;

        els.costRoomType.textContent = roomType || '—';
        if (els.costOccupancy) els.costOccupancy.textContent = occupancyLabel;
        if (els.costGuests) els.costGuests.textContent = totalGuests;
        els.costNights.textContent = nights;

        if (roomType && roomType !== 'None') {
            els.costPerNight.textContent = formatAmount(convertFromTZS(pricePerNightTZS, currency), currency);
            els.costTotal.textContent = formatAmount(convertFromTZS(totalTZS, currency), currency);
        } else {
            els.costPerNight.textContent = '—';
            els.costTotal.textContent = '—';
        }
    }

    function setupListeners() {
        const ids = ['roomType', 'checkIn', 'checkOut', 'currencySelect', 'adults', 'children'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', updateCostSummary);
                el.addEventListener('input', updateCostSummary);
            }
        });
    }

    async function init() {
        if (!document.getElementById('bookingCostSummary')) return;

        await Promise.all([fetchPricing(), fetchExchangeRates()]);
        setupListeners();
        updateCostSummary();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

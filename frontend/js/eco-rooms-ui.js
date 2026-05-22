/**
 * Premium accommodations cards + detail modal
 */
(function () {
  'use strict';

  const ROOM_PRICES = {
    'a-cabin': { amount: 180000, label: '/ night' },
    cottage: { amount: 180000, label: '/ night' },
    kikota: { amount: 400000, label: ' / stay (2–4 guests)' },
    'family-house': { amount: 250000, label: '/ night (2 guests)' },
  };

  const DEFAULT_AMENITIES = [
    'Comfortable beds',
    'Private bathroom',
    'Farm view',
    'Free WiFi',
  ];

  function formatTzs(n) {
    return 'TZS ' + Number(n).toLocaleString('en-US');
  }

  function getRoomPrice(slug, room) {
    const p = ROOM_PRICES[slug];
    if (p) return { text: `From ${formatTzs(p.amount)}${p.label}` };
    return { text: 'Contact for rates' };
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function amenityIcon(text) {
    const t = (text || '').toLowerCase();
    if (t.includes('wifi') || t.includes('wi-fi')) return '⌁';
    if (t.includes('bath') || t.includes('shower')) return '◇';
    if (t.includes('bed') || t.includes('sleep')) return '☾';
    if (t.includes('view') || t.includes('garden') || t.includes('farm')) return '❋';
    if (t.includes('kitchen')) return '◎';
    if (t.includes('air') || t.includes('ac')) return '◈';
    return '✓';
  }

  function ensureModalShell() {
    if (document.getElementById('luxRoomModal')) return;
    const el = document.createElement('div');
    el.id = 'luxRoomModal';
    el.className = 'lux-room-modal';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
      <div class="lux-room-modal-backdrop" data-lux-modal-close></div>
      <div class="lux-room-modal-panel">
        <button type="button" class="lux-room-modal-close" data-lux-modal-close aria-label="Close">&times;</button>
        <div class="lux-room-modal-inner" id="luxRoomModalInner"></div>
      </div>
    `;
    document.body.appendChild(el);
    el.querySelectorAll('[data-lux-modal-close]').forEach((btn) => {
      btn.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  function openModal(room) {
    if (!room) return;
    ensureModalShell();
    const modal = document.getElementById('luxRoomModal');
    const inner = document.getElementById('luxRoomModalInner');
    const images = (room.images || []).filter((i) => i.image_url && i.image_url.trim());
    const mainUrl = images[0]?.image_url || '';
    const price = getRoomPrice(room.slug, room);
    const bookHref = room.slug
      ? `/booking.html?room=${encodeURIComponent(room.slug)}`
      : '/booking.html';
    const features = (room.features && room.features.length) ? room.features : DEFAULT_AMENITIES;
    const cardAmenities = features.slice(0, 4);
    const specsHtml = features
      .map(
        (f) =>
          `<li><span class="spec-icon" aria-hidden="true">${amenityIcon(f)}</span><span>${escapeHtml(f)}</span></li>`
      )
      .join('');

    const thumbsHtml =
      images.length > 1
        ? images
            .map(
              (img, i) => `
        <button type="button" class="lux-room-modal-thumb${i === 0 ? ' is-active' : ''}" data-thumb-index="${i}" aria-label="View image ${i + 1}">
          <img src="${escapeHtml(img.image_url)}" alt="" loading="lazy">
        </button>`
            )
            .join('')
        : '';

    inner.innerHTML = `
      <div class="lux-room-modal-info">
        <button type="button" class="lux-room-modal-back" data-lux-modal-close>← Back to Accommodations</button>
        <h2 class="lux-room-modal-title" id="luxRoomModalTitle">${escapeHtml(room.name)}</h2>
        <p class="lux-room-modal-capacity">${escapeHtml(room.capacity || '')}</p>
        <p class="lux-room-modal-desc">${escapeHtml(room.description || '')}</p>
        <ul class="lux-room-modal-specs">${specsHtml}</ul>
        <div class="lux-room-modal-book-row">
          <div class="lux-room-modal-price-label">
            <span>Starting from</span>
            <strong>${escapeHtml(price.text.replace(/^From\s/, ''))}</strong>
          </div>
          <a href="${bookHref}" class="lux-room-modal-book-btn">Book This Room</a>
        </div>
      </div>
      <div class="lux-room-modal-gallery">
        <div class="lux-room-modal-main-img-wrap">
          <img class="lux-room-modal-main-img" id="luxRoomModalMainImg" src="${escapeHtml(mainUrl)}" alt="${escapeHtml(room.name)}">
        </div>
        ${thumbsHtml ? `<div class="lux-room-modal-thumbs">${thumbsHtml}</div>` : ''}
      </div>
    `;

    modal.setAttribute('aria-labelledby', 'luxRoomModalTitle');
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lux-room-modal-open');

    inner.querySelectorAll('.lux-room-modal-thumb').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-thumb-index'), 10);
        const img = images[idx];
        if (!img) return;
        document.getElementById('luxRoomModalMainImg').src = img.image_url;
        inner.querySelectorAll('.lux-room-modal-thumb').forEach((t) => t.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
    });
  }

  function closeModal() {
    const modal = document.getElementById('luxRoomModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lux-room-modal-open');
  }

  function bindRoomCards() {
    document.querySelectorAll('#rooms .lux-room-card').forEach((card) => {
      const slug = card.getAttribute('data-room-slug');
      const slider = card.querySelector('.room-slider-container');
      let pointerStart = null;
      let pointerMoved = false;

      if (slider) {
        slider.addEventListener('pointerdown', (e) => {
          pointerMoved = false;
          pointerStart = { x: e.clientX, y: e.clientY };
        });
        slider.addEventListener('pointermove', (e) => {
          if (!pointerStart) return;
          const d = Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y);
          if (d > 12) pointerMoved = true;
        });
        slider.addEventListener('pointerup', () => {
          pointerStart = null;
        });
      }

      const openRoom = () => {
        const room = window.roomsCatalog?.find((r) => r.slug === slug);
        if (room) openModal(room);
      };

      card.addEventListener('click', (e) => {
        if (e.target.closest('.lux-room-view-btn')) return;
        if (slider && slider.contains(e.target) && pointerMoved) return;
        openRoom();
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openRoom();
        }
      });

      const btn = card.querySelector('.lux-room-view-btn');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          openRoom();
        });
      }
    });
  }

  window.addEventListener('roomsRendered', () => {
    setTimeout(bindRoomCards, 250);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(bindRoomCards, 500));
  } else {
    setTimeout(bindRoomCards, 500);
  }
})();

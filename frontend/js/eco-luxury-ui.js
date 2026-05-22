/**
 * KALONGO FARM — Premium eco-luxury UI interactions
 */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initAmbient() {
    if (document.querySelector('.eco-ambient')) return;
    const wrap = document.createElement('div');
    wrap.className = 'eco-ambient';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<div class="eco-orb eco-orb--1"></div><div class="eco-orb eco-orb--2"></div><div class="eco-orb eco-orb--3"></div>';
    document.body.prepend(wrap);
  }

  function initScrollReveal() {
    const nodes = document.querySelectorAll(
      '.packages-section-modern, .lux-menu-hero-inner, .lux-menu-section-head, .lux-menu-cat-card, .lux-svc-section, .lux-svc-block, .lux-svc-img-card, .lux-svc-charges-panel, .lux-svc-charge-row, .lux-svc-menu-category, .lux-svc-card, .lux-svc-food-card, .lux-svc-charge-card, .lux-kalongo-reveal, .lux-kalongo-hero, .lux-kalongo-card, .lux-booking-reveal, .lux-booking-feature, .reviews, .room-card, .facility-item, .gallery-item-modern, .eco-video-card, .activity-card-modern, .accommodation-card-modern, .food-card-modern, .activities-group, .about-luxury-wrap, .pricing-hero-content, .activities-hero-content, .booking-hero-content, .lux-svc-hero-inner'
    );
    nodes.forEach((el, i) => {
      el.classList.add('eco-reveal');
      if (i % 3 === 1) el.classList.add('eco-reveal-delay-1');
      if (i % 3 === 2) el.classList.add('eco-reveal-delay-2');
    });
    if (prefersReduced) {
      nodes.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    nodes.forEach((el) => io.observe(el));
  }

  function initNavbar() {
    const header = document.querySelector('.header');
    if (!header) return;
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const sections = document.querySelectorAll('section[id], section[id="home"]');
    const navLinks = document.querySelectorAll('.nav-link[href*="#"]');
    if (!sections.length || !navLinks.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const id = e.target.id || 'home';
          navLinks.forEach((link) => {
            const href = link.getAttribute('href') || '';
            const active = href === `/#${id}` || href === `#${id}` || (id === 'home' && (href === '/' || href.endsWith('index.html')));
            link.classList.toggle('is-active', active);
          });
        });
      },
      { threshold: 0.35 }
    );
    document.querySelectorAll('#home, #rooms, #facilities, #reviews, #about').forEach((s) => io.observe(s));
  }

  function initHeroParallax() {
    /* Subtle slide zoom only — no opacity fade (keeps hero text readable) */
    if (prefersReduced) return;
  }

  function initCounters() {
    const nums = document.querySelectorAll('[data-eco-count]');
    if (!nums.length || prefersReduced) return;
    const run = (el) => {
      const target = parseInt(el.getAttribute('data-eco-count'), 10) || 0;
      const suffix = el.getAttribute('data-eco-suffix') || '';
      const duration = 1800;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(target * ease) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target + suffix;
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            run(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    nums.forEach((el) => io.observe(el));
  }

  function initAboutImage() {
    const img = document.getElementById('ecoAboutImage');
    if (!img) return;
    const slide = document.querySelector('.hero-slide');
    if (slide && slide.style.backgroundImage) {
      const m = slide.style.backgroundImage.match(/url\(['"]?([^'")]+)/);
      if (m) img.src = m[1];
    }
  }

  function initImageShimmer() {
    document.querySelectorAll('img[loading="lazy"], .gallery-media-modern, .room-slide-image').forEach((img) => {
      if (img.complete) {
        img.classList.add('is-loaded');
        return;
      }
      img.classList.add('eco-shimmer');
      img.addEventListener('load', () => {
        img.classList.remove('eco-shimmer');
        img.classList.add('is-loaded');
      }, { once: true });
    });
  }

  function initLightbox() {
    let lb = document.getElementById('ecoLightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'ecoLightbox';
      lb.className = 'eco-lightbox';
      lb.innerHTML = '<button type="button" class="eco-modal-close" aria-label="Close">&times;</button><img src="" alt="">';
      document.body.appendChild(lb);
      lb.querySelector('.eco-modal-close').addEventListener('click', () => lb.classList.remove('is-open'));
      lb.addEventListener('click', (e) => {
        if (e.target === lb) lb.classList.remove('is-open');
      });
    }
    document.querySelectorAll('.gallery-item-modern.image-item-modern, .gallery-item-modern:not(.eco-video-card)').forEach((item) => {
      const media = item.querySelector('img.gallery-media-modern, img');
      if (!media || item.classList.contains('eco-video-card')) return;
      item.addEventListener('click', () => {
        const im = lb.querySelector('img');
        im.src = media.src;
        im.alt = media.alt || '';
        lb.classList.add('is-open');
      });
    });
  }

  function initVideoModal() {
    let modal = document.getElementById('ecoVideoModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'ecoVideoModal';
      modal.className = 'eco-video-modal';
      modal.innerHTML = '<button type="button" class="eco-modal-close" aria-label="Close">&times;</button><video controls playsinline></video>';
      document.body.appendChild(modal);
      const close = () => {
        modal.classList.remove('is-open');
        const v = modal.querySelector('video');
        v.pause();
        v.removeAttribute('src');
      };
      modal.querySelector('.eco-modal-close').addEventListener('click', close);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
      });
    }
    const openVideo = (card) => {
      const url = card.getAttribute('data-video-url');
      if (!url) return;
      const v = modal.querySelector('video');
      v.src = url;
      modal.classList.add('is-open');
      v.play().catch(() => {});
    };
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.eco-video-card');
      if (card) openVideo(card);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.eco-video-card');
      if (!card) return;
      e.preventDefault();
      openVideo(card);
    });
  }

  function initMobileChrome() {
    if (document.querySelector('.eco-fab-book')) return;
    const path = window.location.pathname;
    const isBooking = path.includes('booking');
    const fab = document.createElement('a');
    fab.href = '/booking.html';
    fab.className = 'eco-fab-book';
    fab.innerHTML = '<span aria-hidden="true">✦</span> Book';
    if (!isBooking) document.body.appendChild(fab);

    const nav = document.createElement('nav');
    nav.className = 'eco-mobile-nav';
    nav.setAttribute('aria-label', 'Mobile navigation');
    const items = [
      { href: '/', label: 'Home', icon: '<path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" fill="currentColor"/>', match: (p) => p === '/' || p.endsWith('index.html') },
      { href: '/#rooms', label: 'Rooms', icon: '<path d="M4 8h16v12H4V8zm2-4h12v4H6V4z" fill="currentColor"/>', match: () => false },
      { href: '/packages.html', label: 'Services', icon: '<path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z" fill="currentColor"/>', match: (p) => p.includes('packages') },
      { href: '/activities.html', label: 'Explore', icon: '<path d="M12 2L4 20h16L12 2zm0 6l4.5 9h-9L12 8z" fill="currentColor"/>', match: (p) => p.includes('activities') },
      { href: '/booking.html', label: 'Book', icon: '<path d="M8 4h8v2H8V4zm-2 4h12l-1 12H7L6 8z" fill="currentColor"/>', match: (p) => p.includes('booking'), book: true },
    ];
    items.forEach((item) => {
      const a = document.createElement('a');
      a.href = item.href;
      if (item.book) a.className = 'eco-nav-book';
      if (item.match(path)) a.classList.add('is-active');
      a.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${item.icon}</svg><span>${item.label}</span>`;
      nav.appendChild(a);
    });
    document.body.appendChild(nav);
  }

  function observeDynamicContent() {
    ['heroSlidesRendered', 'roomsRendered', 'reviewsRendered', 'servicesPageRendered'].forEach((ev) => {
      window.addEventListener(ev, () => {
        initAboutImage();
        initImageShimmer();
        initScrollReveal();
      });
    });
    const mo = new MutationObserver(() => initImageShimmer());
    document.querySelectorAll('.rooms-grid, .facilities-grid, .gallery-grid-modern, #reviewsSlider').forEach((el) => {
      mo.observe(el, { childList: true });
    });
  }

  function init() {
    document.documentElement.classList.add('eco-luxury-scroll');
    initAmbient();
    initNavbar();
    initHeroParallax();
    initCounters();
    initAboutImage();
    initImageShimmer();
    initScrollReveal();
    initLightbox();
    initVideoModal();
    initMobileChrome();
    observeDynamicContent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

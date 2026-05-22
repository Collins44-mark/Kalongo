/**
 * Our Kalongo — scroll reveal & gallery lightbox
 */
(function () {
  'use strict';

  if (!document.body.classList.contains('lux-kalongo-page')) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initScrollReveal() {
    const nodes = document.querySelectorAll('.lux-kalongo-reveal');
    if (!nodes.length) return;
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
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    nodes.forEach((el) => io.observe(el));
  }

  function initGalleryLightbox() {
    const lb = document.getElementById('ecoLightbox');
    if (!lb) return;
    document.querySelectorAll('.lux-kalongo-gallery-thumb').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const img = thumb.querySelector('img');
        if (!img) return;
        const im = lb.querySelector('img');
        im.src = img.src;
        im.alt = img.alt || '';
        lb.classList.add('is-open');
      });
    });
  }

  function initNavActive() {
    document.querySelectorAll('.nav-link[href*="our-kalongo"]').forEach((link) => {
      link.classList.add('is-active');
    });
  }

  function init() {
    initNavActive();
    initScrollReveal();
    initGalleryLightbox();
  }

  window.addEventListener('kalongoRendered', initScrollReveal);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

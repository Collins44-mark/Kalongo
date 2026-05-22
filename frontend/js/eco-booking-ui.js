/**
 * Booking page — scroll reveal
 */
(function () {
  'use strict';

  if (!document.body.classList.contains('lux-booking-page')) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initScrollReveal() {
    const nodes = document.querySelectorAll('.lux-booking-reveal');
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
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    nodes.forEach((el) => io.observe(el));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollReveal);
  } else {
    initScrollReveal();
  }
})();

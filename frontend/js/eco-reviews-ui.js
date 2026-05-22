/**
 * Premium Guest Reviews slider — nav, dots, swipe
 */
(function () {
  'use strict';

  let luxReviewSlider = null;

  function updateDots(index) {
    document.querySelectorAll('#reviews .lux-reviews-dot').forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
      dot.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
  }

  function buildDots(count) {
    const container = document.getElementById('luxReviewsDots');
    if (!container || count < 1) return;
    container.innerHTML = '';
    const maxDots = Math.min(count, 8);
    for (let i = 0; i < maxDots; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lux-reviews-dot' + (i === 0 ? ' is-active' : '');
      btn.setAttribute('aria-label', `Show review ${i + 1}`);
      btn.dataset.index = String(i);
      btn.addEventListener('click', () => {
        if (luxReviewSlider) luxReviewSlider.goTo(i);
      });
      container.appendChild(btn);
    }
  }

  function initLuxReviewSlider() {
    const section = document.querySelector('#reviews.lux-reviews-section');
    if (!section) return;

    const sliderContainer = section.querySelector('.lux-reviews-slider-container, .reviews-slider-container');
    if (!sliderContainer) return;

    const slides = sliderContainer.querySelectorAll('.lux-review-slide');
    if (slides.length === 0) return;

    buildDots(slides.length);

    const prevBtn = section.querySelector('.lux-review-nav--prev');
    const nextBtn = section.querySelector('.lux-review-nav--next');

    if (typeof createSwipeSlider !== 'function') {
      console.warn('createSwipeSlider not available');
      return;
    }

    luxReviewSlider = createSwipeSlider(sliderContainer, {
      slideSelector: '.lux-review-slide',
      autoAdvanceMs: 0,
      onSlideChange: (idx) => updateDots(idx),
    });

    if (luxReviewSlider?.stopAutoAdvance) {
      luxReviewSlider.stopAutoAdvance();
    }

    if (prevBtn) {
      prevBtn.onclick = () => luxReviewSlider?.prev();
    }
    if (nextBtn) {
      nextBtn.onclick = () => luxReviewSlider?.next();
    }

    updateDots(0);
    console.log('✅ Luxury reviews slider initialized');
  }

  window.addEventListener('reviewsRendered', () => {
    setTimeout(initLuxReviewSlider, 180);
  });
})();

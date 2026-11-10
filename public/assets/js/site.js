/* Zorp's Universe site — shared interactivity (reveal-on-scroll, footer year) */
(function () {
  'use strict';

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05 },
  );

  const reveal = (selector) => {
    document.querySelectorAll(selector).forEach((el) => observer.observe(el));
  };

  /** First-paint pass — anything already in viewport reveals immediately, no scroll needed. */
  const revealAboveFold = () => {
    const vh = window.innerHeight;
    document.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < vh && rect.bottom > 0) {
        el.classList.add('is-visible');
      }
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    reveal('[data-reveal]');
    reveal('[data-reveal-stagger]');
    requestAnimationFrame(revealAboveFold);

    const yearEl = document.querySelector('[data-current-year]');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });

  // Lightweight track stub — drop in Umami later, same .trackEvent() signature as RoB.
  window.cosmos = window.cosmos || {};
  window.cosmos.trackEvent = function (name, payload) {
    if (window.umami && typeof window.umami.track === 'function') {
      window.umami.track(name, payload);
    } else if (typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.debug('[track]', name, payload);
    }
  };
})();

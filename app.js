// CoDi landing — minimal interactivity. No framework, no build step.

(() => {
  // --- Install tab switcher ---
  const tabs = document.querySelectorAll('.install-tab');
  const cmds = document.querySelectorAll('.install-cmd');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach((t) => t.classList.toggle('tab-active', t === tab));
      cmds.forEach((c) => c.classList.toggle('hidden', c.dataset.tab !== target));
    });
  });

  // --- Reveal on scroll for steps + cards (cheap fade-up) ---
  const reveal = (el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
  };

  const targets = document.querySelectorAll('.step, .type-card, .surface-card, .price-card, .open-card');
  targets.forEach(reveal);

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

    targets.forEach((t) => io.observe(t));
  } else {
    targets.forEach((t) => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
  }

  // --- FAQ accordion: only one open at a time (small but feels intentional) ---
  const faqs = document.querySelectorAll('.faq');
  faqs.forEach((f) => {
    f.addEventListener('toggle', () => {
      if (f.open) {
        faqs.forEach((other) => { if (other !== f) other.open = false; });
      }
    });
  });

  // --- Smooth-scroll polyfill for the install/playground/demo CTAs (modern browsers already do this) ---
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();

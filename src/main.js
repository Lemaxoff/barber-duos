import { inject } from '@vercel/analytics';

// Vercel Web Analytics is emitted only in production builds.
if (import.meta.env.PROD) {
  inject();
}

function initLegalModal() {
  const layer = document.querySelector('[data-legal-layer]');
  const dialog = layer?.querySelector('[role="dialog"]');
  const backdrop = layer?.querySelector('[data-legal-backdrop]');
  const triggers = document.querySelectorAll('[data-legal-open]');
  const closeButtons = layer?.querySelectorAll('[data-legal-close]') ?? [];

  if (!layer || !dialog || !backdrop || triggers.length === 0) return;

  let returnFocus = null;
  let closeTimer = null;

  const focusable = () => [...dialog.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )];

  function openModal(event) {
    event?.preventDefault();
    window.clearTimeout(closeTimer);
    returnFocus = document.activeElement;
    layer.hidden = false;
    layer.setAttribute('aria-hidden', 'false');
    backdrop.dataset.state = 'open';
    dialog.dataset.state = 'open';
    document.body.style.overflow = 'hidden';
    queueMicrotask(() => dialog.focus());
  }

  function closeModal() {
    if (layer.hidden) return;
    backdrop.dataset.state = 'closed';
    dialog.dataset.state = 'closed';
    closeTimer = window.setTimeout(() => {
      layer.hidden = true;
      layer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (returnFocus instanceof HTMLElement) returnFocus.focus();
    }, 200);
  }

  triggers.forEach((trigger) => trigger.addEventListener('click', openModal));
  closeButtons.forEach((button) => button.addEventListener('click', closeModal));
  backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', (event) => {
    if (layer.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusable();
    if (items.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function initMobileMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (!toggle || !menu) return;

  const lines = [...toggle.querySelectorAll('span')];
  const classes = [
    ['translate-y-2', 'rotate-45'],
    ['opacity-0'],
    ['-translate-y-2', '-rotate-45'],
  ];

  function setOpen(open) {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    lines.forEach((line, index) => {
      classes[index]?.forEach((className) => line.classList.toggle(className, open));
    });
  }

  toggle.addEventListener('click', () => setOpen(menu.hidden));
  menu.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) setOpen(false);
  });
}

function initOpeningStatus() {
  const badge = document.querySelector('#top .absolute.top-24.right-6');
  if (!badge) return;

  badge.dataset.statusBadge = 'hero';
  badge.classList.remove('hidden');

  const contactColumn = document.querySelector('#contact > div > div > div');
  if (contactColumn && !contactColumn.querySelector('[data-status-badge="contact"]')) {
    const contactBadge = badge.cloneNode(true);
    contactBadge.dataset.statusBadge = 'contact';
    contactBadge.classList.remove('absolute', 'top-24', 'right-6', 'lg:right-10', 'z-20', 'md:block');
    contactBadge.classList.add('relative', 'inline-block', 'mb-6');
    contactBadge.removeAttribute('aria-hidden');
    contactBadge.removeAttribute('id');
    contactBadge.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
    contactColumn.querySelector('h2')?.after(contactBadge);
  }

  badge.style.transition = 'opacity 220ms ease, transform 220ms ease';
  const updateVisibility = () => {
    const atTop = window.scrollY <= 24;
    badge.style.opacity = atTop ? '1' : '0';
    badge.style.transform = atTop ? 'translateY(0)' : 'translateY(-8px)';
    badge.style.pointerEvents = atTop ? '' : 'none';
    badge.setAttribute('aria-hidden', String(!atTop));
  };

  window.addEventListener('scroll', updateVisibility, { passive: true });
  updateVisibility();
}

function initTodaySchedule() {
  const schedule = document.querySelector('#horaires');
  const rows = [...(schedule?.querySelectorAll('li') ?? [])];
  if (rows.length === 0) return;

  // The displayed list starts on Monday, while Date.getDay() starts on Sunday.
  const weekdaysInListOrder = [1, 2, 3, 4, 5, 6, 0];
  rows.forEach((row, index) => {
    if (!row.dataset.weekday) row.dataset.weekday = String(weekdaysInListOrder[index] ?? index);
  });

  const todayNumber = new Date().getDay();
  const todayRow = rows.find((row) => Number(row.dataset.weekday) === todayNumber);
  if (!todayRow) return;

  let todayBadge = schedule.querySelector('[data-today-badge]');
  if (!todayBadge) {
    todayBadge = [...schedule.querySelectorAll('span')].find(
      (element) => element.textContent.trim().toLocaleLowerCase('fr') === "aujourd'hui",
    );
  }

  rows.forEach((row) => {
    [...row.classList].forEach((className) => {
      const isHaloClass = /^(?:glow|shadow|ring|drop-shadow)(?:-|:|\[|$)/i.test(className);
      const isRedBorderOrFill = /^(?:border|bg|outline)(?:-|:|\[)/i.test(className)
        && /(?:red|#d92626|217[_ ,]+38[_ ,]+38)/i.test(className);
      if (isHaloClass || isRedBorderOrFill) row.classList.remove(className);
    });
    row.classList.add('border-white/10');
    row.style.boxShadow = '';
    row.style.filter = '';
  });
  todayRow.classList.remove('border-white/10');
  todayRow.classList.add('border-[#d92626]', 'bg-[#d92626]/10');
  todayRow.style.boxShadow = '0 0 18px rgba(217, 38, 38, 0.22)';

  if (todayBadge) {
    todayBadge.dataset.todayBadge = '';
    const dayLabel = todayRow.querySelector('span.flex.items-center.gap-2') ?? todayRow.firstElementChild;
    dayLabel?.append(document.createTextNode(' '), todayBadge);
  }
}

function initReviewStars() {
  const setStarColor = (star, color) => {
    star.setAttribute('fill', color);
    star.setAttribute('stroke', color);
    star.style.setProperty('fill', color);
    star.style.setProperty('stroke', color);
    star.style.setProperty('color', color);
  };

  const summaryStars = document.querySelectorAll(
    '#avis .mt-5.flex.items-center.justify-center.gap-2 svg.lucide-star',
  );
  summaryStars.forEach((star) => {
    setStarColor(star, '#D92626');
  });

  const reviewCards = [...document.querySelectorAll('#avis figure')];
  reviewCards.forEach((card) => {
    card.querySelectorAll('svg.lucide-star').forEach((star) => {
      setStarColor(star, '#1B4DC4');
    });
  });

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const revealStars = (card) => {
    if (reducedMotion || typeof Element.prototype.animate !== 'function') return;
    [...card.querySelectorAll('svg.lucide-star')].forEach((star, index) => {
      star.animate(
        [
          { opacity: 0, transform: 'scale(0.55) rotate(-18deg)' },
          { opacity: 1, transform: 'scale(1) rotate(0deg)' },
        ],
        {
          duration: 420,
          delay: index * 65,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'both',
        },
      );
    });
  };

  if (reviewCards.length === 0) return;
  if (!('IntersectionObserver' in window)) {
    reviewCards.forEach(revealStars);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      revealStars(entry.target);
    });
  }, { threshold: 0.2 });
  reviewCards.forEach((card) => observer.observe(card));
}

function initPriceAccordion() {
  const buttons = [...document.querySelectorAll('#tarifs button')];
  if (buttons.length === 0) return;

  const plusTemplate = buttons
    .map((button) => button.querySelector('svg.lucide-plus'))
    .find(Boolean)?.cloneNode(true);
  const minusTemplate = buttons
    .map((button) => button.querySelector('svg.lucide-minus'))
    .find(Boolean)?.cloneNode(true);

  function setOpen(button, open) {
    const panel = button.nextElementSibling;
    if (!panel) return;
    const title = button.querySelector('span[class*="text-xl"]');
    const icon = button.querySelector('svg');

    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-controls', panel.id);
    panel.classList.toggle('grid-rows-[1fr]', open);
    panel.classList.toggle('grid-rows-[0fr]', !open);
    panel.classList.toggle('opacity-100', open);
    panel.classList.toggle('opacity-0', !open);
    panel.classList.toggle('pb-6', open);
    title?.classList.toggle('text-[#d92626]', open);
    title?.classList.toggle('text-[#F4F4F5]', !open);

    const template = open ? minusTemplate : plusTemplate;
    if (icon && template && icon.outerHTML !== template.outerHTML) {
      icon.replaceWith(template.cloneNode(true));
    }
  }

  buttons.forEach((button, index) => {
    const panel = button.nextElementSibling;
    if (panel && !panel.id) panel.id = `tarif-detail-${index + 1}`;
    const initiallyOpen = panel?.classList.contains('grid-rows-[1fr]') ?? false;
    setOpen(button, initiallyOpen);
    button.addEventListener('click', () => {
      const shouldOpen = button.getAttribute('aria-expanded') !== 'true';
      buttons.forEach((other) => setOpen(other, false));
      if (shouldOpen) setOpen(button, true);
    });
  });
}

function initScrollReveals() {
  const pending = [...document.querySelectorAll('[data-static-reveal="pending"]')];
  if (pending.length === 0) return;

  const show = (element) => {
    const style = element.style;
    const startOpacity = Number.parseFloat(style.opacity || '0');
    const startTransform = style.transform || 'translateY(28px)';
    element.removeAttribute('data-static-reveal');

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      style.opacity = '1';
      style.transform = 'none';
      return;
    }

    if (typeof element.animate !== 'function') {
      style.opacity = '1';
      style.transform = 'none';
      return;
    }

    const animation = element.animate(
      [
        { opacity: startOpacity, transform: startTransform },
        { opacity: 1, transform: 'translateY(0px)' },
      ],
      { duration: 650, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' },
    );
    animation.addEventListener('finish', () => {
      style.opacity = '1';
      style.transform = 'none';
    }, { once: true });
  };

  if (!('IntersectionObserver' in window)) {
    pending.forEach(show);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      show(entry.target);
    });
  }, { threshold: 0.12 });
  pending.forEach((element) => observer.observe(element));
}

initLegalModal();
initMobileMenu();
initOpeningStatus();
initTodaySchedule();
initReviewStars();
initPriceAccordion();
initScrollReveals();

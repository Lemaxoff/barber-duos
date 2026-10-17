import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@vercel/analytics', () => ({ inject: vi.fn() }));

const fixture = () => {
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const rows = days.map((day) => `
    <li class="flex items-center justify-between gap-2 py-3 px-3 sm:px-5 rounded-xl border border-white/10">
      <span class="flex items-center gap-2 min-w-0">${day}${day === 'Jeudi' ? ' <span class="today-pill">Aujourd\'hui</span>' : ''}</span>
      <span class="text-sm sm:text-lg font-mono whitespace-nowrap text-[#F4F4F5]">9h – 18h</span>
    </li>`).join('');

  document.body.innerHTML = `
    <main>
      <section id="top">
        <div class="absolute top-24 right-6 lg:right-10 z-20 hidden md:block">
          <span>Ouvert</span><span>Sans rendez-vous — passez maintenant</span>
        </div>
      </section>
      <header>
        <button data-menu-toggle aria-expanded="false" aria-label="Menu">
          <span class="block w-7 h-0.5 bg-current transition-transform"></span>
          <span class="block w-7 h-0.5 bg-current transition-opacity"></span>
          <span class="block w-7 h-0.5 bg-current transition-transform"></span>
        </button>
        <div data-mobile-menu hidden><a href="#tarifs">Tarifs</a></div>
      </header>
      <section id="tarifs">
        <div><button><span class="text-xl text-[#d92626]">Coupe</span><span><svg class="lucide-plus"></svg></span></button>
          <div id="coupe" class="grid grid-rows-[1fr] opacity-100 pb-6"><p>Coupe personnalisée</p></div></div>
        <div><button><span class="text-xl text-[#F4F4F5]">Barbe</span><span><svg class="lucide-plus"></svg></span></button>
          <div id="barbe" class="grid grid-rows-[0fr] opacity-0"><p>Taille de barbe</p></div></div>
      </section>
      <section id="horaires"><ul>${rows}</ul></section>
      <section id="avis">
        <div class="text-center mb-14">
          <div class="mt-5 flex items-center justify-center gap-2">
            ${Array.from({ length: 5 }, () => '<span><svg class="lucide lucide-star"></svg></span>').join('')}
            <span>5,0 · recommandés</span>
          </div>
        </div>
        <figure><div class="flex items-center gap-1">
          ${Array.from({ length: 5 }, () => '<span><svg class="lucide lucide-star"></svg></span>').join('')}
        </div></figure>
      </section>
      <button data-legal-open>Mentions légales &amp; Confidentialité</button>
      <div data-legal-layer hidden aria-hidden="true">
        <div data-legal-backdrop data-state="closed"></div>
        <div role="dialog" data-state="closed" tabindex="-1">
          <button type="button" data-legal-close>Fermer</button>
        </div>
      </div>
      <footer id="contact"><div><div><div><h2>Nous trouver</h2><p>Rue Flémalle-Grande 7</p></div></div></div></footer>
    </main>
  `;
};

async function loadInteractions() {
  vi.resetModules();
  await import('../main.js');
}

describe('interactions du site', () => {
  beforeEach(() => {
    fixture();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('ouvre la modal légale et la ferme avec Échap', async () => {
    await loadInteractions();
    const layer = document.querySelector('[data-legal-layer]');
    document.querySelector('[data-legal-open]').click();
    expect(layer.hidden).toBe(false);
    expect(layer.querySelector('[role="dialog"]').dataset.state).toBe('open');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise((resolve) => window.setTimeout(resolve, 210));
    expect(layer.hidden).toBe(true);
  });

  it('bascule l’accordéon de tarifs avec une seule prestation ouverte à la fois', async () => {
    await loadInteractions();
    const [coupe, barbe] = document.querySelectorAll('#tarifs button');
    expect(coupe.getAttribute('aria-expanded')).toBe('true');
    barbe.click();
    expect(barbe.getAttribute('aria-expanded')).toBe('true');
    expect(barbe.nextElementSibling.classList.contains('grid-rows-[1fr]')).toBe(true);
    expect(coupe.getAttribute('aria-expanded')).toBe('false');
    expect(coupe.nextElementSibling.classList.contains('grid-rows-[0fr]')).toBe(true);
  });

  it('ouvre et referme le menu mobile avec son bouton et ses liens', async () => {
    await loadInteractions();
    const button = document.querySelector('[data-menu-toggle]');
    const menu = document.querySelector('[data-mobile-menu]');
    button.click();
    expect(menu.hidden).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    menu.querySelector('a').click();
    expect(menu.hidden).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('affiche le badge sur mobile, le masque au défilement et le garde dans Nous trouver', async () => {
    await loadInteractions();
    const heroBadge = document.querySelector('[data-status-badge="hero"]');
    const contactBadge = document.querySelector('[data-status-badge="contact"]');
    expect(heroBadge).not.toBeNull();
    expect(heroBadge.classList.contains('hidden')).toBe(false);
    expect(heroBadge.style.opacity).toBe('1');
    expect(contactBadge).not.toBeNull();
    expect(contactBadge.textContent).toContain('Sans rendez-vous');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 240 });
    window.dispatchEvent(new Event('scroll'));
    expect(heroBadge.style.opacity).toBe('0');
    expect(heroBadge.getAttribute('aria-hidden')).toBe('true');
    expect(contactBadge.style.opacity).toBe('');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    window.dispatchEvent(new Event('scroll'));
    expect(heroBadge.style.opacity).toBe('1');
    expect(heroBadge.getAttribute('aria-hidden')).toBe('false');
  });

  it('place AUJOURD’HUI sur le jour donné par Date.getDay()', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-17T12:00:00')); // samedi : getDay() === 6
    await loadInteractions();

    const rows = [...document.querySelectorAll('#horaires li')];
    const today = rows.find((row) => row.dataset.weekday === '6');
    const formerThursday = rows.find((row) => row.dataset.weekday === '4');
    expect(today.querySelector('[data-today-badge]')?.textContent).toBe("Aujourd'hui");
    expect(formerThursday.querySelector('[data-today-badge]')).toBeNull();
    expect(today.classList.contains('border-[#d92626]')).toBe(true);
    expect(formerThursday.classList.contains('border-[#d92626]')).toBe(false);
  });

  it('garde les étoiles de synthèse rouges et anime les étoiles bleues des cartes', async () => {
    const animate = vi.fn();
    Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: animate });
    await loadInteractions();

    const summaryStars = document.querySelectorAll('#avis .mt-5.flex.items-center.justify-center.gap-2 svg.lucide-star');
    const cardStars = document.querySelectorAll('#avis figure svg.lucide-star');
    expect(summaryStars).toHaveLength(5);
    expect(cardStars).toHaveLength(5);
    summaryStars.forEach((star) => {
      expect(star.style.color).toBe('rgb(217, 38, 38)');
      expect(star.style.fill).toBe('#D92626');
    });
    cardStars.forEach((star) => {
      expect(star.style.color).toBe('rgb(27, 77, 196)');
      expect(star.style.fill).toBe('#1B4DC4');
    });
    expect(animate).toHaveBeenCalledTimes(5);
    expect(animate.mock.calls[4][1].delay).toBe(260);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@vercel/analytics', () => ({ inject: vi.fn() }));

const fixture = () => {
  document.body.innerHTML = `
    <header>
      <button data-menu-toggle aria-expanded="false" aria-label="Menu">
        <span class="block w-7 h-0.5 bg-current transition-transform"></span>
        <span class="block w-7 h-0.5 bg-current transition-opacity"></span>
        <span class="block w-7 h-0.5 bg-current transition-transform"></span>
      </button>
      <div data-mobile-menu hidden><a href="#tarifs">Tarifs</a></div>
    </header>
    <section id="tarifs">
      <div><button><span class="text-xl text-[#d92626]">Coupe</span><span><svg class="lucide-minus"></svg></span></button>
        <div id="coupe" class="grid grid-rows-[1fr] opacity-100 pb-6"><p>Coupe personnalisée</p></div></div>
      <div><button><span class="text-xl text-[#F4F4F5]">Barbe</span><span><svg class="lucide-plus"></svg></span></button>
        <div id="barbe" class="grid grid-rows-[0fr] opacity-0"><p>Taille de barbe</p></div></div>
    </section>
    <button data-legal-open>Mentions légales &amp; Confidentialité</button>
    <div data-legal-layer hidden aria-hidden="true">
      <div data-legal-backdrop data-state="closed"></div>
      <div role="dialog" data-state="closed" tabindex="-1">
        <button type="button" data-legal-close>Fermer</button>
      </div>
    </div>
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
});

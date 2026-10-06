// Eventos de clique prontos para medir (GA4/GTM via dataLayer):
// comprar, assinar, whatsapp, modal_aberto, quiz_concluido, capitulo_aberto, instagram, slider
window.dataLayer = window.dataLayer || [];

const NAMES = { comprar: 'clique_comprar', assinar: 'clique_assinar', whatsapp: 'clique_whatsapp', capitulo: 'capitulo_aberto', instagram: 'clique_instagram' };

export function track(event, params = {}) {
  window.dataLayer.push({ event, ...params });
  if (import.meta.env.DEV) console.debug('[track]', event, params);
}

export function initAnalytics() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track]');
    if (!el) return;
    const kind = el.dataset.track;
    track(NAMES[kind] || kind, { local: el.dataset.trackPlace || '', destino: el.getAttribute('href') || '' });
  });
}

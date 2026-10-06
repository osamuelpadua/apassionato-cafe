// Links de conversão. Conferir antes de publicar (lidos na loja em 05/10/2026).
export const STORE = 'https://loja.appassionatocafe.com.br';
export const CLUB_PATH = '/clube';
export const WA_NUMBER = '5535999565000';
export const WA_DISPLAY = '(35) 99956-5000';

export const WA_MSG = {
  float: 'Olá! Vim pela página da Appassionato e gostaria de ajuda.',
  club: 'Olá! Quero saber mais sobre o Clube de Assinatura.',
  product: (produto, variacao) => `Olá! Quero comprar o café ${produto} (${variacao}). Pode me ajudar?`,
};

/** Link da loja com UTM (utm_source=landing, utm_medium=botao) e o local do clique em utm_content. */
export function storeUrl(path = '/', place) {
  const url = new URL(path, STORE);
  url.searchParams.set('utm_source', 'landing');
  url.searchParams.set('utm_medium', 'botao');
  if (place) url.searchParams.set('utm_content', place);
  return url.toString();
}

export function waUrl(message) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

# Appassionato Café — notas de implementação

Protótipo navegável de alta fidelidade da landing page e do modelo de página interna de história.
HTML, CSS e JS puros, com Vite. Sem framework e sem bibliotecas de runtime.

## Como rodar

```bash
npm install
npm run dev        # http://localhost:5180  (home, /historia.html, /design-system.html)
npm run build      # gera dist/ estático (caminhos relativos, base './')
npm run preview    # serve o dist/ em http://localhost:4180
node scripts/verify.mjs [url]   # 55 verificações ponta a ponta + axe; capturas em docs/estados/
```

`dist/` pode ir para qualquer hospedagem estática. Para os links internos funcionarem, a página da história precisa ficar em `historia.html`, ao lado de `index.html`.

## Estrutura

```
index.html  historia.html  design-system.html
partials/        header.html, footer.html (rodapé, barra fixa, WhatsApp, cookies, modal), sprite.html (ícones)
src/styles/      tokens.css · base.css · components.css · sections.css · historia.css · design-system.css
src/js/          main.js (home) · historia.js · design-system.js · utils.js
src/js/components/  header · compareSlider · motion (reveal + parallax) · journey · quiz · showcase
                    productModal · clubSelector · widgets (carrossel, FAQ) · analytics
src/js/data/     products.js · content.js (depoimentos, FAQ, planos) · chapters.js · links.js · image-sizes.json
src/assets/svg/  logo-horizontal.svg · logo-stacked.svg · symbol.svg (gerados por scripts/build-logo.mjs)
public/img/      imagens finais AVIF + WebP em várias larguras (geradas por scripts/optimize-images.mjs)
scripts/         fetch-store-assets · build-logo · brand-drip · optimize-images · verify · shot · shot-el · overflow
_ref/            originais baixados da loja e gerados no Magnific (fora do build)
```

O `vite.config.js` tem um plugin de HTML que expande, no build:
- `<x-include src>`: parciais compartilhados (cabeçalho e rodapé iguais nas páginas);
- `<x-pic name sizes alt>`: vira um `<picture>` com AVIF + WebP, `srcset` e `width`/`height` (evita CLS);
- `<x-logo variant>` e `<x-symbol>`: o logo e o símbolo são declarados uma vez no sprite e reutilizados com `<use>`. A cor do nome vem de `--logo-name` e a do símbolo, do "ppa" e do "Café" vem de `--logo-mark`.

## Pontos de quebra e medidas

| Faixa | Largura | Margem lateral | Notas |
|---|---|---|---|
| Celular | até 767 px | 20 px | Coluna única; barra fixa Comprar/Assinar; carrosséis com snap |
| Tablet | 768–1023 px | 32 px | Vitrine em 3 colunas; jornada sem tela fixa |
| Laptop | 1024–1439 px | `clamp(32px, 4vw, 64px)` | Grade completa |
| Desktop | 1440–1919 px | fluida | Conteúdo até 1440 px |
| Tela larga | 1920 px+ | fluida | Conteúdo até 1600 px; fundos preenchem tudo |

- Cabeçalho: 72 px no celular e 80 px a partir de 768 px. Alvos de toque de 48 px no mínimo; CTAs principais com 52–56 px.
- Tipografia fluida: hero 40→96 px, h2 32→64 px, corpo 16→18 px, rótulos 12–13 px com espaçamento de 0,22em.
- Raios de 12/18/24/32 px e pílula. Sombras quentes em rgba do espresso. Tokens em `src/styles/tokens.css`; referência visual em `design-system.html`.

## Componentes e comportamentos

| Componente | Arquivo | Comportamento |
|---|---|---|
| Cabeçalho | `header.js` | Transparente até 80 px de rolagem, depois marrom com desfoque. Item ativo por IntersectionObserver. Menu do celular em gaveta com foco preso e ESC. Na home, `index.html#x` vira `#x`. |
| Barra fixa (celular) | `header.js` | Aparece quando os CTAs da primeira dobra saem da tela; respeita `safe-area-inset-bottom`; o WhatsApp sobe junto. |
| Slider antes/depois | `compareSlider.js` | `clip-path` controlado por `--pos`. Arraste pela alça (mouse em qualquer ponto no desktop; só a alça no celular, o resto mantém `pan-y`), clique na trilha, setas ±5 %, Home/End, `role="slider"`. Demonstração 50→30→70→50 em 2,5 s: no hero 1,2 s após carregar, uma vez por sessão; no clube quando 60 % do bloco está visível. Aceita `<video>` nas camadas (pausa fora da tela, botão de pausa). |
| Jornada | `journey.js`, `motion.js` | 5 etapas de 140svh com tela fixa de 100svh (abaixo do limite de 1,5 tela). Parallax: fundo a 0,18×, ramos a 0,5×, só com `translate3d`. Pontos-grão fixos à direita; no celular, barra de progresso fina, cartões sem tela fixa e 1 camada de parallax. |
| Quiz | `quiz.js` | Início → 3 perguntas (radiogroup, setas, Enter/Espaço, voltar) → resultado com `aria-live`, chuva de grãos (1 s) e "Ver detalhes e comprar", que abre o modal. Regra em `QUIZ_MAP` (`products.js`). Nada é salvo. |
| Vitrine | `showcase.js` | Cartões gerados de `products.js`; filtro com animação FLIP. 4 colunas, 3 abaixo de 1280 px, carrossel com snap (~1,3 cartão) no celular. Sem preço. |
| Modal de produto | `productModal.js` | Desktop: 2 colunas de ~1000 px. Celular: bottom sheet de 92dvh com alça de arraste (fecha ao arrastar mais de 120 px). Variações em radiogroup atualizam o link da loja e o WhatsApp. Barra de compra fixa. Foco preso e devolvido, fundo travado, ESC e clique fora fecham, setas anterior/próximo, hash `#cafe-<id>` (o hash anterior volta ao fechar). |
| Seletor do clube | `clubSelector.js` | Radiogroup segmentado (mensal inicial, selo "Mais escolhido"). Contador de % em 600 ms; linha do tempo de 6 meses com 12/6/3 grãos em cascata de 40 ms. |
| Carrossel | `widgets.js` | Scroll-snap, setas, pontos, arraste com mouse e setas do teclado. |
| FAQ | `widgets.js` | Um item aberto por vez, `aria-expanded`; painel fechado com `inert`. |
| Revelação | `motion.js` | Fade + 24 px, 600 ms, dispara uma vez a 15 % visível; atraso escalonado via `--reveal-delay`. |
| Medição | `analytics.js` | `dataLayer.push` para `clique_comprar`, `clique_assinar`, `clique_whatsapp`, `modal_aberto`, `quiz_concluido`, `capitulo_aberto`, `video_play`, `slider`. Basta instalar o GTM/GA4. |

Com `prefers-reduced-motion`: sem demonstração do slider, sem zoom de fundo, sem parallax, sem chuva de grãos, sem subida do modal; revelações viram fade curto. O parallax também desliga em aparelhos com 4 núcleos ou menos, ou com 2 GB de memória ou menos.

## Modelo de dados dos produtos (`src/js/data/products.js`)

```js
{
  id: 'delicato',               // usado no hash #cafe-delicato
  nome, nomeCompleto, linha,
  formato: 'graos' | 'moido' | 'capsulas' | 'drip' | 'kits',   // filtro da vitrine
  selo: 'Grãos · 250 g e 1 kg',
  variacoes: [{ rotulo: '250 g', path: '/cafe-especial/...' }],  // caminho na loja; o link recebe UTM
  notas: ['Avelã', 'Caramelo'], torra,
  curta,                        // cartão (até 2 linhas)
  completa: ['parágrafo', ...], // modal
  ficha: { Torra, Notas, Origem, Pontuação, Preparo, Peso },
  imagem: 'pack-delicato-graos',// nome no manifesto de imagens
  clube: true,                  // mostra "Ou assine e ganhe até 22%" (só grãos, moído, cápsulas)
  tbc: ['completa', 'Pontuação']// campos exibidos com o selo [confirmar]
}
```

A mensagem do WhatsApp é montada a partir de `WA_MSG.product(nomeCompleto, variação)` em `links.js`. Os links da loja recebem `utm_source=landing&utm_medium=botao&utm_content=<local>`. O layout suporta de 6 a 12 cartões.

## Imagens

- Embalagens: fotos oficiais da loja em resolução cheia (`scripts/fetch-store-assets.mjs`), com fundo removido no Magnific. As cápsulas já vinham com fundo transparente.
- Cenas (hero, jornada, clube, CTA, quiz, Instagram, colheita) geradas no Magnific (Seedream 5 Pro), com luz dourada e sem pessoas identificáveis (só mãos). Ramos em traço gerados em vetor (Recraft) e rasterizados com alfa em duas tintas.
- A cena de produto (Open Graph e um post do Instagram) foi gerada com a embalagem real como referência; as letras miúdas do rótulo saíram deformadas, então ela é provisória.
- Para trocar ou adicionar imagens: coloque o original em `_ref/`, registre em `scripts/optimize-images.mjs` e rode `npm run assets:optimize`.

## Decisões que se afastaram do briefing

- **Vídeos substituídos por fotos:** sem vídeos do cliente, o hero, a jornada e o clube usam fotos com zoom lento (só `transform`, iniciado depois do carregamento e pausável); o componente já aceita `<video>` sem mudança de código.
- **Logo vetorizado da embalagem:** o PDF do logo não estava disponível, então o logo foi vetorizado da foto da embalagem Especial publicada na loja, sem redesenho, e está marcado para troca pelo vetor oficial.
- **Fontes:** Inter Tight (títulos em peso 600; palavras de destaque em itálico 500, laranja, com 7° de inclinação extra) e Manrope (texto e interface). A combinação anterior, Playfair Display + Montserrat, segue disponível para comparação com `?tipo=classica` na URL (`src/styles/type.css`).
- **Grão:** duas texturas geradas por `scripts/build-grain.mjs`. A neutra (`grain.png`) fica nos fundos claros; a só de grãos escuros (`grain-dark.png`) fica nos fundos escuros e nas fotos, para não clarear a imagem. A intensidade é ajustada por bloco com `--grain` (`src/styles/scroll.css`). Nas fotos, o grão fica abaixo da interface.
- **Vidro:** desfoque real (`backdrop-filter`) só no cabeçalho e em elementos pequenos sobre fotos (`src/styles/glass.css`). Os painéis grandes do clube usam vidro fosco com tinta quase opaca, sem desfoque: é mais leve na rolagem e o grão do fundo não atravessa.
- **Cores de ação:** o laranja da marca é a cor de destaque. O botão principal é laranja cheio e o secundário é contorno, sem dourado. A alça do slider é um círculo laranja sem contorno, com pulso até a primeira interação.
- **Script laranja-queimado em fundo claro:** o laranja #F07320 sobre creme dá 2,6:1, então palavras em script sobre fundo claro usam o laranja queimado #C84E0C; o laranja vivo fica no escuro e nos botões.
- **Verde do WhatsApp mais escuro:** #167F43, para o texto branco passar no AA (5:1).
- **Barra fixa só depois do hero:** no celular, a barra Comprar/Assinar aparece quando os CTAs da primeira dobra saem da tela, para não duplicar botões no primeiro quadro.
- **Capítulo definido pelo hash:** `historia.html#colheita` e os demais usam um único modelo, como nos links pedidos (`/historia#plantio`).
- **Títulos das etapas:** a tabela da jornada não trazia títulos, então foram sugeridos títulos curtos ("Raízes em Garça", "No ponto certo" etc.), marcados [confirmar].
- **Ordem das seções:** mantida a do briefing; não houve motivo forte para mudar.

## Modo de revisão

Os selos [confirmar]/[exemplo] e as notas de mídia provisória ficam ocultos no site. Para vê-los, abra qualquer página com `?revisao` na URL (ex.: `index.html?revisao`).

## Movimento de rolagem

- Rolagem suave com Lenis (só mouse/trackpad; desligada no toque e com reduced-motion).
- `scroll.js`: um laço por quadro que escreve variáveis CSS — `--hx` (hero fixo que recua e escurece enquanto a história sobe por cima), `--e`/`--c` (etapas da jornada empilhadas como cartões), `--w` (clube e CTA final abrem de um bloco recuado até a largura total), `--sp` (linha de progresso no cabeçalho).
- Revelações com hierarquia (`motion.js`): títulos sobem por máscara, cartões de produto montam disco e embalagem em tempos próprios, mosaico do Instagram abre em janela.
- Zoom-in lento (30 s) nas imagens que serão vídeo: hero, clube, etapas da jornada e abertura/player da página de história.

## Pendências visíveis no protótipo

Os selos `confirmar` / `exemplo` aparecem na tela. Itens principais:
- vídeos e fotos reais;
- vetor do logo;
- embalagem e link do Drip Coffee;
- torra do Delicato moído;
- compatibilidade das cápsulas;
- pontuação SCA por café;
- regra do quiz;
- depoimentos reais;
- e-mail de atendimento;
- frete e parcelamento;
- títulos e textos da história;
- duração dos vídeos;
- nome da fazenda.

## Resultados da verificação (06/10/2026)

- `node scripts/verify.mjs`: 55/55. Cobre os estados do slider (25/50/75 por teclado e arraste), o quiz completo, o filtro, o modal (variação, UTM, foco preso, ESC, clique fora, hash), o bottom sheet (92 %, arrastar para fechar), o clube nos 3 planos, a FAQ, o menu do celular, a barra fixa, a demonstração automática uma vez por sessão, o reduced-motion, a página interna e o axe WCAG 2.2 AA (zero violações) em 1440 e 390 px nas três páginas. Sem sobreposição de título, CTAs e alça em 1440×760, 1920×1080 e 390×844.
- Lighthouse mobile (simulado: 4G lenta + CPU 4×): Acessibilidade 100, Boas práticas 100, SEO 100, Performance 86–87. CLS 0,04 e TBT 0 ms. O LCP simulado fica em 3,3 s, acima da meta de 2,5 s. Medido em Chromium com CPU 4× mais lenta (servidor local, sem throttling de rede), a primeira pintura ocorre em ~370 ms; os 3,3 s vêm quase todos da rede simulada (562 ms de latência por requisição) e do peso da foto do hero, exibida com ~1500 px no retrato por causa do `cover`. Para baixar em produção: CDN/HTTP2 para as imagens e, com os vídeos reais, posters mais leves para o celular.

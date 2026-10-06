// Conteúdos editáveis: depoimentos de exemplo, FAQ e planos do clube.

// [exemplo] Nomes genéricos até o cliente enviar depoimentos reais. Não representam pessoas reais.
export const testimonials = [
  { texto: 'O Delicato virou o café da casa. Macio, cheiroso, e chega sempre fresquinho.', nome: 'Nome do cliente', cidade: 'Cidade/UF' },
  { texto: 'Assino o clube há alguns meses e nunca mais fiquei sem café. A torra é sempre recente.', nome: 'Nome do cliente', cidade: 'Cidade/UF' },
  { texto: 'Comprei o Moderato Intenso para o escritório e todo mundo pergunta qual é o café.', nome: 'Nome do cliente', cidade: 'Cidade/UF' },
  { texto: 'As cápsulas salvam minhas manhãs corridas, e o sabor de avelã é delicioso.', nome: 'Nome do cliente', cidade: 'Cidade/UF' },
  { texto: 'Dei um kit de presente e quem recebeu virou cliente. Atendimento atencioso pelo WhatsApp.', nome: 'Nome do cliente', cidade: 'Cidade/UF' },
];

// Respostas baseadas na loja e na página do clube em 05/10/2026.
export const faq = [
  { q: 'Como faço para comprar?', a: 'Pela loja virtual ou pelo WhatsApp (35) 99956-5000. Na loja, o pagamento é por Pix, boleto ou cartão, com parcelamento em até 6x no cartão.', tbc: true },
  { q: 'Vocês entregam em todo o Brasil?', a: 'Sim, enviamos para todo o Brasil. Compras acima de R$ 199 no estado de SP têm frete grátis.', tbc: true },
  { q: 'Posso cancelar o clube quando quiser?', a: 'Sim. Não há fidelidade: pause ou cancele pela sua conta na loja e a cobrança seguinte não acontece.' },
  { q: 'Como funciona a cobrança do clube?', a: 'No cartão de crédito, automaticamente, a cada ciclo (15, 30 ou 60 dias). O cartão é cadastrado uma única vez, em ambiente seguro.' },
  { q: 'Posso trocar de café no clube?', a: 'Pode. Crie uma nova assinatura com outro café do clube e encerre a anterior. Quantidade e frequência também podem ser ajustadas.' },
  { q: 'Qual a diferença entre grãos e moído?', a: 'O grão guarda o aroma por mais tempo e você mói na hora. O moído já vem pronto para o coador e é mais prático no dia a dia.' },
  { q: 'Qual é o horário de atendimento?', a: 'De segunda a sexta, das 7h30 às 17h30.' },
];

// Planos do clube: só percentuais, sem valores em reais.
export const plans = [
  { nome: 'Plano Quinzenal', freq: 'A cada 15 dias', off: 22, entregas: 12, para: 'Para casas com 2 ou mais pessoas e escritórios', beneficios: ['O melhor preço por pacote do clube', 'Sempre café recém-torrado na despensa'] },
  { nome: 'Plano Mensal', freq: 'A cada 30 dias', off: 20, entregas: 6, para: 'Para quem toma de 1 a 2 xícaras por dia', beneficios: ['O ritmo mais escolhido', 'Cobrança automática no cartão a cada entrega'] },
  { nome: 'Plano Bimestral', freq: 'A cada 60 dias', off: 18, entregas: 3, para: 'Para quem toma café com mais calma', beneficios: ['Menos entregas, mesmo cuidado na torra', 'Cobrança automática no cartão'] },
];

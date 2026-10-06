// Capítulos da página interna "Nossa história". Modelo reutilizável: o hash (#plantio … #xicara) escolhe o capítulo.
// "A colheita" é o exemplo preenchido. Todos os textos são sugestões [confirmar] — sem números, datas ou nomes inventados.
// Base possível para o cliente: notícias da loja "Os apaixonados: muito prazer", "A fazenda",
// "Centenária: a força da tradição que se refaz" e "A paixão: o café como fruto da emoção".

export const chapters = [
  {
    slug: 'plantio', num: '01', eyebrow: 'O plantio', titulo: 'Raízes em Garça',
    abertura: 'Tudo começa na terra, em Garça, no interior de São Paulo. Cada pé de café cresce com paciência e cuidado.',
    imagem: 'plantio', alt: 'Muda de café crescendo na terra vermelha',
    corpo: [
      { p: 'Antes da primeira xícara, existe a terra. É nela que cada muda de café ganha força, raiz por raiz, estação por estação, até se tornar um pé capaz de dar frutos.' },
      { h: 'O tempo da planta' },
      { p: 'Plantar café é um gesto de confiança no futuro. Os primeiros frutos levam tempo para aparecer, e é esse tempo, respeitado sem pressa, que prepara o sabor que vai chegar à sua mesa.' },
    ],
    citacao: 'Cada pé de café cresce com paciência e cuidado.',
    video: { titulo: 'O plantio', poster: 'plantio' },
  },
  {
    slug: 'colheita', num: '02', eyebrow: 'A colheita', titulo: 'No ponto certo',
    abertura: 'Colhido no ponto certo, grão a grão. A paixão de quem planta aparece na cor de cada cereja.',
    imagem: 'colheita', alt: 'Mãos colhendo cerejas de café maduras em um cesto',
    corpo: [
      { p: 'Na Fazenda Santa Cecília, em Garça, a colheita é o momento em que meses de cuidado finalmente ganham cor. Quando as cerejas passam do verde ao vermelho intenso, é sinal de que o fruto chegou ao ponto e o sabor começou a se formar lá dentro.', capitular: true },
      { h: 'O olhar de quem conhece cada pé' },
      { p: 'Nem toda cereja amadurece ao mesmo tempo. Por isso, a colheita pede atenção: escolher o que está maduro, dar mais sol ao que ainda precisa e cuidar para que nada se perca no caminho até o terreiro.' },
      { foto: 'colheita-wide', legenda: 'O cafezal em tempo de colheita, em Garça/SP.', alt: 'Fileiras de cafeeiros carregados de cerejas ao pôr do sol' },
      { p: 'É um trabalho de mãos, de paciência e de olhos treinados. A paixão de quem planta aparece na cor de cada cereja e, mais tarde, no aroma que sobe da sua xícara.' },
      { galeria: [
        { img: 'gal-1', legenda: 'Cerejas maduras recém-colhidas.', alt: 'Mão de luva segurando cerejas de café vermelhas e amarelas' },
        { img: 'gal-2', legenda: 'O cesto se enche aos poucos, grão a grão.', alt: 'Mãos colhendo cerejas em um cesto de palha' },
        { img: 'gal-3', legenda: 'A peneira separa folhas e impurezas.', alt: 'Peneira de palha lançando cerejas de café ao ar' },
        { img: 'gal-4', legenda: 'Do verde ao vermelho: cada cereja no seu tempo.', alt: 'Palma da mão com cerejas de café maduras' },
      ] },
      { h: 'Da peneira ao terreiro' },
      { p: 'Depois de colhidas, as cerejas passam pela peneira, que separa folhas, galhos e impurezas. Só então seguem para o terreiro, onde começa a próxima etapa desta história: a secagem.' },
      { video: true },
    ],
    citacao: 'A paixão de quem planta aparece na cor de cada cereja.',
    video: { titulo: 'A colheita na fazenda', poster: 'colheita' },
  },
  {
    slug: 'secagem', num: '03', eyebrow: 'A secagem', titulo: 'Sem pressa',
    abertura: 'O sol e o tempo transformam o fruto em sabor. Aqui, nada é apressado.',
    imagem: 'secagem', alt: 'Cerejas de café secando ao sol no terreiro',
    corpo: [
      { p: 'No terreiro, as cerejas descansam ao sol e são reviradas com cuidado ao longo dos dias. É assim que a umidade sai devagar e o sabor se concentra no grão.' },
      { h: 'O ritmo do sol' },
      { p: 'Secar café é saber esperar. Apressar essa etapa muda o que vai para a xícara; por isso, aqui o tempo é ingrediente.' },
    ],
    citacao: 'Aqui, nada é apressado.',
    video: { titulo: 'A secagem', poster: 'secagem' },
  },
  {
    slug: 'torra', num: '04', eyebrow: 'A torra', titulo: 'O sabor revelado',
    abertura: 'A torra revela o que o grão guarda: notas de avelã e caramelo. No clube, cada envio entra na fila de torra da semana.',
    imagem: 'torra', alt: 'Grãos recém-torrados caindo no resfriador',
    corpo: [
      { p: 'O grão verde ainda não conta tudo o que sabe. É na torra que aparecem o aroma, a doçura e as notas que fazem cada café Appassionato ser quem é.' },
      { h: 'Torra fresca, sempre' },
      { p: 'Para os assinantes do clube, cada envio entra na fila de torra da semana. Assim, o café chega à sua casa com o frescor de quem acabou de sair do torrador.' },
    ],
    citacao: 'A torra revela o que o grão guarda.',
    video: { titulo: 'A torra', poster: 'torra' },
  },
  {
    slug: 'xicara', num: '05', eyebrow: 'A xícara', titulo: 'O seu momento',
    abertura: 'E chega o seu momento. Um café para criar e fortalecer conexões.',
    imagem: 'xicara', alt: 'Duas pessoas pegando xícaras de café em uma mesa de madeira',
    corpo: [
      { p: 'Depois da terra, da colheita, do sol e da torra, a história chega ao lugar mais importante: a sua mesa. É ali que o café vira conversa, pausa, encontro.' },
      { h: 'Nada como um cafezinho' },
      { p: 'Nada como um cafezinho para criar e fortalecer conexões. Seja na primeira xícara da manhã ou no café da tarde com quem você gosta, esse momento é seu.' },
    ],
    citacao: 'Nada como um cafezinho para criar e fortalecer conexões.',
    video: { titulo: 'O seu momento', poster: 'xicara' },
  },
];

export const bySlug = (s) => chapters.find((c) => c.slug === s);

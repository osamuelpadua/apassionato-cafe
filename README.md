# Appassionato Café — Landing Page

Landing page de página única + modelo de página interna de história ("Da semente à xícara").
Objetivo: levar o visitante à loja virtual ou ao clube de assinaturas.

```bash
npm install
npm run dev      # http://localhost:5180
npm run build    # dist/ estático
```

- `index.html`: home
- `historia.html#colheita`: página interna (troque o hash: plantio, colheita, secagem, torra, xicara)
- `design-system.html`: sistema de design ao vivo
- `docs/IMPLEMENTACAO.md`: notas para o desenvolvedor, decisões e pendências
- `docs/estados/`: capturas dos estados interativos (geradas por `node scripts/verify.mjs`)
- `_ref/` (originais da loja e do Magnific) não é versionado; as imagens otimizadas usadas no site estão em `public/img/`. Para regenerar, rode `npm run assets:fetch` e recoloque os originais gerados em `_ref/gen*`.

Publicado no GitHub Pages via `.github/workflows/deploy.yml` (build a cada push na `main`).

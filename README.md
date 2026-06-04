# MXDRPG — Eldarin

**Site no ar:** https://mxdrpg.vercel.app  
**Saúde:** https://mxdrpg.vercel.app/api/health  

Não use `drpg.vercel.app` — é outro projeto (React App antigo), não este VTT.

| Pasta | O quê |
|-------|--------|
| **`app/`, `components/`, `lib/`** | App Next.js (VTT) — deploy na Vercel na **raiz** do repo |
| `livros/` | Regras e lore |
| `vinite/` | Módulo Foundry |
| `archive/web/` | Legado — não editar; app canônico na raiz |
| `REFATORACAO.md` | Plano de refatoração passo a passo |

## Local

```bash
npm ci
npm run dev
```

http://localhost:3000

**CSS quebrado?** `npm run dev:clean`

## Dados (livros → app)

Depois de editar `livros/`:

```bash
npm run sync:data
npm run sync:data:check
```

Detalhes: [docs/DADOS-E-REGRAS.md](docs/DADOS-E-REGRAS.md)

## Persistência (opcional)

Postgres (Neon): [docs/P0-NEON-SETUP.md](docs/P0-NEON-SETUP.md) — `npm run db:setup` → `npm run smoke:p0`. Pré-beta: [docs/P9-READY.md](docs/P9-READY.md).

## Vercel

- **Root Directory:** *(vazio)*
- **Framework:** Next.js
- **Output Directory:** *(vazio — nunca `public`)*

[VERCEL.md](VERCEL.md) · [DEPLOY.md](DEPLOY.md)

GitHub: https://github.com/MaulXD/MXDRPG.git

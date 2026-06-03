# MXDRPG — Eldarin

**Site no ar:** https://mxdrpg.vercel.app  
**Saúde:** https://mxdrpg.vercel.app/api/health  

Não use `drpg.vercel.app` — é outro projeto (React App antigo), não este VTT.

| Pasta | O quê |
|-------|--------|
| **`app/`, `components/`, `lib/`** | App Next.js (VTT) — deploy na Vercel na **raiz** do repo |
| `livros/` | Regras e lore |
| `vinite/` | Módulo Foundry |
| `web/` | Legado — só cache local; app está na raiz |

## Local

```bash
npm ci
npm run dev
```

http://localhost:3000

**CSS quebrado?** `npm run dev:clean`

## Vercel

- **Root Directory:** *(vazio)*
- **Framework:** Next.js
- **Output Directory:** *(vazio — nunca `public`)*

[VERCEL.md](VERCEL.md) · [DEPLOY.md](DEPLOY.md)

GitHub: https://github.com/MaulXD/MXDRPG.git

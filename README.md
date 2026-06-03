# MXDRPG — Eldarin

| Pasta | O quê |
|-------|--------|
| **`web/`** | App Next.js (VTT) — **é isso que vai na Vercel** |
| `livros/` | Regras e lore |
| `vinite/` | Módulo Foundry |

## Local

```bash
cd web
npm install
npm run dev
```

http://localhost:3000

## Vercel (obrigatório)

**Settings → Build and Deployment:**

- **Root Directory:** `web` ← sem isso = 404
- **Framework:** Next.js
- **Output Directory:** *(vazio — apague `public`)*

Depois **Redeploy** sem cache.

Teste: `https://SEU-SITE.vercel.app/api/health`

Detalhes: [web/VERCEL.md](web/VERCEL.md)

GitHub: https://github.com/MaulXD/MXDRPG.git

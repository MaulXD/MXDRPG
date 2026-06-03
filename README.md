# MXDRPG — Eldarin

| Pasta | O quê |
|-------|--------|
| **`web/`** | App Next.js (VTT) — **é isso que vai na Vercel** |
| `livros/` | Regras e lore |
| `vinite/` | Módulo Foundry |

## Local

Na raiz do repo (ou dentro de `web/`):

```bash
npm run install:web
npm run dev
```

Equivalente manual:

```bash
cd web
npm install
npm run dev
```

http://localhost:3000

**Página sem tema (links azuis, fonte padrão)?** O CSS do Next quebrou no cache. Pare o servidor (Ctrl+C), depois:

```bash
npm run dev:clean
```

(ou apague a pasta `web/.next` manualmente e rode `npm run dev` de novo.)

## Vercel (obrigatório)

**Settings → Build and Deployment:**

- **Root Directory:** `web` ← sem isso = 404
- **Framework:** Next.js
- **Output Directory:** *(vazio — apague `public`; preset deve ser **Next.js**, não Other)*
- Se o build falhar com `public`: em Settings desligue **Override** em Output Directory e redeploy.

Depois **Redeploy** sem cache.

Teste: `https://SEU-SITE.vercel.app/api/health`

Detalhes: [web/VERCEL.md](web/VERCEL.md)

**Importante:** não crie `package-lock.json` na raiz do monorepo (só em `web/`), senão a Vercel avisa “multiple lockfiles”.

GitHub: https://github.com/MaulXD/MXDRPG.git

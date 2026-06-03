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

- **Root Directory:** `web` ← **recomendado**
- **Framework:** Next.js (não Other)
- **Output Directory:** *(vazio — apague `public`; desligue **Override**)*
- **Redeploy** com **Clear Build Cache** (evita lockfile duplicado na raiz)

Se o log mostrar `npm run build --prefix web` e commit antigo, o deploy não pegou o `vercel.json` novo — redeploy em `main` atual.

Depois **Redeploy** sem cache.

Teste: `https://SEU-SITE.vercel.app/api/health`

Detalhes: [web/VERCEL.md](web/VERCEL.md)

**Importante:** não crie `package-lock.json` na raiz do monorepo (só em `web/`), senão a Vercel avisa “multiple lockfiles”.

GitHub: https://github.com/MaulXD/MXDRPG.git

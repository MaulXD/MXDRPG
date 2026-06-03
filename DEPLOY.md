# Deploy Vercel — Eldarin

O app Next.js está na **raiz** do repositório (não em `web/`).

## Configuração

1. [vercel.com/new](https://vercel.com/new) → **MaulXD/MXDRPG**
2. **Root Directory:** *(deixe vazio)*
3. **Framework:** Next.js
4. **Output Directory:** *(vazio)*
5. Deploy → teste `https://mxdrpg.vercel.app/api/health`

## Qual URL abrir?

| URL | O que é |
|-----|---------|
| **https://mxdrpg.vercel.app** | Eldarin (MXDRPG) — correto |
| https://drpg.vercel.app | Outro app (Create React App) — errado |

## Se ainda falhar

- **Clear Build Cache** no redeploy
- Confirme commit recente em **Deployments**
- `drpg.vercel.app` com "React App" = projeto errado no dashboard

## Local

```bash
npm ci
npm run dev
```

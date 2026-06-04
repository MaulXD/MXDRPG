# Deploy Vercel — Eldarin

O app Next.js está na **raiz** do repositório (não em `web/`).

## Configuração

1. [vercel.com/new](https://vercel.com/new) → **MaulXD/MXDRPG**
2. **Root Directory:** *(deixe vazio)*
3. **Framework:** Next.js
4. **Output Directory:** *(vazio)*
5. **Environment Variables** (Production):
   - `DATABASE_URL` — Neon **pooled** connection string (`?sslmode=require`)
   - `SESSION_SECRET` — aleatório 32+ caracteres
   - Clerk — ver [docs/P1-CLERK-SETUP.md](docs/P1-CLERK-SETUP.md)
6. Local: `npx vercel link` → `npx vercel env pull .env.local` → `npm run db:migrate`
7. Deploy → `https://mxdrpg.vercel.app/api/health` → `"db": true`, `"persistence": "postgres"`

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
npm run db:setup   # após colar DATABASE_URL em .env.local
npm run dev
npm run smoke:p0
```

Gate P0: [docs/P0-NEON-SETUP.md](docs/P0-NEON-SETUP.md) · Beta: [docs/BETA-P9-CHECKLIST.md](docs/BETA-P9-CHECKLIST.md)

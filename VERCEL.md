# Deploy Vercel — MXDRPG

O app Next.js está na **raiz do repositório** (não em subpasta). Vercel detecta sozinho.

## Settings (recomendado)

| Campo | Valor |
|-------|--------|
| **Root Directory** | *(vazio — raiz do repo)* |
| **Framework Preset** | Next.js |
| **Output Directory** | *(vazio — nunca `public`)* |
| **Build Command** | *(vazio)* |
| **Install Command** | *(vazio)* |

## Deploy

1. Push `main` no GitHub
2. Deploy **Ready** (verde)
3. Teste: `https://SEU-PROJETO.vercel.app/api/health`

## Local

```bash
npm install
npm run dev
```

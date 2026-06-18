# Deploy — MXDRPG (Contabo / Docker)

Produção: **https://www.mxdrpg.com.br**  
Saúde: **https://www.mxdrpg.com.br/api/health**

O app Next.js fica na **raiz** do repositório. Imagem Docker publicada no push em `main` (GitHub Actions → GHCR → restart no cluster).

## Pipeline (automático)

1. Push em `main` → workflow `.github/workflows/build-image.yml`
2. Build da imagem (`Dockerfile`) → `ghcr.io/<repo>`
3. Webhook reinicia o deployment `mxdrpg` no cluster

## Variáveis de ambiente (servidor)

Obrigatórias para produção real (usuários + salas persistentes):

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Postgres (Neon ou self-hosted) — use endpoint **pooler** se serverless |
| `SESSION_SECRET` | String aleatória 32+ caracteres |
| `NODE_ENV` | `production` |

Opcional — login social (OAuth manual, sem Clerk):

| Variável | Descrição |
|----------|-----------|
| `AUTH_URL` | `https://www.mxdrpg.com.br` (redirect OAuth) |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client (Google Cloud) |
| `GOOGLE_CLIENT_SECRET` | Secret do client Google |
| `DISCORD_CLIENT_ID` | Application ID (Discord Developer) |
| `DISCORD_CLIENT_SECRET` | Secret do app Discord |

Callbacks a cadastrar nos consoles:

- `https://www.mxdrpg.com.br/api/auth/oauth/google/callback`
- `https://www.mxdrpg.com.br/api/auth/oauth/discord/callback`

Sem OAuth: login demo (`mestre` / `jogador`, senha `123`) ou e-mail/senha em `/entrar`.

## Banco

```bash
# Local, com a mesma DATABASE_URL de produção no .env.local:
npm run db:setup
npm run db:migrate
```

Confirme em produção: `"db": true`, `"persistence": "postgres"` no `/api/health`.

## DNS

| Host | Deve apontar para |
|------|-------------------|
| `www.mxdrpg.com.br` | Load balancer / VPS (Contabo) |
| `mxdrpg.com.br` (apex) | Mesmo destino — **não** deixar estacionado na Hostinger |

## Build local (teste)

```bash
npm ci
npm run build
npm start
# http://localhost:3000
```

## Smoke

```bash
SMOKE_BASE_URL=https://www.mxdrpg.com.br npm run smoke:a1
npm run smoke:p0
```

Gate Postgres: [docs/P0-NEON-SETUP.md](docs/P0-NEON-SETUP.md) · Clerk: [docs/P1-CLERK-SETUP.md](docs/P1-CLERK-SETUP.md)

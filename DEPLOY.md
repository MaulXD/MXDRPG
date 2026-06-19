# Deploy — MXDRPG (Contabo / Docker)

Produção: **https://www.mxdrpg.com.br**  
Saúde: **https://www.mxdrpg.com.br/api/health**

O app Next.js fica na **raiz** do repositório. Imagem Docker publicada no push em `main` (GitHub Actions → GHCR → restart no cluster).

## Pipeline (automático)

1. Push em `main` → workflow `.github/workflows/build-image.yml`
2. Build da imagem (`Dockerfile`) → `ghcr.io/<repo>`
3. Webhook reinicia o deployment `mxdrpg` no cluster com a imagem `ghcr.io/maulxd/mxdrpg:sha-<commit>` (evita cache da tag `main`)

Confirme o deploy: `GET /api/health` deve retornar `buildSha` com o commit em execução.

## Variáveis de ambiente (servidor)

Obrigatórias para produção real (usuários + salas persistentes):

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | MariaDB — salas, usuários, personagens, aventuras |
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

**Importante:** `AUTH_URL` deve usar **exatamente** o mesmo host que o usuário abre no navegador (ex.: `https://www.mxdrpg.com.br`, com `www`). O cookie OAuth é por host — se `AUTH_URL` for sem `www` mas o site abrir com `www`, o login Google falha com *Sessão OAuth expirada*. O middleware redireciona apex ↔ www para o host de `AUTH_URL`.

**MariaDB SSL (Contabo):** use `MARIADB_SSL_REJECT_UNAUTHORIZED=0` no env do container. Não use `sslaccept` na URL — o mysql2 ignora e o app já aplica SSL via código.

Sem OAuth: login demo (`mestre` / `jogador`, senha `123`) ou e-mail/senha em `/entrar`.

**Recuperar senha:** cadastre em `/conta` os 5 primeiros dígitos do CPF + data de nascimento; use `/entrar/recuperar`.

## Banco

```bash
# Local, com a mesma DATABASE_URL de produção no .env.local:
npm run db:setup
npm run db:migrate
```

Confirme em produção: `"db": true`, `"persistence": "mariadb"` no `/api/health`.

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

### Erro `mkdir '/app/.next/cache/images'`

O otimizador de imagens do Next precisa gravar em `.next/cache` dentro do container. O `docker-entrypoint.sh` cria essa pasta na subida. Se o cluster usar **filesystem somente leitura**, monte um volume gravável em `/app/.next/cache` (ex.: `emptyDir` no Kubernetes).

## Smoke

```bash
SMOKE_BASE_URL=https://www.mxdrpg.com.br npm run smoke:a1
npm run smoke:p0
```

Gate Postgres: [docs/P0-NEON-SETUP.md](docs/P0-NEON-SETUP.md) · Clerk: [docs/P1-CLERK-SETUP.md](docs/P1-CLERK-SETUP.md)

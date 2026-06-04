# P0 — Neon + Vercel (gate PRD)

> **Objetivo:** produção com `GET /api/health` → `{ "db": true, "persistence": "postgres" }`.  
> Depois: **P1** Clerk, **P9** beta — [PRD-ELDARIN-VTT.md](./PRD-ELDARIN-VTT.md).

## 1. Neon (5 min)

1. [neon.tech](https://neon.tech) → projeto **Eldarin RPG**.
2. **Connect** → escolha **Connection pooling** (hostname com `-pooler`).
3. Copie a URL `postgresql://...?sslmode=require`.

> Em **Vercel/serverless** use sempre o endpoint **pooler**. O endpoint direto (sem `-pooler`) estoura limite de conexões.

## 2. Local (PowerShell)

```powershell
cd D:\Cursor\RPG
npm run db:setup
```

Na primeira vez isso cria `.env.local` a partir de `.env.example` — **cole `DATABASE_URL`** e rode `npm run db:setup` de novo.

Ou manual:

```powershell
Copy-Item .env.example .env.local
# Editar .env.local — DATABASE_URL=postgresql://...@ep-xxx-pooler.../neondb?sslmode=require
npm run db:migrate
npm run db:check
npm run dev
```

Browser: `http://localhost:3000/api/health` → `"db": true`.  
Se `db: false`, a resposta em dev inclui `dbError` com a mensagem do Postgres.

```powershell
npm run smoke:p0
```

## 3. Vercel (mxdrpg)

| Variável | Onde pegar |
|----------|------------|
| `DATABASE_URL` | Neon → pooled connection string |
| `SESSION_SECRET` | string aleatória 32+ chars |
| Clerk (P1) | [P1-CLERK-SETUP.md](./P1-CLERK-SETUP.md) |

Passos:

1. Project **mxdrpg** → Settings → Environment Variables → `DATABASE_URL` (Production + Preview).
2. Na máquina (com [Vercel CLI](https://vercel.com/docs/cli)):

```powershell
npx vercel link
npx vercel env pull .env.local
npm run db:migrate
```

3. Redeploy → `https://mxdrpg.vercel.app/api/health` → `db: true`.
4. `/mestre` → criar sala → redeploy → sala ainda existe (não é `demo`).

## Scripts

| Comando | Ação |
|---------|------|
| `npm run db:setup` | `.env.local` + migrate + check |
| `npm run db:migrate` | schema + migrations + seeds |
| `npm run db:check` | ping + 3 tabelas `eldarin_*` |
| `npm run smoke:p0` | health HTTP (dev ou `SMOKE_BASE_URL`) |

## Código

| Item | Onde |
|------|------|
| URL Neon (SSL, pooler warn) | `lib/db/normalize-url.ts`, `lib/db/client.ts` |
| Schema | `scripts/db/schema.sql` |
| Health | `app/api/health/route.ts` |
| Salas | `lib/db/rooms.ts` — sala `demo` **nunca** no Postgres |

## Falhas comuns

| Sintoma | Fix |
|---------|-----|
| `db: false` + `dbError` | URL errada, SSL, ou migrate não rodou na mesma URL |
| `too many connections` na Vercel | Troque para connection string **-pooler** |
| migrate não acha env | Scripts carregam `.env.local` automaticamente |
| sala some após deploy | `DATABASE_URL` diferente local vs prod |

## P0 / A1 concluído quando

- [ ] Local: `npm run test:a1` OK
- [ ] Prod: `SMOKE_BASE_URL=https://mxdrpg.vercel.app npm run smoke:a1` → health `db: true`
- [ ] Sala criada em `/mestre` sobrevive redeploy

Detalhe gate A1: [A1-NEON-SMOKE.md](./A1-NEON-SMOKE.md). Depois: [BETA-P9-CHECKLIST.md](./BETA-P9-CHECKLIST.md).

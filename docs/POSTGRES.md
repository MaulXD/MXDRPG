# Postgres — Eldarin VTT

Persistência de salas, usuários e fichas quando `DATABASE_URL` está definida. Sem URL: memória + `data/users/registry.json`.

**Setup Neon:** [P0-NEON-SETUP.md](./P0-NEON-SETUP.md).

## Setup rápido

```bash
npm run db:setup
# ou: cp .env.example .env.local → editar DATABASE_URL → npm run db:migrate
npm run dev
npm run smoke:p0
```

`GET /api/health` → `{ ok, app, db, persistence }`. Em desenvolvimento, se `db` for `false`, vem `dbError` com o motivo.

## Neon no servidor

- Use a connection string **pooled** (`-pooler` no host).
- `lib/db/client.ts` limita `max: 1` em `VERCEL` e desliga `prepare` no pooler.
- Rode `npm run db:migrate` uma vez com a **mesma** URL que está no servidor.

## Tabelas

| Tabela | Conteúdo |
|--------|----------|
| `eldarin_users` | Contas (+ `clerk_id`, `nickname` P1) |
| `eldarin_characters` | Fichas JSONB |
| `eldarin_rooms` | Mesa: cena, atores, combate, chat |

Sala `demo` não grava no Postgres.

## Scripts

| Comando | Ação |
|---------|------|
| `npm run db:setup` | Cria `.env.local` se faltar + migrate + check |
| `npm run db:migrate` | Schema + `migrations/*.sql` + seeds |
| `npm run db:check` | Conexão + 3 tabelas |
| `npm run smoke:p0` | HTTP health (local ou prod via `SMOKE_BASE_URL`) |
| `npm run smoke:a1` | Roundtrip sala/ficha + health — [A1-NEON-SMOKE.md](./A1-NEON-SMOKE.md) |
| `npm run test:a1` | `db:check` + `smoke:a1` |

## Código

- `lib/db/client.ts` — `getSql`, `dbPing`
- `lib/db/rooms.ts`, `lib/auth/user-store.ts`, `lib/character/characters.ts`
- Clerk: [P1-CLERK-SETUP.md](./P1-CLERK-SETUP.md)

# Persistência — Eldarin VTT

Salas e usuários podem ser gravados em **Neon Postgres** (ou Postgres compatível). Sem `DATABASE_URL`, o app continua em **memória + arquivos locais** (modo demo).

## Variável de ambiente

| Variável | Onde | Descrição |
|----------|------|-----------|
| `DATABASE_URL` | Servidor → Settings → Environment Variables | Connection string Postgres (Neon recomendado) |

Exemplo Neon (pooled): `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`

## Migrar schema (local ou CI)

```bash
# .env.local com DATABASE_URL
npm run db:migrate
```

`npm run db:setup` ou `db:migrate` aplica `scripts/db/schema.sql` + `scripts/db/migrations/`. Sem `DATABASE_URL`, os scripts falham com instruções (carregam `.env.local` automaticamente).

## Comportamento com / sem banco

| Recurso | Sem `DATABASE_URL` | Com `DATABASE_URL` |
|---------|-------------------|-------------------|
| Sala `demo` | Sempre em memória (reset no restart) | Igual — não persiste |
| Outras salas | Memória do processo (perde no restart) | Postgres + cache em memória |
| Usuários | `data/users/registry.json` + seed | Postgres (`eldarin_users`) + seed no primeiro login |
| Personagens | Demo em memória | `eldarin_characters` + seed no 1º acesso |
| Sync em tempo real | Polling HTTP (como hoje) | Igual — SSE/WebSocket é Passo 5+ |

## Produção (Contabo)

1. Criar projeto Neon e copiar `DATABASE_URL`.
2. No **servidor** (env do container): `DATABASE_URL`, `SESSION_SECRET`.
3. Rodar migrate uma vez (máquina local com a mesma URL, ou copiar env + `npm run db:migrate`).
4. Rebuild da imagem Docker e redeploy.

## Código relevante

- `lib/db/client.ts` — conexão `postgres`
- `lib/db/rooms.ts`, `lib/db/users.ts`, `lib/db/characters.ts`
- `lib/room/internal/registry.ts` — `getRoom` / `persistRoom` com fallback memória
- `lib/auth/user-store.ts` — auth em arquivo ou DB conforme `dbEnabled()`

## Saúde

`GET /api/health` → `{ ok, app, db, persistence }` — `db: true` só se `DATABASE_URL` definida e ping OK.

Setup passo a passo: [P0-NEON-SETUP.md](./P0-NEON-SETUP.md).

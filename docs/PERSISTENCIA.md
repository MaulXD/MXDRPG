# Persistência — Eldarin VTT

Salas e usuários podem ser gravados em **MariaDB** (Contabo ou local). Sem `DATABASE_URL`, o app continua em **memória + arquivos locais** (modo demo).

## Variável de ambiente

| Variável | Onde | Descrição |
|----------|------|-----------|
| `DATABASE_URL` | Servidor / `.env.local` | Connection string MariaDB (`mysql://` ou `mariadb://`) |

Exemplo: `mysql://user:pass@host:3306/eldarin?ssl=true`

## Migrar schema (local ou CI)

```bash
# .env.local com DATABASE_URL
npm run db:migrate
```

`npm run db:setup` ou `db:migrate` aplica `scripts/db/schema.mariadb.sql` + patches. Sem `DATABASE_URL`, os scripts falham com instruções (carregam `.env.local` automaticamente).

## Comportamento com / sem banco

| Recurso | Sem `DATABASE_URL` | Com `DATABASE_URL` |
|---------|-------------------|-------------------|
| Sala `demo` | Sempre em memória (reset no restart) | Igual — não persiste |
| Outras salas | Memória do processo (perde no restart) | MariaDB + cache em memória |
| Usuários | `data/users/registry.json` + seed | MariaDB (`eldarin_users`) + seed no primeiro login |
| Personagens | Demo em memória | `eldarin_characters` + seed no 1º acesso |
| Sync em tempo real | Polling HTTP (como hoje) | Igual — SSE/WebSocket é Passo 5+ |

## Produção (Contabo)

1. Criar banco MariaDB e copiar `DATABASE_URL`.
2. No **servidor** (env do container): `DATABASE_URL`, `SESSION_SECRET`.
3. Rodar migrate uma vez: `npm run db:migrate`.
4. Rebuild da imagem Docker e redeploy.

## Código relevante

- `lib/db/client.ts` — conexão `mysql2`
- `lib/db/rooms.ts`, `lib/db/users.ts`, `lib/db/characters.ts`
- `lib/room/internal/registry.ts` — `getRoom` / `persistRoom` com fallback memória
- `lib/auth/user-store.ts` — auth em arquivo ou DB conforme `dbEnabled()`

## Saúde

`GET /api/health` → `{ ok, app, db, persistence }` — `db: true` e `persistence: "mariadb"` se `DATABASE_URL` definida e ping OK.

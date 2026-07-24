# A1 — Neon prod + persistência (gate)

> **Objetivo:** salas e fichas **não se perdem** após restart/redeploy. Automatizado com `npm run smoke:a1`.

## Checklist A1

### Local (desenvolvimento)

- [ ] Neon: connection string **pooled** (`-pooler` no host)
- [ ] `.env.local` com `DATABASE_URL`
- [ ] `npm run db:setup` (migrate + check)
- [ ] `npm run dev` (terminal separado)
- [ ] `npm run smoke:a1` → `smoke:a1 OK`
- [ ] `/mestre` → criar mesa → mover token → `Ctrl+C` no dev → `npm run dev` → mesa ainda existe

### Produção (Contabo)

- [ ] `DATABASE_URL` em Production (mesma URL do migrate)
- [ ] `npm run db:migrate` com URL de prod (`copiar env do servidor` ou copiar do dashboard)
- [ ] Redeploy
- [ ] `SMOKE_BASE_URL=https://www.mxdrpg.com.br npm run smoke:a1` → health `db: true`
- [ ] Criar sala em `/mestre` → redeploy → sala continua listada

## Comandos

| Comando | O que valida |
|---------|----------------|
| `npm run db:check` | Ping + 3 tabelas |
| `npm run smoke:p0` | Só `GET /api/health` |
| `npm run smoke:a1` | Roundtrip SQL (sala + ficha) + health |
| `npm run test:a1` | `db:check` + `smoke:a1` |

### Só produção (sem DB local)

```powershell
$env:SMOKE_BASE_URL="https://www.mxdrpg.com.br"
npm run smoke:a1
```

(Requer `DATABASE_URL` no servidor; o script pula roundtrip SQL local.)

### Local completo

```powershell
npm run db:migrate
npm run dev
# outro terminal:
npm run smoke:a1
```

## O que o smoke:a1 faz

1. **INSERT** sala de teste em `eldarin_rooms`
2. **UPDATE** com token no mapa + `revision` 2
3. **Novo cliente Postgres** (simula reload do serverless)
4. **SELECT** — confere revision e tokens
5. **UPSERT** + **SELECT** em `eldarin_characters`
6. **DELETE** linhas de teste
7. **GET /api/health** — `db: true`, `persistence: mariadb`

## Comportamento do app

`createRoom` e `persistRoom` gravam no Postgres; falha de DB **propaga erro** (não cria sala “fantasma” só em memória).

## Falhas comuns

| Sintoma | Ação |
|---------|------|
| `db: false` em prod | Migrate na **mesma** URL do servidor; usar pooler |
| `too many connections` | URL com `-pooler` |
| Sala some após deploy | `DATABASE_URL` ausente ou diferente entre migrate e produção |
| smoke:a1 falha no health | Subir `npm run dev` ou setar `SMOKE_BASE_URL` |

## Próximo gate

**A2** — Clerk + nickname ([P1-CLERK-SETUP.md](./P1-CLERK-SETUP.md))
